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
 * footer links) is structurally impossible. Page bodies stay as static HTML
 * partials (src/pages/*.body.html); the blog body is data-driven from
 * content/posts/*.md (see renderBlogBody).
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

import { decodePageMeta, type PageMeta } from "./src/schema/page.ts";
import { renderHead } from "./src/templates/head.ts";
import { renderNav } from "./src/templates/nav.ts";
import { renderFooter } from "./src/templates/footer.ts";
import { indexMeta } from "./src/pages/index.ts";
import { aboutMeta } from "./src/pages/about.ts";
import { blogMeta } from "./src/pages/blog.ts";
import { renderBlogBody, renderPost, postPageMeta, loadPosts } from "./src/blog.ts";
import { renderHomeBody } from "./src/home.ts";
import { renderAboutBody } from "./src/about.ts";

const SRC = "src";
const OUT = "public";

const CSS_ORDER = [
  "src/css/reset.css",
  "src/css/tokens.css",
  "src/css/layout.css",
  "src/css/components.css",
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

/** Read + concatenate CSS files in cascade order. */
async function readCss(paths: string[]): Promise<string> {
  const parts: string[] = [];
  for (const p of paths) parts.push(await readFile(p, "utf8"));
  return parts.join("\n");
}

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
  // Font: crossorigin required even same-origin. Image: homepage hero only.
  const fontPreload = `<link rel="preload" as="font" type="font/woff2" href="${base}assets/Satoshi-Variable.woff2" crossorigin>`;
  const heroPreload = isHome
    ? `\n  <link rel="preload" as="image" type="image/webp" href="assets/hero2-1600.webp" imagesrcset="assets/hero2-900.webp 900w, assets/hero2-1600.webp 1600w" imagesizes="100vw" fetchpriority="high">`
    : "";
  html = html.replace(/<head>([\s\S]*?)<title>/, (_m, headInside) => {
    const cleaned = headInside
      .replace(/\s*<link rel="preload" as="font"[^>]*>/g, "")
      .replace(/\s*<link rel="preload" as="image"[^>]*>/g, "");
    return `<head>\n  ${fontPreload}${heroPreload}${cleaned}<title>`;
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
    yield* Effect.promise(() => writeFile(outPath, html));
    return outPath;
  });

const program = Effect.gen(function* () {
  // 1. clean public/
  yield* Effect.promise(() => rm(OUT, { recursive: true, force: true }));
  yield* Effect.promise(() => mkdir(OUT, { recursive: true }));

  // CSS bundles: index gets core only; about/blog get core + pages.css.
  const coreCss = yield* Effect.promise(() => readCss(CSS_ORDER));
  const pagesCss = yield* Effect.promise(() => readCss([PAGES_CSS]));

  // Page bodies: all three are now render fns (about was a static partial until its
  // CTA moved to the typed button() component — a .html file can't call a TS fn, so
  // it became renderAboutBody, mirroring the index→home.ts promotion). index + blog
  // also pull the latest posts (home into its blog mosaic — see src/home.ts).
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
  yield* Effect.promise(() => mkdir(join(OUT, "blog"), { recursive: true }));
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
    yield* Effect.promise(() => cp(join(SRC, d), join(OUT, d), { recursive: true }));
  }
  for (const f of COPY_FILES) {
    yield* Effect.promise(() => cp(join(SRC, f), join(OUT, f)));
  }
  // .nojekyll: belt-and-suspenders (Actions artifact path doesn't run Jekyll anyway)
  yield* Effect.promise(() => writeFile(join(OUT, ".nojekyll"), ""));

  const assetCount = (yield* Effect.promise(() => readdir(join(OUT, "assets")))).length;
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
    Effect.tapErrorCause((cause) =>
      Effect.sync(() => console.error(String(cause)))
    )
  )
).catch(() => process.exit(1));
