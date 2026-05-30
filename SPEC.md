# SPEC

## §G GOAL
static infixr.com rebuild. html+css. minimal js. mobile-OK. GH Pages host.

## §C CONSTRAINTS
- static HTML + CSS only. ⊥ framework (Tailwind, Bootstrap, etc).
- JS budget ≤ 5 KB total across all `js/*.js`.
- new JS ! Ari approval first. ⊥ silent add.
- modern CSS OK: `@layer`, `color-mix(in oklab)`, `clamp()`, container queries, `:user-invalid`, `100dvh`, `backdrop-filter`, `scroll-snap`, `animation-timeline: view()`, `aspect-ratio`, `@supports`.
- mobile-first. ! hold at 360 px width.
- progressive enhance. unsupported features → graceful fallback, never blank/broken.
- Bun toolchain. ⊥ npm/yarn.
- GH Pages target. `.nojekyll` present.

## §I INTERFACES
- page: `index.html` → home (hero, who-we-are carousel, solutions, blog teaser, contact form, footer)
- page: `about.html` → company prose + values
- page: `blog.html` → post list (lorem mock)
- asset: `assets/hero2.png` → hero bg
- asset: `assets/who-{1,2,3}.jpg` → carousel cards
- asset: `assets/sol-{corporate,industrial,realestate}.png` → solutions cards
- asset: `assets/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`
- file: `manifest.webmanifest` → PWA manifest
- script: `js/form.js` → contact form submit handler + year stamp. ENDPOINT placeholder `https://example.com/api/contact`.
- script: `server.ts` → Bun dev server. `bun run server.ts` → 127.0.0.1:8765
- env: none required at runtime
- remote: `github.com/arijit-gogoi/infixr-website` (public)
- live: `arijit-gogoi.github.io/infixr-website/`

## §V INVARIANTS
V1: total `js/*.js` byte size ≤ 5120 B
V2: ∀ new `<script>` tag → Ari approval recorded in §T or §B
V3: ⊥ CSS framework import / link
V4: ∀ section → renders & legible @ 360 px viewport width
V5: ∀ animation → opt out via `@media (prefers-reduced-motion: reduce)` OR justify in comment as intentional
V6: hero `<img>` ! `fetchpriority="high"` + explicit `width`/`height` to prevent CLS
V7: ∀ image → `width` + `height` attrs OR `aspect-ratio` CSS to reserve box pre-load
V8: ∀ page → canonical, og:type/url/title/description/image, twitter:card meta present
V9: `@layer reset/tokens/layout/components` order preserved; new rules join existing layer
V10: ∀ user input (form field) → `:user-invalid` styling + HTML5 validation gate before fetch
V11: form fetch failure → human fallback msg w/ `mailto:contact@infixr.com`
V12: ⊥ hardcoded px breakpoint when `clamp()` or container query works
V13: GH Pages root → `index.html` served; `.nojekyll` ! present
V14: ∀ hero-class viewport unit → `svh` not `dvh`/`vh` (avoid mobile URL-bar resize jank)
V15: ∀ raster image ≥ 100 KB → `<picture>` w/ webp `<source>` first, original as fallback `<img>`
V16: CSS source = `css/*.css`. HTML deploys w/ inlined CSS via `build.ts`. ∀ edit to `css/*.css` OR `*.html` source markers → `bun run build.ts` ! before commit. Auto-fired via `.claude/settings.json` PostToolUse hook.
V17: ⊥ external `<link rel="stylesheet">` in any deployed HTML. ⊥ cross-origin font fetch. (rsms.me, fonts.googleapis.com, etc.)
V18: tokens.css ! encode Figma palette: --c-bg:#222526; --c-fg:#e0e0e0; --c-accent:#1FD1A1
V19: body font = Satoshi, self-hosted from `assets/Satoshi-Variable.woff2` (fontshare.com source), w/ system-ui fallback chain. ⊥ Inter. ⊥ Google Fonts.
V20: type scale uses `clamp()`. heading 4.5em–6em; section 3em–4em; subheading 1.5em–2em; body 1em–1.125em. rem-based.
V21: spacing scale = 8 px multiples. tokens --s-1 (8px) … --s-20 (160px). section pad = clamp(120px,12vw,160px). heading→para gap = 24px. para→cta gap = clamp(32px,4vw,40px)
V22: ∀ button → 3 variants (primary filled, secondary outline, tertiary link+arrow). ! ≥ 44×44 px tap target. hover state non-color (transform OR border). reduced-motion safe.
V23: nav top-right links: WHO WE ARE · OUR SOLUTIONS · PRODUCTS · BLOGS · CONTACT US (button). collapse to hamburger ≤ 640 px viewport.
V24: large card → rounded 16–24 px, dark bg, product img top, h2 + body + CTA. hover state defined. carousel uses `scroll-snap`. reduced-motion → autoplay stops.
V25: `build.ts` emits cache-busted asset hashes (e.g. `hero.abc1234.webp`) in HTML refs. ⊥ stale browser cache on deploy.
V26: ∀ token in `css/tokens.css` ! referenced ≥ 1 time in `css/{components,pages,layout}.css`. dead token → `bun run lint` warns.

## §T TASKS
id|status|task|cites
T1|x|scrape infixr.com content + assets|I.asset
T2|x|scaffold HTML + CSS + JS structure|C
T3|x|hero w/ Effect-style word cycler|V5,V6
T4|x|who-we-are carousel (CSS-only autoadvance)|V5
T5|x|solutions grid|V7
T6|x|blog teaser section|-
T7|x|contact form|V10,V11
T8|x|footer|-
T9|x|mobile audit @ ≤ 360 px|V4
T10|x|inline SVG logo|-
T11|x|about.html|I.page
T12|x|blog.html|I.page
T13|x|Open Graph + favicons|V8
T14|x|GH Pages deploy|V13
T15|x|fix mobile jumpiness near hero+carousel|B1,V6,V7
T16|.|wire real form endpoint (placeholder now)|I.script
T17|.|custom domain config|-
T18|x|fetch Satoshi from fontshare.com → `assets/Satoshi-Variable.woff2`|V19
T19|x|encode Figma tokens in `css/tokens.css` (palette, font, type-scale clamp, spacing-8)|V18,V19,V20,V21
T20|.|build 3 button variants + nav + card components per Figma|V22,V23,V24
T21|.|extend `build.ts`: inject Satoshi @font-face + `<link rel=preload>` + cache-bust asset hashes|V19,V25
T22|x|add `bun run lint` script: dead-token check `tokens.css` vs `{components,pages,layout}.css`|V26

## §B BUGS
id|date|cause|fix
B1|2026-05-20|mobile jank @ hero+carousel. causes: hero `<img>` missing w/h (CLS), `92dvh` resized on URL-bar toggle, `backdrop-filter` on sticky header GPU-thrashed during carousel anim|V6,V7,V14
B2|2026-05-20|hero png 1.2 MB → slow LCP on mobile. webp 121 KB / 48 KB now via `<picture>` srcset|V15
