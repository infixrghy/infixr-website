/**
 * build.ts — inline all CSS + the @font-face block into each HTML <head>.
 *
 * Why: PSI flagged 5 render-blocking CSS files (~690 ms est savings on mobile).
 * Inlining removes them from the critical path entirely. Re-run after editing
 * any CSS or the font setup. The HTML files are the source of truth committed;
 * this script overwrites the marked block in-place.
 *
 * Usage: `bun run build.ts`
 */
import { readFile, writeFile } from "node:fs/promises";

const CSS_ORDER = [
  "css/reset.css",
  "css/tokens.css",
  "css/layout.css",
  "css/components.css",
];
const PAGES_CSS = "css/pages.css";

const FONT_FACE = `
@font-face {
  font-family: 'Inter var';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('assets/InterVariable.woff2') format('woff2-variations'),
       url('assets/InterVariable.woff2') format('woff2');
}
`;

const START = "<!--CSS_INLINE_START-->";
const END = "<!--CSS_INLINE_END-->";

async function readCss(paths: string[]): Promise<string> {
  const parts: string[] = [];
  for (const p of paths) parts.push(await readFile(p, "utf8"));
  return parts.join("\n");
}

async function processHtml(file: string, css: string) {
  let html = await readFile(file, "utf8");

  // Strip existing <link rel="stylesheet" href="css/...> and rsms.me Inter link
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/rsms\.me">\s*/g, "")
    .replace(/<link rel="stylesheet" href="https:\/\/rsms\.me\/[^"]+">\s*/g, "")
    .replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, "")
    .replace(/<link rel="preload" as="font"[^>]*>\s*/g, "");

  // Preloads — injected just inside <head> so they start ASAP.
  // Font: crossorigin attr required even for same-origin font preloads.
  // Image: only on the homepage (it's the only page with a hero image).
  const fontPreload = `<link rel="preload" as="font" type="font/woff2" href="assets/InterVariable.woff2" crossorigin>`;
  const heroPreload = file === "index.html"
    ? `\n  <link rel="preload" as="image" type="image/webp" href="assets/hero2-1600.webp" imagesrcset="assets/hero2-900.webp 900w, assets/hero2-1600.webp 1600w" imagesizes="100vw" fetchpriority="high">`
    : "";
  html = html.replace(/<head>([\s\S]*?)<title>/, (m, headInside) => {
    const cleaned = headInside
      .replace(/\s*<link rel="preload" as="font"[^>]*>/g, "")
      .replace(/\s*<link rel="preload" as="image"[^>]*>/g, "");
    return `<head>\n  ${fontPreload}${heroPreload}${cleaned}<title>`;
  });

  const block = `${START}\n<style>${FONT_FACE}\n${css}\n</style>\n${END}`;

  if (html.includes(START) && html.includes(END)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  } else {
    // Inject before </head>
    html = html.replace(/<\/head>/, `${block}\n</head>`);
  }

  await writeFile(file, html);
  return file;
}

const coreCss = await readCss(CSS_ORDER);
const pagesCss = await readCss([PAGES_CSS]);

const results: string[] = [];
results.push(await processHtml("index.html", coreCss));
results.push(await processHtml("about.html", coreCss + "\n" + pagesCss));
results.push(await processHtml("blog.html", coreCss + "\n" + pagesCss));

console.log("inlined:", results.join(", "));
console.log("size:", coreCss.length + pagesCss.length, "bytes (concat)");
