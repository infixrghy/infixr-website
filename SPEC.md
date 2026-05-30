# SPEC

## §G GOAL
static infixr.com rebuild. html+css. minimal js. mobile-OK. GH Pages host.

## §C CONSTRAINTS
- static HTML + CSS only. ⊥ framework (Tailwind, Bootstrap, etc).
- JS budget ≤ 5 KB total across all `src/js/*.js`.
- new JS ! Ari approval first. ⊥ silent add.
- modern CSS OK: `@layer`, `color-mix(in oklab)`, `clamp()`, container queries, `:user-invalid`, `100dvh`, `backdrop-filter`, `scroll-snap`, `animation-timeline: view()`, `aspect-ratio`, `@supports`.
- mobile-first. ! hold at 360 px width.
- progressive enhance. unsupported features → graceful fallback, never blank/broken.
- Bun toolchain. ⊥ npm/yarn.
- layout: `src/` = hand-edited source of truth; `build.ts` emits `public/` (generated, gitignored).
- GH Pages served from `public/` via GitHub Actions (`.github/workflows/deploy.yml`). `.nojekyll` emitted into `public/`.

## §I INTERFACES
- page: `src/index.html` → home (hero, who-we-are carousel, solutions, blog teaser, contact form, footer)
- page: `src/about.html` → company prose + values
- page: `src/blog.html` → post list (lorem mock)
- asset: `src/assets/hero2.png` → hero bg
- asset: `src/assets/who-{1,2,3}.jpg` → carousel cards
- asset: `src/assets/sol-{corporate,industrial,realestate}.png` → solutions cards
- asset: `src/assets/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`
- file: `src/manifest.webmanifest` → PWA manifest
- script: `src/js/form.js` → contact form submit handler + year stamp. ENDPOINT placeholder `https://example.com/api/contact`.
- build: `build.ts` → `src/` → `public/`. inline CSS + @font-face, inject preloads, copy assets/js/manifest, emit `.nojekyll`. NEVER writes `src/`. `bun run build.ts`.
- build: `lint.ts` → dead-token check `src/css/tokens.css` vs consumers. `bun run lint`.
- script: `server.ts` → Bun dev server, serves `public/`. `bun run server.ts` (or `bun run dev` = build+serve) → 127.0.0.1:8765
- ci: `.github/workflows/deploy.yml` → on push to `main`: build `public/` → deploy via `actions/deploy-pages`.
- vendor: `vendor/rotating-metaquest3/` → 3D MetaQuest3 viewer (subtree). NOT shipped — hero 3D deferred (V27, T27).
- env: none required at runtime
- remote: `github.com/infixrghy/infixr-website` (public)
- live: `infixrghy.github.io/infixr-website/` (Pages source = GitHub Actions)

