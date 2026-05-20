# CLAUDE.md — infixr-website

## Stack
- static HTML + CSS. no framework, ever.
- Bun for tooling (server, asset gen). no npm.
- GH Pages target. `.nojekyll` present.

## JS Rules
- budget: ≤5 KB total across all `.js` files.
- only allowed: form handler, year stamp.
- ANY new JS needs Ari approval first. ask, do not assume.
- prefer CSS / HTML / browser-native every time.

## CSS Rules
- `@layer reset/tokens/layout/components` order. extend only.
- modern features OK: `@layer`, `color-mix(in oklab)`, `clamp()`, container queries (`cqi`), `:user-invalid`, `100dvh`, `backdrop-filter`, `scroll-snap`, `animation-timeline: view()`, `aspect-ratio`.
- progressive enhancement via `@supports` for view-timeline + similar new features.
- mobile-first. all sections must hold up at 360px width.
- `prefers-reduced-motion`: opt out non-essential animations; keep intentional ones (hero word cycler, carousel autoplay) running.

## Files
- `index.html`, `about.html`, `blog.html` — pages. CSS is INLINED into `<head>`. Don't hand-edit the `<style>` block between `<!--CSS_INLINE_START-->` / `<!--CSS_INLINE_END-->` markers — edit `css/*.css` source and rerun build.
- `css/reset.css`, `tokens.css`, `layout.css`, `components.css`, `pages.css` — source of truth for styles.
- `js/form.js` — 1.4 KB, only file
- `server.ts` — Bun dev server, `bun run server.ts` → 127.0.0.1:8765
- `build.ts` — Bun build script. Inlines `css/*.css` + `@font-face` into each HTML between marker comments. Idempotent. Auto-fires via `.claude/settings.json` hook on Edit/Write to `css/*` or HTML pages.
- `assets/` — images, favicon, og-image, `InterVariable.woff2` (self-hosted, no rsms.me)
- `SPEC.md` — cavekit spec (source of truth for invariants)

## Build flow
- Edit `css/<file>.css` → hook auto-runs `bun run build.ts` → HTML inline blocks updated.
- Manual rebuild: `bun run build.ts` (cheap, ~30 ms).
- Never commit HTML with stale inline CSS — `git status` will show unstaged HTML changes when build hasn't run.

## Editing
- never add CSS framework
- never add JS without explicit approval
- never duplicate sibling rules — extend cascade via @layer
- never hardcode breakpoints in pixels when `clamp()` / container query works

## Dev loop
- start server: `bun run server.ts`
- chrome-devtools-mcp for perf, lighthouse, mobile emulation
- claude-in-chrome for screenshots, manual checks
- commit style: Conventional Commits (`feat:`, `fix:`, `perf:`, `chore:`)

## Repo
- remote: github.com/arijit-gogoi/infixr-website
- live: arijit-gogoi.github.io/infixr-website/
- auth: arijit-gogoi (gh CLI)
