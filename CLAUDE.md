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
- `src/pages/*.body.html` (`about.body.html` only) — page BODY partials (the `<main>`…); no `<head>`/nav/footer, no inline CSS, no preload tags. build wraps them in shared chrome. Edit directly. (Index + blog bodies are NOT partials — they're render fns; see `src/home.ts`, `src/blog.ts`.)
- `src/home.ts` — the homepage `<main>` as a typed render fn `renderHomeBody(posts) → string` (NOT a static partial). Hero/who/solutions/contact are authored here; the blog section is data-driven — it pulls the latest posts from `loadPosts` into a fixed 5-cell mosaic, deep-linking each to its `blog/<slug>.html` page (no drift vs `content/posts/`). Promoted from the old `index.body.html` so the repeated `<picture>` blocks can use `picture()` and the homepage blog cards can't go stale.
- `src/pages/*.ts` (`index.ts`, `about.ts`, `blog.ts`) — per-page `PageMeta` config (title/description/canonical/OG…), Schema-validated at build.
- `src/templates/*.ts` (`head.ts`, `nav.ts`, `footer.ts`, `html.ts`, `picture.ts`) — shared render fns: chrome (head/nav/footer) + low-level helpers (`html` tagged template = the templating substrate; `picture()` = the webp+png `<picture>` idiom rendered once). Typed `Data → string`, no DSL. `base` param path-prefixes nested pages (`""` at root, `"../"` for `blog/<slug>.html`).
- `src/schema/*.ts` (`page.ts`, `post.ts`) — Effect Schema for page meta + blog front-matter; malformed data fails the build, not the browser.
- `content/posts/*.md` — blog post sources (front-matter + markdown). `src/blog.ts` validates + `marked`-renders them (build-time only, 0 client bytes) into the blog index AND one page each at `public/blog/<slug>.html`. Latest few also surface in the homepage blog mosaic (`src/home.ts`).
- `src/css/reset.css`, `tokens.css`, `layout.css`, `components.css`, `pages.css` — source of truth for styles.
- `src/js/form.js` — 1.4 KB, only JS file
- `src/assets/` — images, favicon, og-image, `Satoshi-Variable.woff2` + `Satoshi-VariableItalic.woff2` (self-hosted, fontshare; no rsms.me/Google Fonts)
- `src/manifest.webmanifest` — PWA manifest
- `public/` — GENERATED build output. gitignored. NEVER hand-edit. CI deploys this.
- `build.ts` — Bun + Effect build: `src/` + `content/` → `public/`. Per page: decode `PageMeta` (Schema) → assemble shell (head+nav+body+footer from `src/templates/*`) → inline `src/css/*` + `@font-face` → inject preloads → write. Index body = `renderHomeBody(posts)` (`src/home.ts`); about body = static partial; blog body + per-post pages from `src/blog.ts`. Also emits `public/blog/<slug>.html` per post. copies assets/js/manifest, emits `.nojekyll`. NEVER writes `src/`. Auto-fires via `.claude/settings.json` → `.claude/hooks/post-edit-build.ts` on Edit/Write to `src/css/*.css`, `src/{templates,schema,pages}/*.ts`, `src/pages/*.body.html`, `src/{home,blog}.ts`, `content/posts/*.md`, or `build.ts`.
- `lint.ts` — dead-token check (`bun run lint`): every `src/css/tokens.css` var must be used in a consumer.
- `.github/workflows/deploy.yml` — CI: push to main → build → deploy `public/` to Pages.
- `vendor/rotating-metaquest3/` — 3D viewer subtree. NOT shipped (hero 3D deferred, needs JS-budget exception).
- `SPEC.md` — cavekit spec (source of truth for invariants)

## Build flow
- Edit any build input (`src/css/*.css`, `src/{templates,schema,pages}/*.ts`, `src/pages/*.body.html`, `src/{home,blog}.ts`, `content/posts/*.md`, `build.ts`) → hook auto-runs `bun run build.ts` → `public/` regenerated.
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
- remote: github.com/infixrghy/infixr-website (org repo; transferred from arijit-gogoi)
- live: infixrghy.github.io/infixr-website/ (Pages source = GitHub Actions)
- auth: gh CLI as `arijit-gogoi` (personal account, member of infixrghy org)
