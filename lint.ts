/**
 * lint.ts — dead-token check (V26).
 *
 * Reads css/tokens.css, extracts every --var declaration, then greps the rest
 * of css/* for `var(--<name>)`. Any token defined but never referenced is
 * reported. Exit code 1 if dead tokens found.
 *
 * Usage: `bun run lint.ts`
 */
import { readFile } from "node:fs/promises";
import { Glob } from "bun";

const TOKENS_FILE = "css/tokens.css";
const CONSUMER_GLOB = "css/{components,pages,layout,reset}.css";

const tokensSrc = await readFile(TOKENS_FILE, "utf8");

// Match `--name: value;` declarations only (not `var(--name)` references).
const declared = new Set<string>();
for (const m of tokensSrc.matchAll(/--([a-z][a-z0-9-]*)\s*:/gi)) {
  declared.add(m[1]);
}

let consumerSrc = "";
const glob = new Glob(CONSUMER_GLOB);
for await (const file of glob.scan(".")) {
  consumerSrc += await readFile(file, "utf8");
}

const referenced = new Set<string>();
for (const m of consumerSrc.matchAll(/var\(--([a-z][a-z0-9-]*)/gi)) {
  referenced.add(m[1]);
}
// Self-refs within tokens.css count too (derivative chains)
for (const m of tokensSrc.matchAll(/var\(--([a-z][a-z0-9-]*)/gi)) {
  referenced.add(m[1]);
}

const dead = [...declared].filter((t) => !referenced.has(t)).sort();
const orphanRefs = [...referenced].filter((r) => !declared.has(r)).sort();

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

process.exit(dead.length + orphanRefs.length > 0 ? 1 : 0);
