# CLAUDE.md — infixr-website

## Stack
- static HTML + CSS. no framework, ever.
- Bun for tooling (build, server, asset gen). no npm.
- `src/` = source of truth; `build.ts` emits `public/` (generated, gitignored).
- GH Pages serves `public/` via GitHub Actions (`.github/workflows/deploy.yml`). Pages source = "GitHub Actions".

## JS Rules
- budget: ≤5 KB total across all `src/js/*.js` files.
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
- `src/index.html`, `src/about.html`, `src/blog.html` — page SOURCE. clean: bare `<!--CSS_INLINE_START-->`/`<!--CSS_INLINE_END-->` markers, no inline CSS, no preload tags. build injects those into `public/`. Edit these directly.
- `src/css/reset.css`, `tokens.css`, `layout.css`, `components.css`, `pages.css` — source of truth for styles.
- `src/js/form.js` — 1.4 KB, only JS file
- `src/assets/` — images, favicon, og-image, `Satoshi-Variable.woff2` + `Satoshi-VariableItalic.woff2` (self-hosted, fontshare; no rsms.me/Google Fonts)
- `src/manifest.webmanifest` — PWA manifest
- `public/` — GENERATED build output. gitignored. NEVER hand-edit. CI deploys this.
- `build.ts` — Bun build: `src/` → `public/`. inlines `src/css/*` + `@font-face`, injects preloads, copies assets/js/manifest, emits `.nojekyll`. NEVER writes `src/`. Auto-fires via `.claude/settings.json` hook on Edit/Write to `src/css/*` or `src/*.html` or `build.ts`.
- `lint.ts` — dead-token check (`bun run lint`): every `src/css/tokens.css` var must be used in a consumer.
- `.github/workflows/deploy.yml` — CI: push to main → build → deploy `public/` to Pages.
- `vendor/rotating-metaquest3/` — 3D viewer subtree. NOT shipped (hero 3D deferred, needs JS-budget exception).
- `SPEC.md` — cavekit spec (source of truth for invariants)

## Build flow
- Edit `src/css/<file>.css` or `src/*.html` → hook auto-runs `bun run build.ts` → `public/` regenerated.
- Manual: `bun run build.ts` (cheap). Dev: `bun run dev` (build + serve). Lint: `bun run lint`.
- `src/` is the only thing committed. `public/` is gitignored — no stale-inline-CSS problem anymore; CI rebuilds from `src/` on every push.

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