## §V INVARIANTS
V1: total `src/js/*.js` byte size ≤ 5120 B
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
V13: GH Pages serves `public/` (built artifact) via GitHub Actions. `public/index.html` = home. `.nojekyll` emitted into `public/`.
V14: ∀ hero-class viewport unit → `svh` not `dvh`/`vh` (avoid mobile URL-bar resize jank)
V15: ∀ raster image ≥ 100 KB → `<picture>` w/ webp `<source>` first, original as fallback `<img>`
V16: source = `src/` (HTML, `src/css/*.css`, `src/js/*`, `src/assets/`). `build.ts` reads `src/` → emits `public/`. ⊥ build writes back to `src/`. ⊥ hand-edit `public/` (generated). CI rebuilds on push; local edits auto-fire build via `.claude/settings.json` PostToolUse hook.
V17: ⊥ external `<link rel="stylesheet">` in any built HTML. ⊥ cross-origin font fetch (rsms.me, fonts.googleapis.com, etc). all CSS inlined, all fonts self-hosted from `src/assets/`.
V18: tokens.css ! encode Figma palette: --c-bg:#222526; --c-fg:#e0e0e0; --c-accent:#1FD1A1
V19: body font = Satoshi, self-hosted from `assets/Satoshi-Variable.woff2` (fontshare.com source), w/ system-ui fallback chain. ⊥ Inter. ⊥ Google Fonts.
V20: type scale uses `clamp()`. heading 4.5em–6em; section 3em–4em; subheading 1.5em–2em; body 1em–1.125em. rem-based.
V21: spacing scale = 8 px multiples. tokens --s-1 (8px) … --s-20 (160px). section pad = clamp(120px,12vw,160px). heading→para gap = 24px. para→cta gap = clamp(32px,4vw,40px)
V22: ∀ button → 3 variants (primary filled, secondary outline, tertiary link+arrow). ! ≥ 44×44 px tap target. hover state non-color (transform OR border). reduced-motion safe.
V23: nav top-right links: WHO WE ARE · OUR SOLUTIONS · PRODUCTS · BLOGS · CONTACT US (button). collapse to hamburger ≤ 640 px viewport.
V24: large card → rounded 16–24 px, dark bg, product img top, h2 + body + CTA. hover state defined. carousel uses `scroll-snap`. reduced-motion → autoplay stops.
V25: `build.ts` emits cache-busted asset hashes (e.g. `hero.abc1234.webp`) in HTML refs. ⊥ stale browser cache on deploy.
V26: ∀ token in `src/css/tokens.css` ! referenced ≥ 1 time in `src/css/{components,pages,layout,reset}.css`. dead token → `bun run lint` warns.
V27: hero → sticky header. headline "VR Solutions, Built Around Your <cycler>." in Satoshi; cycler word = accent (--c-accent) color, rest = --c-fg. word-cycler KEPT. CTAs = "Request a Demo" (primary) + "Explore Our Work" (ghost), UPPERCASE dark pill shape. nav links UPPERCASE incl active HOME. bg = FLAT --c-bg (⊥ full-bleed photo); decorative headset still (static PNG, render from vendored .glb, NOT model-viewer) floats RIGHT + CSS/SVG orbital ring (thin ellipse arcs + node dots). text ! WCAG AA contrast. @360px: headset hidden (text-priority, AA-safe). hero 3D (interactive) DEFERRED — ⊥ model-viewer / WebGL / cross-origin HDR until §V17 budget exception approved by Ari (T27).
V28: §who-we-are carousel → CENTER card = light/white, dark text LEFT + product photo RIGHT, STRAIGHT (tilt dropped — mock center card is flat; supersedes the earlier ≤3deg tilt clause from the PDF distill). FLANKING peek cards = gradient (pink/purple/teal) slivers visible at edges, tinting via fixed `::before/::after` edge panels over the viewport (CSS can't select the mid-autoplay centered slide, so gradient is environmental not per-card). peek geometry: 74% slides + 3% gap (0 new JS). default + hover state, indicator dots (active = wide teal pill), clickable nav via CSS radio-label (pins+centers a slide, halts autoplay). autoplay keyframe reduce-gated. section heading CENTERED: eyebrow "WHO WE ARE" + "VR For Real World Challenges" + "Learn More →". @360px: card stacks (photo over text); edge panels frame it. ⊥ new JS > 5 KB.
V29: §our-solutions = ASYMMETRIC grid: 2 small dark-glass cards (Corporate Training, Workforce Training — text only) + 1 large card (Industrial & Safety Training) with industrial/warehouse photo bg + overlaid text, spanning 2 rows. glassmorphism on dark cards (`backdrop-filter: blur()` + semi-transparent bg + border highlight), progressive-enhance via `@supports`. EXACTLY 3 cards (mock's empty filler cards ⊥ shipped). heading "FROM IDEA TO IMMERSIVE REALITY" (uppercase) LEFT + descriptor right + "VIEW MORE →". @360px: 1-col stack.
V30: §blogs → IMAGE-FORWARD overlay cards: title text overlaid on photo (white over scrim, AA by construction — reuse hero scrim pattern). 2 large feature cards (headset photo bg) top row + mixed grid below: small cards (gradient-headset bg, CSS gradient — no asset) w/ date + read-time meta + large people-in-VR photo card. heading "THE FUTURE OF SPATIAL EXPERIENCES" (uppercase). @360px: 1-col. KEEP real Phase-A copy (⊥ lorem from mock).
V31: `public/` is build output only — gitignored, ∄ in commits. deploy = CI builds fresh from `src/`. ∀ asset referenced by built HTML ! exist under `src/assets/` (build copies to `public/assets/`).

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
T23|x|hero: flat bg + headset still right + CSS orbital ring + uppercase nav/CTA + teal cycler|V27
T24|x|who-we-are: peek carousel (light center + gradient flanks) + straight cards + dots + CSS nav|V28
T25|x|our-solutions: asymmetric glass grid (2 dark + 1 photo span)|V29
T26|x|blogs: image-forward overlay cards (2 feature + mixed grid)|V30
T27|blocked|integrate rotating-metaquest3 hero 3D — needs JS-budget exception from Ari|V17,V27
T28|x|re-skin home to match design/figma-final/png (PNG = ground truth, supersedes PDF)|V27,V28,V29,V30,V4,B3

## §B BUGS
id|date|cause|fix
B1|2026-05-20|mobile jank @ hero+carousel. causes: hero `<img>` missing w/h (CLS), `92dvh` resized on URL-bar toggle, `backdrop-filter` on sticky header GPU-thrashed during carousel anim|V6,V7,V14
B2|2026-05-20|hero png 1.2 MB → slow LCP on mobile. webp 121 KB / 48 KB now via `<picture>` srcset|V15
B3|2026-05-30|built home diverged from real design. cause: V27-30 distilled from un-renderable PDFs (pdftoppm/IM unavailable) → built to spec-text, not pixels. fix: ffmpeg-crop the PNG mockups (design/figma-final/png) as ground truth, re-skin to match. PNG supersedes PDF as design source. NOT a regression — design never matched pixels|V27,V28,V29,V30
