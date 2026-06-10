/**
 * build.ts — static site build: src/ (templates + partials + meta) → public/
 *
 * Effect pipeline (templating refactor):
 *   1. wipe public/ for a clean build
 *   2. for each page: decode its PageMeta (Schema) → assemble the shell
 *      (head + nav + body + footer) from shared templates → inline @font-face +
 *      all CSS into the <!--CSS_INLINE--> block → inject font/hero preloads →
 *      write to public/
 *   3. copy static assets (assets/, js/, manifest, .nojekyll) into public/
 *
 * Shared chrome (head/nav/footer) is now rendered ONCE from src/templates/*, so
 * the old three-hand-copies drift (missing Home link, stale year, divergent
 * footer links) is structurally impossible. Page bodies are typed render fns
 * co-located with their head meta under src/pages/<page>/ (body.ts + meta.ts); the
 * blog body is data-driven from content/posts/*.md (see renderBlogBody). The shared
 * post data layer (loadPosts) lives in src/content.ts.
 *
 * src/ is the source of truth and is NEVER written to. public/ is generated and
 * gitignored; GitHub Actions builds it and deploys via actions/deploy-pages.
 *
 * Why inline CSS: PSI flagged render-blocking CSS files (~690ms mobile). Inlining
 * removes them from the critical path. Why Effect: Schema-validates page metadata
 * (no null — Option for absent fields) and gives typed errors for missing files /
 * bad front-matter, so a malformed page fails the build, not the browser.
 *
 * Usage: `bun run build.ts`  (no args — the .claude auto-build hook depends on this)
 */
