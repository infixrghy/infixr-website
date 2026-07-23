// astro.config.mjs — the whole build pipeline (replaces the old hand-rolled
// Effect build.ts). Static output only; every page pre-rendered at build time.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://infixr.com",

  // Emit `about.html` / `blog/<slug>.html` (NOT about/index.html) — the exact
  // file shape the old build produced. GH Pages serves them extensionless
  // (/about, /blog/<slug>), which is what every canonical URL + link expects.
  build: {
    format: "file",
    // All CSS inlined into a <style> in each page's head — no render-blocking
    // external stylesheet request (PSI flagged ~690ms mobile on the old site;
    // inlining is a deliberate, kept decision).
    inlineStylesheets: "always",
  },

  // Human-readable output (and closest to the previous build's formatting).
  compressHTML: false,

  // Same port the old dev server used (README points here).
  server: { port: 8765 },
});
