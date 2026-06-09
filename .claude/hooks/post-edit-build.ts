/**
 * PostToolUse hook: when an Edit/Write/MultiEdit touches any build input, run
 * `bun run build.ts` to regenerate public/. Skips otherwise.
 *
 * Build inputs = anything under these dirs/files with a build extension:
 *   - src/**            — CSS + every TS render fn / schema / page-meta, now
 *                         INCLUDING co-located components under src/components/
 *   - content/posts/**  — blog post sources (data-driven)
 *   - build.ts          — the pipeline itself
 *
 * Gate is a declarative prefix-set + extension check (was a brittle hand-listed
 * regex that had to be patched every time a dir was added — and would have
 * missed src/components/ entirely after the CSS co-location reshape). New dirs
 * under src/ now need ZERO hook edits. Non-inputs (README, .baseline/ scratch,
 * .handoff/ notes, this hook) are still skipped by the extension/prefix filter.
 *
 * Wired in .claude/settings.json. Reads tool input JSON on stdin.
 */
const raw = await Bun.stdin.text();
let input: { tool_input?: { file_path?: string; path?: string } } = {};
try { input = JSON.parse(raw); } catch { /* nothing on stdin */ }

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// Normalise the edited path to a project-RELATIVE forward-slash path, then anchor
// the match. Tool paths arrive absolute (e.g. C:\…\src\foo.css on Windows), so
// strip the project root first — anchoring beats substring matching: an unanchored
// `includes("/src/")` would also fire on vendored trees (vendor/…/src/…), and
// treating the "build.ts" FILE like a dir prefix would match a build.ts/ segment.
const root = cwd.replace(/\\/g, "/").replace(/\/$/, "");
const raw_p = (input.tool_input?.file_path ?? input.tool_input?.path ?? "").replace(/\\/g, "/");
const rel = raw_p.startsWith(root + "/") ? raw_p.slice(root.length + 1) : raw_p;

// Build inputs: anything under src/ or content/posts/ (dir prefixes), plus the
// build.ts pipeline file itself (exact), with a build extension. New dirs under
// src/ need zero edits here.
const INPUT_DIRS = ["src/", "content/posts/"];
const isInput =
  (INPUT_DIRS.some((d) => rel.startsWith(d)) || rel === "build.ts") &&
  /\.(css|ts|md)$/.test(rel);

if (!isInput) process.exit(0);

const r = Bun.spawnSync(["bun", "run", "build.ts"], { cwd });
process.stderr.write(r.stderr);
process.stdout.write(r.stdout);
process.exit(r.exitCode ?? 0);