import { Effect, Schema } from "effect";
import { readFile, writeFile, mkdir, rm, cp, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Typed IO errors. Every filesystem op below is wrapped in `Effect.tryPromise`
 * whose `catch` maps the raw rejection into one of these — so a failure rides
 * the Effect error channel as a tagged, LOCATED value (which path, what kind),
 * not an untyped defect. `Effect.gen` short-circuits on the first one, aborting
 * the build with a precise message instead of a bare ENOENT stack. `cause`
 * carries the underlying error.
 */
class FileReadError extends Schema.TaggedErrorClass<FileReadError>()("FileReadError", {
  path: Schema.String,
  cause: Schema.Defect(),
}) {}
class FileWriteError extends Schema.TaggedErrorClass<FileWriteError>()("FileWriteError", {
  path: Schema.String,
  cause: Schema.Defect(),
}) {}
class DirError extends Schema.TaggedErrorClass<DirError>()("DirError", {
  path: Schema.String,
  op: Schema.Literals(["rm", "mkdir"]),
  cause: Schema.Defect(),
}) {}
class CopyError extends Schema.TaggedErrorClass<CopyError>()("CopyError", {
  from: Schema.String,
  to: Schema.String,
  cause: Schema.Defect(),
}) {}
class ReadDirError extends Schema.TaggedErrorClass<ReadDirError>()("ReadDirError", {
  path: Schema.String,
  cause: Schema.Defect(),
}) {}

// ── tagged-IO helpers: each wraps a node:fs/promises op in Effect.tryPromise,
//    tagging the failure with its path. These are the only IO entry points used
//    below, so every filesystem touch is typed at the error channel. ──
const readFileT = (path: string) =>
  Effect.tryPromise({
    try: () => readFile(path, "utf8"),
    catch: (cause) => new FileReadError({ path, cause }),
  });
const writeFileT = (path: string, data: string) =>
  Effect.tryPromise({
    try: () => writeFile(path, data),
    catch: (cause) => new FileWriteError({ path, cause }),
  });
const mkdirT = (path: string) =>
  Effect.tryPromise({
    try: () => mkdir(path, { recursive: true }),
    catch: (cause) => new DirError({ path, op: "mkdir", cause }),
  });
const rmT = (path: string) =>
  Effect.tryPromise({
    try: () => rm(path, { recursive: true, force: true }),
    catch: (cause) => new DirError({ path, op: "rm", cause }),
  });
const cpT = (from: string, to: string) =>
  Effect.tryPromise({
    try: () => cp(from, to, { recursive: true }),
    catch: (cause) => new CopyError({ from, to, cause }),
  });
const readdirT = (path: string) =>
  Effect.tryPromise({
    try: () => readdir(path),
    catch: (cause) => new ReadDirError({ path, cause }),
  });

import { decodePageMeta, type PageMeta } from "./src/schema/page.ts";
import { renderHead } from "./src/templates/head.ts";
import { renderNav } from "./src/components/nav/nav.ts";
import { renderFooter } from "./src/components/footer/footer.ts";
import { indexMeta } from "./src/pages/index/meta.ts";
import { aboutMeta } from "./src/pages/about/meta.ts";
import { blogMeta } from "./src/pages/blog/meta.ts";
import { renderHomeBody } from "./src/pages/index/body.ts";
import { renderAboutBody } from "./src/pages/about/body.ts";
import { renderBlogBody, renderPost, postPageMeta } from "./src/pages/blog/body.ts";
import { loadPosts } from "./src/content.ts";

const SRC = "src";
const OUT = "public";

// Component CSS — co-located under src/components/<name>/. THE ORDER OF THIS
// ARRAY IS THE CASCADE CONTRACT: it reproduces the top-to-bottom rule order the
// old monolithic components.css had, which several rules depend on (equal
// specificity → later-in-source wins; media queries add no specificity). Edit
// with care — do NOT alphabetise or derive from a dir scan. Notably:
//   • glass-card loads AFTER u-card (glass:hover overrides .u-card--text:hover);
//   • u-card.overrides loads AFTER glass-card (the --neon-fill white-title
//     override for photo cards must win over the glass + base-u-card neon rules).
// (Was one src/css/components.css block — split for source co-location; output
// is rule-order-identical, only extra @layer-component wrappers differ. Each
// file self-wraps `@layer components {}`; same-named layers merge in order.)
const COMPONENT_CSS = [
  "src/components/typography/typography.css",
  "src/components/cursor/cursor.css",
  "src/components/nav/nav.css",
  "src/components/button/button.css",
  "src/components/hero/hero.css",
  "src/components/carousel/carousel.css",
  "src/components/u-card/u-card.css",
  "src/components/glass-card/glass-card.css",
  "src/components/u-card/u-card.overrides.css",
  "src/components/contact/contact.css",
  "src/components/footer/footer.css",
];

const CSS_ORDER = [
  "src/css/reset.css",
  "src/css/tokens.css",
  "src/css/layout.css",
  ...COMPONENT_CSS,
];
const PAGES_CSS = "src/css/pages.css";

// Static dirs/files copied verbatim from src/ into public/.
const COPY_DIRS = ["assets", "js"];
const COPY_FILES = ["manifest.webmanifest"];

const FONT_FACE = `
@font-face {
  font-family: 'Satoshi';
  font-style: normal;
  font-weight: 300 900;
  font-display: swap;
  src: url('assets/Satoshi-Variable.woff2') format('woff2-variations'),
       url('assets/Satoshi-Variable.woff2') format('woff2');
}
@font-face {
  font-family: 'Satoshi';
  font-style: italic;
  font-weight: 300 900;
  font-display: swap;
  src: url('assets/Satoshi-VariableItalic.woff2') format('woff2-variations'),
       url('assets/Satoshi-VariableItalic.woff2') format('woff2');
}
`;

const START = "<!--CSS_INLINE_START-->";
const END = "<!--CSS_INLINE_END-->";

/** Read + concatenate CSS files in cascade order. Each read is tagged
 *  (FileReadError) so a missing CSS file fails the build with its path. */
const readCss = (paths: string[]): Effect.Effect<string, FileReadError> =>
  Effect.gen(function* () {
    const parts: string[] = [];
    for (const p of paths) parts.push(yield* readFileT(p));
    return parts.join("\n");
  });

/**
 * Assemble a full HTML document from the shared templates + a body string.
 * Reproduces the source byte structure exactly: doctype, html, head, then
 * `<body>` + blank line + header + blank line + body + blank line + footer +
 * blank line + main.js script + body/html close + trailing newline.
 *
 * `isHome` switches nav/footer section links between same-page anchors and
 * cross-page `index.html#…`. The main.js script ships on every page now so the
 * single shared `<span id="year">` is stamped site-wide (each behavior no-ops
 * where its target is absent: form on non-contact pages, carousel off the home).
 */
function assembleShell(
  meta: PageMeta,
  body: string,
  isHome: boolean,
  base = ""
): string {
  const head = renderHead(meta, base);
  const nav = renderNav(meta.nav, isHome, base);
  const footer = renderFooter(isHome, base);
  return (
    `<!doctype html>\n<html lang="en">\n` +
    head +
    `\n<body>\n\n` +
    nav +
    `\n\n` +
    body +
    `\n\n` +
    footer +
    `\n\n<script src="${base}js/main.js" defer></script>\n</body>\n</html>\n`
  );
}

/**
 * Inline CSS into the markers + inject preloads. Ported verbatim from the prior
 * processHtml so output stays byte-identical: same link-strip, same preload
 * injection (font always; hero image on index only), same marker replacement.
 */
function inlineAndPreload(
  html: string,
  css: string,
  isHome: boolean,
  base = ""
): string {
  // Strip any stray stylesheet/preload links so the build is the only source.
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/rsms\.me">\s*/g, "")
    .replace(/<link rel="stylesheet" href="https:\/\/rsms\.me\/[^"]+">\s*/g, "")
    .replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, "");

  // Preloads injected just inside <head> so they start ASAP.
  // Font: crossorigin required even same-origin. (No hero-image preload: the real
  // LCP — hero-headset webp — is already eager + fetchpriority=high in the body
  // markup; the old hero2 preload was a ghost with no on-page consumer, V45/B8.)
  const fontPreload = `<link rel="preload" as="font" type="font/woff2" href="${base}assets/Satoshi-Variable.woff2" crossorigin>`;
  html = html.replace(/<head>([\s\S]*?)<title>/, (_m, headInside) => {
    const cleaned = headInside
      .replace(/\s*<link rel="preload" as="font"[^>]*>/g, "")
      .replace(/\s*<link rel="preload" as="image"[^>]*>/g, "");
    return `<head>\n  ${fontPreload}${cleaned}<title>`;
  });

  const block = `${START}\n<style>${FONT_FACE}\n${css}\n</style>\n${END}`;
  if (html.includes(START) && html.includes(END)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  } else {
    html = html.replace(/<\/head>/, `${block}\n</head>`);
  }
  return html;
}

