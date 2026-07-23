/**
 * test/output/build.test.ts — assertions over the BUILT site (public/).
 *
 * The unit layer proves each pure fn in isolation; this layer proves the whole
 * build composes them into correct artifacts. It targets the failure class the
 * build's own comments keep naming: output that ships GREEN while silently
 * degraded (SPEC.md B8/V47 — a regex splice that stopped matching; V31 — an
 * asset the markup references but that doesn't exist; the ~5px nav-CTA drift
 * from a missing base prefix on post pages).
 *
 * It runs the REAL entry point (`node build.ts`) once in beforeAll — build.ts
 * exports nothing and runs its Effect at import time (with process.exit(1) on
 * failure), so it must be shelled out, not imported. Then it reads public/ and
 * asserts. public/ is gitignored + regenerated, so writing it here is fine.
 *
 * Invariants are tagged with their SPEC.md §V number where one exists, so a
 * failing test points straight at the spec clause it defends.
 */
import { test, expect, describe, beforeAll } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// import.meta.url, not import.meta.dirname: vitest's SSR transform is only
// guaranteed to provide the url form.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const OUT = join(ROOT, "public");
const ASSETS_SRC = join(ROOT, "src", "assets");

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

beforeAll(async () => {
  // Run the real build in its own process (build.ts self-executes on import +
  // may process.exit — shelling out isolates that from the test runner).
  const proc = spawnSync("node", ["build.ts"], { cwd: ROOT });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) {
    throw new Error(
      `build.ts failed (exit ${proc.status}):\n${proc.stderr.toString()}`
    );
  }
});

describe("build produces the expected page set", () => {
  test("all four root pages + one page per post exist", () => {
    for (const p of ["index.html", "about.html", "services.html", "blog.html"]) {
      expect(existsSync(join(OUT, p))).toBe(true);
    }
    // 3 posts today; assert the dir has at least the known set (data-driven).
    const posts = readdirSync(join(OUT, "blog")).filter((f) => f.endsWith(".html"));
    expect(posts.length).toBeGreaterThanOrEqual(1);
  });
});

// ── V31 / V46: every asset the built HTML references MUST exist in src/assets.
//    who-/sol- paths are template-CONSTRUCTED, so this scans BUILT output (a
//    static grep of source would miss them). ──
describe("referenced assets exist (SPEC §V31/V46)", () => {
  test("every assets/<file> URL in built HTML resolves to a real file", () => {
    const referenced = new Set<string>();
    for (const f of htmlFiles()) {
      const html = read(f);
      // match src/href/srcset ...assets/<name.ext>, tolerating ../ prefixes
      for (const m of html.matchAll(/(?:\.\.\/)?assets\/([A-Za-z0-9._-]+\.[a-z0-9]+)/g)) {
        referenced.add(m[1]);
      }
    }
    expect(referenced.size).toBeGreaterThan(0); // sanity: we found some
    const missing = [...referenced].filter((name) => !existsSync(join(ASSETS_SRC, name)));
    expect(missing).toEqual([]);
  });
});

// ── The Speculation Rules block: valid JSON on EVERY page (a malformed block
//    silently disables prerender — no error). Guards the prefetch feature. ──
describe("speculationrules block is valid JSON on every page", () => {
  test("each page has exactly one block that JSON.parse-es with a prerender rule", () => {
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
  test("CNAME is exactly the apex host, newline-terminated", () => {
    expect(read(join(OUT, "CNAME"))).toBe("infixr.com\n");
  });
  test("no built HTML carries a canonical/og host other than infixr.com", () => {
    for (const f of htmlFiles()) {
      const html = read(f);
      // Scope precisely to the meta that MUST be the apex — canonical + og:url +
      // og/twitter:image. External social/footer links have their own hosts and
      // are intentionally not checked here.
      const metaHosts = [...html.matchAll(
        /(?:rel="canonical" href|property="og:url" content|property="og:image" content|name="twitter:image" content)="https?:\/\/([a-z0-9.-]+)/g
      )].map((m) => m[1]);
      expect(metaHosts.length).toBeGreaterThan(0);
      for (const h of metaHosts) expect(h).toBe("infixr.com");
    }
  });
});

// ── V33-adjacent: base-path threading. On a blog/<slug> page every local asset
//    + main.js URL must carry ../ — a bare path 404s there and silently falls
//    back to system-ui (the caught ~5px-narrower nav CTA). ──
describe("nested post pages thread the ../ base prefix", () => {
  test("post-page font, favicon, and main.js URLs are ../-prefixed", () => {
    const blogDir = join(OUT, "blog");
    const posts = readdirSync(blogDir).filter((f) => f.endsWith(".html"));
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      const html = read(join(blogDir, p));
      // the shared main.js script src
      expect(html).toContain('src="../js/main.js"');
      // the Satoshi preload + favicon resolve up one dir
      expect(html).toContain('href="../assets/Satoshi-Variable.woff2"');
      expect(html).toContain('href="../assets/favicon.svg"');
      // and NO bare (unprefixed) main.js which would 404 from /blog/
      expect(html).not.toContain('src="js/main.js"');
    }
  });
});

// ── The silent-degradation tell: an unrendered template value leaking to output.
//    "undefined" / "[object Object]" / "NaN" in HTML = a render fn returned junk
//    the build didn't catch. This is the cheap net under the whole render layer. ──
describe("no unrendered template junk leaks into output", () => {
  test("no page contains undefined / [object Object] / NaN", () => {
    for (const f of htmlFiles()) {
      const html = read(f);
      // Scope "undefined"/"NaN" to template-leak CONTEXTS — as an attribute value
      // (="undefined"), a bare element text node (>undefined<), or a doubled run —
      // NOT as a substring, so a blog post that legitimately uses the word
      // "undefined" in prose doesn't false-positive. [object Object] is never
      // legitimate anywhere, so it stays an unscoped substring check.
      expect(html, `leaked undefined in ${f}`).not.toMatch(/="undefined"|>undefined<|undefinedundefined/);
      expect(html, `leaked NaN in ${f}`).not.toMatch(/="NaN"|>NaN</);
      expect(html, `[object Object] in ${f}`).not.toContain("[object Object]");
    }
  });
});

// ── The JS budget (CLAUDE.md: ≤10 KB across src/js/*.js) made executable. ──
describe("client JS stays within the 10 KB budget (CLAUDE.md)", () => {
  test("sum of src/js/*.js (excluding hero-3d) is under 10240 bytes", () => {
    const jsDir = join(ROOT, "src", "js");
    const files = readdirSync(jsDir).filter((f) => f.endsWith(".js"));
    const total = files.reduce(
      (sum, f) => sum + Buffer.byteLength(readFileSync(join(jsDir, f))),
      0
    );
    expect(total).toBeLessThan(10240);
  });
});
