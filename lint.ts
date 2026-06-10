/**
 * lint.ts — dead-token check (V26).
 *
 * Reads css/tokens.css, extracts every --var declaration, then greps the rest
 * of the CSS for `var(--<name>)`. Any token defined but never referenced is
 * reported. Exit code 1 if dead tokens found.
 *
 * Consumers = the shared non-component CSS (pages/layout/reset) PLUS every
 * co-located component CSS under src/components/ (since components.css was split
 * + moved there). Component-local custom props (e.g. .glass-card --gc-*) are
 * exempted from orphan-ref checks below — V26 only governs tokens.css tokens.
 *
 * Usage: `bun run lint.ts`
 */
import { readFile } from "node:fs/promises";
import { Glob } from "bun";

const TOKENS_FILE = "src/css/tokens.css";
// Two globs, NOT one nested-brace pattern: Bun's Glob does not expand nested
// `{…{…}…}` braces (it silently matches nothing). Scanned in turn below.
const CONSUMER_GLOBS = [
  "src/css/{pages,layout,reset}.css",
  "src/components/**/*.css",
];

const tokensSrc = await readFile(TOKENS_FILE, "utf8");

// Match `--name: value;` declarations only (not `var(--name)` references).
const declared = new Set<string>();
for (const m of tokensSrc.matchAll(/--([a-z][a-z0-9-]*)\s*:/gi)) {
  declared.add(m[1]);
}

let consumerSrc = "";
for (const pattern of CONSUMER_GLOBS) {
  for await (const file of new Glob(pattern).scan(".")) {
    consumerSrc += await readFile(file, "utf8");
  }
}

const referenced = new Set<string>();
for (const m of consumerSrc.matchAll(/var\(--([a-z][a-z0-9-]*)/gi)) {
  referenced.add(m[1]);
}
// Self-refs within tokens.css count too (derivative chains)
for (const m of tokensSrc.matchAll(/var\(--([a-z][a-z0-9-]*)/gi)) {
  referenced.add(m[1]);
}

// Component-local custom props declared INSIDE a consumer file (e.g. `.card { --offset: … }`)
// are not design tokens — they're local state. Exempt them from orphan-ref checks so a
// legit local var() doesn't false-positive. (V26 only governs tokens.css design tokens.)
const localProps = new Set<string>();
for (const m of consumerSrc.matchAll(/--([a-z][a-z0-9-]*)\s*:/gi)) {
  localProps.add(m[1]);
}

const dead = [...declared].filter((t) => !referenced.has(t)).sort();
const orphanRefs = [...referenced]
  .filter((r) => !declared.has(r) && !localProps.has(r))
  .sort();

console.log(`tokens declared: ${declared.size}`);
console.log(`tokens referenced: ${referenced.size}`);

if (dead.length) {
  console.warn(`\n⚠ dead tokens (defined, never used):`);
  for (const t of dead) console.warn(`  --${t}`);
}
if (orphanRefs.length) {
  console.warn(`\n⚠ orphan var() refs (used, never defined):`);
  for (const r of orphanRefs) console.warn(`  --${r}`);
}

if (dead.length === 0 && orphanRefs.length === 0) {
  console.log("✓ no dead tokens, no orphan refs");
}

// ── V46 dead-asset pass: assets/ is copied WHOLESALE into public/ (V31), so an
//    unreferenced file ships forever. This pass runs over BUILT output, NOT src/:
//    who-/sol- image paths are template-constructed (`assets/${s.img}.webp`) so the
//    literal filename never appears in src; og-image is referenced by ABSOLUTE URL
//    (filename-match, not path-match) — only the emitted public/*.html carries the
//    real literals. A preload is a HINT not a USE (B8: a ghost preload would self-
//    justify its own dead asset), so preload <link> hrefs are stripped before the
//    reference scan — an asset must have a NON-preload consumer to survive. ──
const OUT = "public";
const ASSETS_DIR = `${OUT}/assets`;

let assetFails = 0;
try {
  // Built files that may reference an asset: HTML (img/src/srcset/inline-CSS url()),
  // js (none today, but a future sprite/lazy-loader could), manifest (icon paths).
  let builtSrc = "";
  for await (const file of new Glob(`${OUT}/**/*.{html,js,webmanifest}`).scan(".")) {
    builtSrc += await readFile(file, "utf8");
  }
  // Strip preload <link> tags so their hrefs don't count as a "use" (V46/B8).
  const builtNoPreload = builtSrc.replace(/<link\b[^>]*\brel="preload"[^>]*>/gi, "");

  const assetFiles: string[] = [];
  for await (const f of new Glob(`${ASSETS_DIR}/*`).scan(".")) {
    // basename: the literal that template-constructed refs + absolute URLs both carry.
    assetFiles.push(f.split(/[\\/]/).pop()!);
  }

  const deadAssets = assetFiles
    .filter((name) => !builtNoPreload.includes(name))
    .sort();

  console.log(`\nassets in public/: ${assetFiles.length}`);
  if (deadAssets.length) {
    console.warn(`⚠ dead assets (in public/assets/, referenced by nothing shipped):`);
    for (const a of deadAssets) console.warn(`  assets/${a}`);
    assetFails = deadAssets.length;
  } else {
    console.log("✓ no dead assets");
  }
} catch (cause) {
  // public/ absent → build hasn't run. Don't hard-fail the token check on that;
  // warn so CI (which builds first) still catches real orphans.
  console.warn(`\n⚠ dead-asset pass skipped — could not read ${ASSETS_DIR} (run build first):`);
  console.warn(`  ${String(cause)}`);
}

process.exit(dead.length + orphanRefs.length + assetFails > 0 ? 1 : 0);
