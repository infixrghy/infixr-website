# CLAUDE.md — infixr-website

## Stack
- static HTML + CSS. no framework, ever.
- Bun for tooling (build, server, asset gen). no npm.
- `src/` = source of truth; `build.ts` emits `public/` (generated, gitignored).
- GH Pages serves `public/` via GitHub Actions (`.github/workflows/deploy.yml`). Pages source = "GitHub Actions".

## JS Rules
- budget: ≤5 KB total across all `src/js/*.js` files.
- only allowed: form handler, year stamp, who-carousel (transform-track loop + autoplay + nav; Ari-approved exception). All three live in one bundle: `src/js/main.js`.
- ANY new JS needs Ari approval first. ask, do not assume.
- prefer CSS / HTML / browser-native every time.

## CSS Rules
- `@layer reset/tokens/layout/components` order. extend only.
- modern features OK: `@layer`, `color-mix(in oklab)`, `clamp()`, container queries (`cqi`), `:user-invalid`, `100dvh`, `backdrop-filter`, `scroll-snap`, `animation-timeline: view()`, `aspect-ratio`.
- progressive enhancement via `@supports` for view-timeline + similar new features.
- mobile-first. all sections must hold up at 360px width.
- `prefers-reduced-motion`: opt out non-essential animations; keep intentional ones (hero word cycler, carousel autoplay) running.

