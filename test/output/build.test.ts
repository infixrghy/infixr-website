/**
 * test/output/build.test.ts — assertions over the BUILT site (dist/).
 *
 * The unit layer proves the pure pieces in isolation; this layer proves the
 * whole `astro build` composes them into correct artifacts. It targets the
 * failure class that ships GREEN while silently degraded: a missing asset an
 * <img> references, a malformed speculation-rules block (prerender silently
 * off), a canonical pointing at the wrong host, CSS cascade order breaking
 * the glass-card hover.
 *
 * Runs the REAL build (`astro build`) once in beforeAll, then reads dist/.
 * dist/ is gitignored + regenerated, so writing it here is fine.
 */
import { test, expect, describe, beforeAll } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// import.meta.url, not import.meta.dirname: vitest's SSR transform is only
// guaranteed to provide the url form.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const OUT = join(ROOT, "dist");
// Static passthrough source — every /assets/… URL must resolve to a file here.
const ASSETS_SRC = join(ROOT, "public", "assets");

/** Every built HTML file, root + blog/<slug>. */
const htmlFiles = (): string[] => {
  const top = readdirSync(OUT).filter((f) => f.endsWith(".html")).map((f) => join(OUT, f));
  const blogDir = join(OUT, "blog");
  const posts = existsSync(blogDir)
    ? readdirSync(blogDir).filter((f) => f.endsWith(".html")).map((f) => join(blogDir, f))
    : [];
  return [...top, ...posts];
};
const read = (p: string): string => readFileSync(p, "utf8");

beforeAll(() => {
  // Run the real build in its own process. `astro` is a JS CLI — spawn it via
  // the current node binary (cross-platform; npx.cmd indirection on Windows is
  // flaky under spawnSync).
  const proc = spawnSync(
    process.execPath,
    [join(ROOT, "node_modules", "astro", "bin", "astro.mjs"), "build"],
    { cwd: ROOT }
  );
  if (proc.error) throw proc.error;
  if (proc.status !== 0) {
    throw new Error(
      `astro build failed (exit ${proc.status}):\n${proc.stderr.toString()}\n${proc.stdout.toString()}`
    );
  }
});

describe("build produces the expected page set", () => {
  test("all four root pages + one page per post exist", () => {
    for (const p of ["index.html", "about.html", "services.html", "blog.html"]) {
      expect(existsSync(join(OUT, p))).toBe(true);
    }
    const posts = readdirSync(join(OUT, "blog")).filter((f) => f.endsWith(".html"));
    expect(posts.length).toBeGreaterThanOrEqual(1);
  });
  test("static passthrough lands in dist (CNAME, .nojekyll, manifest, main.js)", () => {
    expect(read(join(OUT, "CNAME"))).toBe("infixr.com\n");
    expect(existsSync(join(OUT, ".nojekyll"))).toBe(true);
    expect(existsSync(join(OUT, "manifest.webmanifest"))).toBe(true);
    expect(existsSync(join(OUT, "js", "main.js"))).toBe(true);
    expect(existsSync(join(OUT, "js", "hero-3d", "loader.js"))).toBe(true);
  });
});

// ── Every asset the built HTML references MUST exist in public/assets. The
//    who-/sol- paths are template-CONSTRUCTED, so this scans BUILT output (a
//    static grep of source would miss them). ──
describe("referenced assets exist", () => {
  test("every assets/<file> URL in built HTML resolves to a real file", () => {
    const referenced = new Set<string>();
    for (const f of htmlFiles()) {
      const html = read(f);
      for (const m of html.matchAll(/assets\/([A-Za-z0-9._-]+\.[a-z0-9]+)/g)) {
        referenced.add(m[1]);
      }
    }
    expect(referenced.size).toBeGreaterThan(0); // sanity: we found some
    const missing = [...referenced].filter((name) => !existsSync(join(ASSETS_SRC, name)));
    expect(missing).toEqual([]);
  });
});

