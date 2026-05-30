/**
 * PostToolUse hook: when an Edit/Write/MultiEdit touches css/*.css, build.ts,
 * or any of the deployed HTML pages, regenerate the inlined CSS block by
 * running `bun run build.ts`. Skips otherwise.
 *
 * Wired in .claude/settings.json. Reads tool input JSON on stdin.
 */
const raw = await Bun.stdin.text();
let input: { tool_input?: { file_path?: string; path?: string } } = {};
try { input = JSON.parse(raw); } catch { /* nothing on stdin */ }

const p = input.tool_input?.file_path ?? input.tool_input?.path ?? "";
// Rebuild on edits to CSS source, src HTML pages, or build.ts itself.
const re = /(?:^|[\\/])src[\\/](?:css[\\/].+\.css|index\.html|about\.html|blog\.html)$|(?:^|[\\/])build\.ts$/;

if (!re.test(p)) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const r = Bun.spawnSync(["bun", "run", "build.ts"], { cwd });
process.stderr.write(r.stderr);
process.stdout.write(r.stdout);
process.exit(r.exitCode ?? 0);