## Files
- PER-PAGE FOLDERS: each page is a folder `src/pages/<page>/` holding its body + head meta co-located, named by ROLE: `body.ts` (the `<main>` render fn) + `meta.ts` (the `PageMeta` config). Three pages: `index/`, `about/`, `blog/`. Mirrors the `src/components/<name>/` idiom (folder = the unit, files = its parts) — folder names the page, file names the role, so there's no `about.ts`-vs-`pages/about.ts` collision. Page BODIES are ALL typed render fns (no `*.body.html` partials remain): `<main>` only (no `<head>`/nav/footer, no inline CSS, no preload tags); build wraps them in shared chrome.
- `src/pages/index/body.ts` — the homepage `<main>` as a typed render fn `renderHomeBody(posts) → string`. Hero/who/solutions/contact authored here; the blog section is data-driven — it pulls the latest posts from `loadPosts` (`src/data/posts.ts`) into a 3-card hybrid teaser, deep-linking each to its `blog/<slug>.html` page (no drift vs `content/posts/`). Promoted from the old `index.body.html` so the repeated `<picture>` blocks can use `picture()` and the homepage blog cards can't go stale. (Was `src/home.ts` before the per-page-folder move.)
- `src/pages/about/body.ts` — the About `<main>` as a typed render fn `renderAboutBody() → string` (no data; static copy). Promoted from the old `about.body.html` partial so its CTA goes through the typed `button()` component (a static `.html` can't call a TS fn). Page meta sits beside it in `src/pages/about/meta.ts`. (Was `src/about.ts`.)
- `src/pages/blog/body.ts` — the blog-index + per-post page MARKUP: `renderBlogBody(posts)` (index), `renderPost(p)` (one page per post), `postPageMeta(p)` (the per-post `<head>` config, computed from front-matter). The post DATA layer it consumes (`loadPosts`/`displayDate`) lives in `src/data/posts.ts`, NOT here. (Was `src/blog.ts`; the data layer was extracted on the per-page-folder move, then renamed `content.ts`→`data/posts.ts`.)
- `src/data/posts.ts` — the blog-post DATA LAYER, shared across pages: `loadPosts` (read `content/posts/*.md` → Schema-validate front-matter → `marked`-render → newest-first `BlogPost[]`) + `displayDate` (deterministic ISO→display formatter) + `timeMeta` (THE one source for the `<time datetime> · N min read` fragment; callers own their wrapper class + trailing segments). Consumed by `pages/index/body.ts` (homepage mosaic), `pages/blog/body.ts` (index + post pages), and `components/glass-card` (the `<time>` meta). Extracted from the old `src/blog.ts` so post infra isn't owned by the blog page (the dependency arrow is page→data, not page→page). Build-time only, 0 client bytes. `src/data/` names the layer like its siblings (pages/components/templates/schema/) — the file was `src/content.ts`, renamed to `data/posts.ts` to stop it being the lone loose file at `src/` root AND to kill the name-shadow with the repo-root `content/` dir (a loader named like the dir it loads = permanent confusion). NOT `src/js/` — that folder ships verbatim to browsers (client payload, V1 budget); this is build-time Node code (node:fs, marked, Effect) that must never deploy.
- `src/pages/<page>/meta.ts` (`index/`, `about/`, `blog/`) — per-page `PageMeta` config (title/description/canonical/OG…), Schema-validated at build. (Per-POST head meta is `postPageMeta` in `pages/blog/body.ts`, since it's derived from each post's data.)
- `src/templates/*.ts` (`head.ts`, `html.ts`, `picture.ts`) — shared chrome + low-level helpers that are NOT components: `head.ts` = `<head>` assembly; `html` tagged template = the templating substrate; `picture()` = the webp+png `<picture>` idiom. Typed `Data → string`, no DSL. `base` param path-prefixes nested pages (`""` at root, `"../"` for `blog/<slug>.html`).
- `src/components/<name>/` — co-located component folders, each holding its CSS AND (where it has a render fn) its TS together: `nav/` (`nav.css` + `nav.ts`), `footer/` (`+footer.ts`), `button/` (`+button.ts`, every site button via a `variant` param + functional link/submit union), `glass-card/` (`+glass-card.ts`, the frosted card), plus CSS-only `typography/`, `cursor/`, `hero/`, `carousel/`, `u-card/` (base `u-card.css` + post-glass `u-card.overrides.css`), `contact/`. Each `.css` self-wraps `@layer components {}`; `build.ts`'s `COMPONENT_CSS` array concatenates them in cascade order (split out of the old monolithic `components.css` — that array's ORDER is load-bearing, see build.ts). Schemas stay in `src/schema/` (the CSS co-location is the point).
- `src/schema/*.ts` (`page.ts`, `post.ts`, `glass-card.ts`, `button.ts`) — Effect Schema for page meta, blog front-matter, and the component param APIs (glass card + button); malformed data/params fail the build, not the browser.
- `content/posts/*.md` — blog post sources (front-matter + markdown). `src/data/posts.ts` (`loadPosts`) validates + `marked`-renders them (build-time only, 0 client bytes); `pages/blog/body.ts` renders them into the blog index AND one page each at `public/blog/<slug>.html`. Latest few also surface in the homepage blog teaser (`pages/index/body.ts`).
- `src/css/reset.css`, `tokens.css`, `layout.css`, `pages.css` — source of truth for the SHARED (non-component) styles. Component-scoped CSS lives co-located under `src/components/<name>/` (see above). (`components.css` was split into those folders; it no longer exists.)
- `src/js/main.js` — ~3.5 KB, the only shipped JS file (year stamp + contact form + who-carousel; each no-ops where its target is absent). Ships on every page via `build.ts`.
- `src/assets/` — images, favicon, og-image, `Satoshi-Variable.woff2` + `Satoshi-VariableItalic.woff2` (self-hosted, fontshare; no rsms.me/Google Fonts)
- `src/manifest.webmanifest` — PWA manifest
- `public/` — GENERATED build output. gitignored. NEVER hand-edit. CI deploys this.
- `build.ts` — Bun + Effect build: `src/` + `content/` → `public/`. Per page: decode `PageMeta` (Schema) → assemble shell (head from `src/templates/*`, nav/footer from `src/components/*`, body) → inline `src/css/*` + the ordered `COMPONENT_CSS` list + `@font-face` → inject preloads → write. Index body = `renderHomeBody(posts)` (`pages/index/body.ts`); about body = `renderAboutBody()` (`pages/about/body.ts`); blog body + per-post pages from `pages/blog/body.ts`; post data from `loadPosts` (`src/data/posts.ts`). Meta from each `pages/<page>/meta.ts`. Also emits `public/blog/<slug>.html` per post. copies assets/js/manifest, emits `.nojekyll`. NEVER writes `src/`. Auto-fires via `.claude/settings.json` → `.claude/hooks/post-edit-build.ts` on Edit/Write to any build input — gate is a declarative prefix-set (anything under `src/` or `content/posts/`, or `build.ts`, with a `.css`/`.ts`/`.md` extension), so new dirs/files under `src/` need zero hook edits.
- `lint.ts` — dead-token check (`bun run lint`): every `src/css/tokens.css` var must be used in a consumer.
- `.github/workflows/deploy.yml` — CI: push to main → build → deploy `public/` to Pages.
- `vendor/rotating-metaquest3/` — 3D viewer subtree. NOT shipped (hero 3D deferred, needs JS-budget exception).
- `SPEC.md` — cavekit spec (source of truth for invariants)

## Build flow
- Edit any build input (anything under `src/` — CSS, component/template/schema/page/body TS — or `content/posts/*.md`, or `build.ts`) → hook auto-runs `bun run build.ts` → `public/` regenerated.
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
