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
- `index.html`, `about.html`, `blog.html` — pages
- `css/reset.css`, `tokens.css`, `layout.css`, `components.css`, `pages.css`
- `js/form.js` — 1.4 KB, only file
- `server.ts` — Bun dev server, `bun run server.ts` → 127.0.0.1:8765
- `assets/` — images, favicon, og-image
- `SPEC.md` — cavekit spec (source of truth for invariants)

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
