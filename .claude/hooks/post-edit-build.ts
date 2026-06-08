/**
 * PostToolUse hook: when an Edit/Write/MultiEdit touches any build input, run
 * `bun run build.ts` to regenerate public/. Skips otherwise.
 *
 * Build inputs (since the SSG/templating refactor):
 *   - src/css/*.css            — styles inlined into pages
 *   - src/templates/*.ts       — shared head/nav/footer render fns + html/picture helpers
 *   - src/schema/*.ts          — Effect Schema for page meta + posts
 *   - src/pages/*.ts                    — per-page meta config
 *   - src/home.ts, about.ts, blog.ts    — top-level body render fns (every page body)
 *   - content/posts/*.md                — blog post sources (data-driven)
 *   - build.ts                          — the pipeline itself
 *
 * (No more src/pages/*.body.html — all page bodies are render fns now.)
 *
 * Wired in .claude/settings.json. Reads tool input JSON on stdin.
 */
const raw = await Bun.stdin.text();
let input: { tool_input?: { file_path?: string; path?: string } } = {};
try { input = JSON.parse(raw); } catch { /* nothing on stdin */ }

const p = (input.tool_input?.file_path ?? input.tool_input?.path ?? "").replace(/\\/g, "/");
// Rebuild on edits to any build input (path normalised to forward slashes above).
const re =
  /(?:^|\/)src\/(?:css\/.+\.css|(?:templates|schema|pages)\/.+\.ts|(?:home|about|blog)\.ts)$|(?:^|\/)content\/posts\/.+\.md$|(?:^|\/)build\.ts$/;

if (!re.test(p)) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const r = Bun.spawnSync(["bun", "run", "build.ts"], { cwd });
process.stderr.write(r.stderr);
process.stdout.write(r.stdout);
process.exit(r.exitCode ?? 0);