// ── The Speculation Rules block: valid JSON on EVERY page (a malformed block
//    silently disables prerender — no error). ──
describe("speculationrules block is valid JSON on every page", () => {
  test("each page has a block that JSON.parse-es with a prerender rule", () => {
    for (const f of htmlFiles()) {
      const html = read(f);
      const m = html.match(
        /<script type="speculationrules">\s*([\s\S]*?)\s*<\/script>/
      );
      expect(m, `no speculationrules block in ${f}`).not.toBeNull();
      const parsed = JSON.parse(m![1]);
      expect(Array.isArray(parsed.prerender)).toBe(true);
      expect(parsed.prerender[0].eagerness).toBe("moderate");
    }
  });
});

// ── CNAME + hardcoded canonical/OG hosts must agree (deploy checks strings,
//    not a config var — a drift here splits the custom domain). ──
describe("custom-domain host is consistent", () => {
  test("no built HTML carries a canonical/og host other than infixr.com", () => {
    for (const f of htmlFiles()) {
      const html = read(f);
      const metaHosts = [...html.matchAll(
        /(?:rel="canonical" href|property="og:url" content|property="og:image" content|name="twitter:image" content)="https?:\/\/([a-z0-9.-]+)/g
      )].map((m) => m[1]);
      expect(metaHosts.length).toBeGreaterThan(0);
      for (const h of metaHosts) expect(h).toBe("infixr.com");
    }
  });
});

// ── Root-absolute URLs: every page (esp. nested blog/<slug>) must load the
//    font, favicon, and main.js from /… — a relative path one dir deep 404s
//    and silently falls back to system-ui (the caught ~5px-narrower nav CTA
//    from the old base-prefix era). ──
describe("shared asset URLs are root-absolute on every page", () => {
  test("font preload, favicon, and main.js use /-prefixed URLs", () => {
    for (const f of htmlFiles()) {
      const html = read(f);
      expect(html, f).toContain('src="/js/main.js"');
      expect(html, f).toContain('href="/assets/Satoshi-Variable.woff2"');
      expect(html, f).toContain('href="/assets/favicon.svg"');
      // the inlined @font-face must carry the absolute path too
      expect(html, f).toContain("/assets/Satoshi-Variable.woff2)");
    }
  });
});

// ── CSS cascade contract (was a build-time guard in the old build.ts): the
//    glass-card hover background MUST come after the u-card text hover in the
//    inlined CSS — both hit the same element at equal specificity (0,2,0), so
//    source order decides, and glass-card must win or the card's own bg shows
//    through the frost on hover. Order is set by the @import list in
//    src/css/global.css. ──
describe("CSS cascade contract holds in the inlined styles", () => {
  test("glass-card rules come after u-card rules on the homepage", () => {
    const html = read(join(OUT, "index.html"));
    const uCardHover = html.indexOf(".u-card--text");
    const glassCard = html.indexOf(".glass-card{");
    expect(uCardHover, "u-card--text styles missing").toBeGreaterThan(-1);
    expect(glassCard, "glass-card styles missing").toBeGreaterThan(-1);
    expect(glassCard).toBeGreaterThan(uCardHover);
  });
  test("layer order is reset → tokens → layout → components", () => {
    const html = read(join(OUT, "index.html"));
    const pos = (layer: string) => html.indexOf(`@layer ${layer}{`);
    expect(pos("reset")).toBeGreaterThan(-1);
    expect(pos("tokens")).toBeGreaterThan(pos("reset"));
    expect(pos("layout")).toBeGreaterThan(pos("tokens"));
    expect(pos("components")).toBeGreaterThan(pos("layout"));
  });
});

// ── The silent-degradation tell: an unrendered template value leaking to
//    output ("undefined" / "[object Object]" / "NaN" in template-leak
//    contexts). The cheap net under the whole render layer. ──
describe("no unrendered template junk leaks into output", () => {
  test("no page contains undefined / [object Object] / NaN", () => {
    for (const f of htmlFiles()) {
      const html = read(f);
      expect(html, `leaked undefined in ${f}`).not.toMatch(/="undefined"|>undefined<|undefinedundefined/);
      expect(html, `leaked NaN in ${f}`).not.toMatch(/="NaN"|>NaN</);
      expect(html, `[object Object] in ${f}`).not.toContain("[object Object]");
    }
  });
});