/** Decode raw page-meta config → validated PageMeta (typed failure on bad data). */
const metaOf = (raw: unknown) => decodePageMeta(raw);

/**
 * Build one page end-to-end as an Effect: decode meta → assemble shell → inline
 * CSS + preloads → write to public/<page>. Returns the output path.
 */
const buildPage = (
  page: string,
  raw: unknown,
  body: string,
  css: string,
  isHome: boolean,
  base = ""
) =>
  Effect.gen(function* () {
    const meta = yield* metaOf(raw);
    const shell = assembleShell(meta, body, isHome, base);
    const html = inlineAndPreload(shell, css, isHome, base);
    const outPath = join(OUT, page);
    yield* writeFileT(outPath, html);
    return outPath;
  });

const program = Effect.gen(function* () {
  // 1. clean public/
  yield* rmT(OUT);
  yield* mkdirT(OUT);

  // CSS bundles: index gets core only; about/blog get core + pages.css.
  const coreCss = yield* readCss(CSS_ORDER);
  const pagesCss = yield* readCss([PAGES_CSS]);

  // Page bodies: all three are render fns under src/pages/<page>/body.ts (about was
  // a static partial until its CTA moved to the typed button() component — a .html
  // file can't call a TS fn). index + blog also pull the latest posts (home into its
  // blog mosaic — see pages/index/body.ts). loadPosts is the shared data layer in
  // src/content.ts (was src/blog.ts — extracted so it's not owned by the blog page).
  const aboutBody = renderAboutBody();
  const posts = yield* loadPosts;
  const indexBody = renderHomeBody(posts);
  const blogBody = renderBlogBody(posts);

  // 2. build HTML pages
  const pages: string[] = [];
  pages.push(yield* buildPage("index.html", indexMeta, indexBody, coreCss, true));
  pages.push(
    yield* buildPage("about.html", aboutMeta, aboutBody, coreCss + "\n" + pagesCss, false)
  );
  pages.push(
    yield* buildPage("blog.html", blogMeta, blogBody, coreCss + "\n" + pagesCss, false)
  );

  // 2b. build one page per post at blog/<slug>.html. base="../" so the shared
  // head/nav/footer + font preload + main.js resolve from one directory deep.
  // Post pages get core + pages.css (the .prose long-form rules live in pages.css).
  yield* mkdirT(join(OUT, "blog"));
  const postCss = coreCss + "\n" + pagesCss;
  for (const post of posts) {
    pages.push(
      yield* buildPage(
        join("blog", `${post.slug}.html`),
        postPageMeta(post),
        renderPost(post),
        postCss,
        false,
        "../"
      )
    );
  }

  // 3. copy static assets
  for (const d of COPY_DIRS) {
    yield* cpT(join(SRC, d), join(OUT, d));
  }
  for (const f of COPY_FILES) {
    yield* cpT(join(SRC, f), join(OUT, f));
  }
  // .nojekyll: belt-and-suspenders (Actions artifact path doesn't run Jekyll anyway)
  yield* writeFileT(join(OUT, ".nojekyll"), "");

  const assetCount = (yield* readdirT(join(OUT, "assets"))).length;
  console.log("built pages:", pages.join(", "));
  console.log(
    `copied: assets/ (${assetCount} files), js/, manifest.webmanifest, .nojekyll`
  );
  console.log("css inlined:", coreCss.length + pagesCss.length, "bytes (concat)");
  console.log("blog posts rendered:", posts.length);
});

// Run. Schema/IO failures print a typed error and exit non-zero (fails CI/hook).
Effect.runPromise(
  program.pipe(
    Effect.tapCause((cause) =>
      Effect.sync(() => console.error(String(cause)))
    )
  )
).catch(() => process.exit(1));
