/**
 * PostToolUse hook: when an Edit/Write/MultiEdit touches any build input, run
 * `astro build` to regenerate dist/. Skips otherwise.
 *
 * Build inputs = anything under these dirs/files with a build extension:
 *   - src/**            — .astro pages/layouts/components, CSS, TS config/utils,
 *                         blog posts (src/content/posts/**)
 *   - public/**         — static passthrough (main.js, hero-3d, assets)
 *   - astro.config.mjs  — the pipeline config itself
 *
 * Gate is a declarative prefix-set + extension check. New dirs under src/
 * need ZERO hook edits. Non-inputs (README, .handoff/ notes, this hook) are
 * skipped by the extension/prefix filter.
 *
 * Wired in .claude/settings.json. Reads tool input JSON on stdin.
 */
import { text } from "node:stream/consumers";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const raw = await text(process.stdin);
let input: { tool_input?: { file_path?: string; path?: string } } = {};
try { input = JSON.parse(raw); } catch { /* nothing on stdin */ }

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// Normalise the edited path to a project-RELATIVE forward-slash path, then anchor
// the match. Tool paths arrive absolute (e.g. C:\…\src\foo.css on Windows), so
// strip the project root first — anchoring beats substring matching: an unanchored
// `includes("/src/")` would also fire on vendored trees (vendor/…/src/…).
const root = cwd.replace(/\\/g, "/").replace(/\/$/, "");
const raw_p = (input.tool_input?.file_path ?? input.tool_input?.path ?? "").replace(/\\/g, "/");
const rel = raw_p.startsWith(root + "/") ? raw_p.slice(root.length + 1) : raw_p;

const INPUT_DIRS = ["src/", "public/"];
const isInput =
  (INPUT_DIRS.some((d) => rel.startsWith(d)) || rel === "astro.config.mjs") &&
  /\.(css|ts|md|js|mjs|astro)$/.test(rel);

if (!isInput) process.exit(0);

// astro is a JS CLI — spawn it via the current node binary (cross-platform;
// npx.cmd indirection on Windows is flaky under spawnSync).
const r = spawnSync(
  process.execPath,
  [join(cwd, "node_modules", "astro", "bin", "astro.mjs"), "build"],
  { cwd }
);
if (r.stderr) process.stderr.write(r.stderr);
if (r.stdout) process.stdout.write(r.stdout);
// status is null when the spawn itself failed (e.g. node not on PATH) — surface
// that as a failure, not a silent green.
process.exit(r.status ?? (r.error ? 1 : 0));
