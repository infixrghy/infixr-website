/**
 * build.ts — static site build: src/ → public/
 *
 * Pipeline:
 *   1. wipe public/ for a clean build
 *   2. for each src HTML page: inline @font-face + all CSS into the
 *      <!--CSS_INLINE--> block, inject font + hero preloads, write to public/
 *   3. copy static assets (assets/, js/, manifest, .nojekyll) into public/
 *
 * src/ is the source of truth and is NEVER written to. public/ is generated
 * and gitignored; GitHub Actions builds it and deploys via actions/deploy-pages.
 *
 * Why inline CSS: PSI flagged render-blocking CSS files (~690ms mobile). Inlining
 * removes them from the critical path. Why a build step: keeps src/ clean and
 * editable while shipping an optimized, single-request-per-page artifact.
 *
 * Usage: `bun run build.ts`
 */
import { readFile, writeFile, mkdir, rm, cp, readdir } from "node:fs/promises";
import { join } from "node:path";

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

async function readCss(paths: string[]): Promise<string> {
  const parts: string[] = [];
  for (const p of paths) parts.push(await readFile(p, "utf8"));
  return parts.join("\n");
}

/** Read a src HTML page, inline CSS + inject preloads, write to public/. */
async function processHtml(page: string, css: string): Promise<string> {
  let html = await readFile(join(SRC, page), "utf8");

  // Strip any stray stylesheet/preload links so the build is the only source.
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/rsms\.me">\s*/g, "")
    .replace(/<link rel="stylesheet" href="https:\/\/rsms\.me\/[^"]+">\s*/g, "")
    .replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, "");

  // Preloads injected just inside <head> so they start ASAP.
  // Font: crossorigin required even same-origin. Image: homepage hero only.
  const fontPreload = `<link rel="preload" as="font" type="font/woff2" href="assets/Satoshi-Variable.woff2" crossorigin>`;
  const heroPreload = page === "index.html"
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

  const outPath = join(OUT, page);
  await writeFile(outPath, html);
  return outPath;
}

// 1. clean public/
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// 2. build HTML pages
const coreCss = await readCss(CSS_ORDER);
const pagesCss = await readCss([PAGES_CSS]);

const pages: string[] = [];
pages.push(await processHtml("index.html", coreCss));
pages.push(await processHtml("about.html", coreCss + "\n" + pagesCss));
pages.push(await processHtml("blog.html", coreCss + "\n" + pagesCss));

// 3. copy static assets
for (const d of COPY_DIRS) {
  await cp(join(SRC, d), join(OUT, d), { recursive: true });
}
for (const f of COPY_FILES) {
  await cp(join(SRC, f), join(OUT, f));
}
// .nojekyll: belt-and-suspenders (Actions artifact path doesn't run Jekyll anyway)
await writeFile(join(OUT, ".nojekyll"), "");

const assetCount = (await readdir(join(OUT, "assets"))).length;
console.log("built pages:", pages.join(", "));
console.log(`copied: assets/ (${assetCount} files), js/, manifest.webmanifest, .nojekyll`);
console.log("css inlined:", coreCss.length + pagesCss.length, "bytes (concat)");
