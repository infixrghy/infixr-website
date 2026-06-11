# Glass Card — component spec

The frosted-glass card used by the homepage **Our Services** product cards
(InfiTrain/InfiSoft/InfiExplore/InfiLearn), the **blog teaser** text cards, and the
**"What We Build" (Solutions)** text cards. One CSS recipe, one typed component,
five tunable parameters. This document specs the effect, every parameter, how to
tweak them, and how to apply it.

> Source of truth for project invariants is [`../SPEC.md`](../SPEC.md) (see **V36**).
> This file is the detailed component spec referenced from there and from the code
> comments in `src/components/glass-card/glass-card.css`,
> `src/components/glass-card/glass-card.ts`, `src/schema/glass-card.ts`. (All `src/…`
> / `SPEC.md` paths below are relative to the repo root, not this `design/` folder.)

---

## 1. What it is

A translucent card whose background is **blurred + saturated** (frosted glass) and
whose surface carries a **teal tint** with a **bright teal "lit" rim**. On hover the
**rim brightens**, the **title lights teal** (the shared card-header neon), and a
**diagonal sheen** sweeps across the pane.

> **Hover is deliberately motion/light only — the surface colour and position do NOT
> change.** No lift, no tint shift, no blur change. See §3b/§3d for the history (every
> fill shift and the lift were tried and rejected as taste/clarity regressions); the
> rim + sheen + title-glow carry the whole hover.

The chosen look (project default) is **variant V3 — "Refined"**: a lighter tint and
subtler rim than the bolder presets, so it reads as elegant glass rather than a
heavy slab.

### The contrast principle (read this before tuning)

`backdrop-filter: blur()` shows a blurred copy of **whatever is behind the element**.
A frosted card is therefore only as luminous as the thing it sits over. Each section
paints an accent **glow backdrop** (`.services::before`, `.blog::before`,
`.solutions::before`) and the card frost refracts *that glow* — it is the card's
light source.

**Consequence:** the card's contrast must come from the **card itself** (its tinted
surface + lit rim), **not** from dimming the surrounding glow. Muting the glow dims
the card *interior* (less light to refract) and makes contrast **worse**, not better.
This was learned empirically during design — do not "reduce the background teal" to
make a card pop; instead push teal into the surface (`--gc-tint`, `--gc-alpha`) and
the rim (`--gc-rim`).

**Corollary (the grey episode, 2026-06-11):** a card sitting over a *weak* part of a
section glow refracts mostly the bare base background, so if that base reads grey the
card reads grey. Two roots, both fixed: (1) the base `--c-bg` is now a teal-charcoal
`#1f2725` (was the neutral `#222526`) and raised-surface tokens lift toward the
**accent**, not white — see `tokens.css`; (2) `--gc-tint` was raised `10% → 18%` so
the frost carries its **own** teal even where the glow behind it is weak (the Our
Services **bottom row** is the worst case — both `.services::before` radials sit near
the top, leaving row 2 barely lit).

---

## 2. Anatomy

```
┌─────────────────────────────┐  ← --gc-rim  (1.5px lit teal border, on the element)
│ ░░░░░░░░ frosted surface ░░░ │  ← ::before: tinted translucent bg + backdrop blur+saturate
│  EYEBROW (accent kicker)    │  ← .eyebrow
│  Linked Title               │  ← <h3><a>   (lights teal on card hover — shared neon)
│  Body copy paragraph…       │  ← <p>
│  Date · N min read          │  ← .post__meta  <time datetime>…</time>
└─────────────────────────────┘
        ╲ sheen streak sweeps L→R on hover (::after, above surface, below text)
```

**Layer stack (z-index, inside the card):**

| Layer | What | z-index |
|-------|------|---------|
| element background | `transparent` (NOT the frost — see below) | auto |
| `::before` | the frosted surface: tinted translucent bg **+ `backdrop-filter`** | `0` |
| `::after` | the diagonal sheen streak | `1` |
| `.u-card__body` | the text content | `2` |

- Built on the unified `.u-card .u-card--text` base (structure, padding, scroll-rise).
- `.glass-card` layers the frost; `.glass-card--vN` selects the preset.
- **The frost + blur live on `::before`, not the element.** A `backdrop-filter` on the
  element itself is re-clipped to its rounded corners inconsistently across Chromium
  forks — **Brave** paints the filter's rectangular region *unclipped*, so a square
  frosted halo escapes past `border-radius` and laps onto neighbouring cards (Chrome
  clips it fine). `overflow:clip` on the `.u-card` parent reliably clips a *descendant's*
  filter in every engine, so the blur goes on the `::before` child. The element keeps
  only `border` + `box-shadow` (box-shadow is never clipped by overflow, so the lift
  glow still escapes as intended). **Do not move `backdrop-filter` back onto the element.**
- The sheen is a single `::after` light streak, parked off-screen left, translated
  across on hover. The card body is raised above it (`z-index: 2`) so text stays crisp.

---

## 3. Parameters

### 3a. Tunable dials (CSS custom properties)

These five drive the **teal strength** and are the only things that vary between
variants. Override them per-element (inline `style`) or per-variant (a `--vN` class).

| Property        | Default (V3) | What it controls |
|-----------------|--------------|------------------|
| `--gc-tint`     | `18%`        | How much **accent** is mixed *into* the surface colour — the card's own teal. Higher = greener card body. (Raised from `10%` so cards over a weak glow don't go grey — see §1 corollary.) |
| `--gc-alpha`    | `50%`        | Surface **opacity**. Higher = more solid/saturated tint; lower = more see-through/glassy. (Constant on hover — see §3d.) |
| `--gc-rim`      | `accent 60% + border-strong` | The **border colour** — the lit catch-edge. A full CSS colour, not a percentage. Brighter/whiter = sharper lit edge. |
| `--gc-rim-hover`| `accent 70% + white 18%` | Border colour on hover (brightens toward white). The one colour that DOES change on hover. |
| `--gc-ring`     | `16%`        | Strength of the **inner** 1px accent ring (just inside the border). |
| `--gc-halo`     | `18%`        | Strength of the **outer** 1px accent ring (just outside the border). |

### 3b. Fixed recipe values (same across variants)

Changing these alters the *material*, not just the teal weight — edit in
`src/components/glass-card/glass-card.css` (`.glass-card`) if you really need to.

| Aspect          | Resting value            | Hover value            |
|-----------------|--------------------------|------------------------|
| Surface fill (`::before`) | `color-mix(accent --gc-tint, --c-bg)` at `--gc-alpha` | **unchanged** (frozen — see §3d) |
| Blur (`::before`) | `blur(22px)`           | **unchanged** (`22px`) |
| Saturation (`::before`) | `saturate(170%)`   | **unchanged** (`170%`) |
| Lift (translateY) | `0`                    | **`0`** (no lift — see §3d) |
| Element background | `transparent`         | `transparent` (held — see §3d) |
| Sheen sweep     | parked `translateX(-120%)`| `translateX(120%)` over **1.05s** `cubic-bezier(.2,.7,.2,1)` |
| Border colour   | `--gc-rim`               | `--gc-rim-hover` |
| Border width    | `1.5px`                  | (same) |
| Accent rings (box-shadow) | inner `--gc-ring`, outer `--gc-halo` | inner `+4%`, outer `+6%` |
| Drop shadow     | `0 14px 44px -16px rgba(0,0,0,.72)` | same depth + a restrained accent glow `0 0 30px -22px` (reach `< 24px` grid gap) |
| Title (h3)      | normal fill              | teal neon (shared `.u-card:hover :is(h2,h3)` — in `u-card.css`, not here) |

### 3c. Required behind the card

The card MUST sit over an accent glow (something for the blur to refract) or it
reads as a flat dark panel. Provided by the section:

- `.services::before` — top-weighted twin-radial glow (Our Services product cards).
- `.blog::before` — right-weighted glow (cards are in the right column).
- `.solutions::before` — left-weighted glow (cards are in the left column).

The section glows are deliberately weighted differently so adjacent sections don't
read as one component pasted thrice — but each puts glow **behind its glass cards**.
If you add `.glass-card` to a new section, give that section a glow backdrop too.
(With `--gc-tint: 18%` the card no longer goes *grey* without glow, but it still
reads flat/unlit — the glow is what gives it depth.)

### 3d. Hover is light + motion only — the surface is frozen (history)

Several iterations established that **changing the surface on hover always read
worse** on this dark, glow-lit, translucent card. Recorded so it isn't re-attempted:

- **Drop alpha to "look glassier"** → on the dark bg, thinning the teal tint lets more
  dark backdrop through and it **desaturates to grey**. Rejected.
- **Add accent / brighten** → "good direction" but **too bright**. Rejected.
- **Deepen to dark teal** (double `color-mix`) → **muddy**. Rejected.
- **The `-8px` lift** → the translucent card moved over a different patch of the uneven
  section glow, so `backdrop-filter` re-sampled a different teal and the surface
  *appeared* to shift colour. Lift removed (kept off by preference).
- **The real culprit behind "different teal on hover":** `.u-card--text:hover {
  background: var(--bg-card-hover) }` (specificity `0,2,0`) overrides `.glass-card`'s
  resting `background: transparent` (`0,1,0`), flipping the **element's own** opaque
  background — *behind* the translucent `::before` frost — so it showed through. Fixed
  by setting `background: transparent` on `.glass-card:hover` (also `0,2,0`, loads
  **after** `u-card.css` → wins by source order). **Do not add a hover background to
  the glass card, and do not re-introduce `--gc-alpha`/tint changes on hover.**

Net: hover = `--gc-rim-hover` rim + stronger accent rings + restrained glow + sheen
sweep + the title neon. Fill colour, blur, opacity, and position are all constant.

---

## 4. Variant presets

Three tuned points on the teal-strength axis. Pick with a class; V3 is the default.

| Variant | Class             | tint | alpha | rim        | Feel |
|---------|-------------------|------|-------|------------|------|
| **V1**  | `.glass-card--v1` | 16%  | 58%   | accent 78% | Balanced — present teal glass, bright rim. |
| **V2**  | `.glass-card--v2` | 26%  | 66%   | accent 92% | Bolder — deeper saturated body, near-full rim. |
| **V3**  | `.glass-card--v3` | 18%  | 50%   | accent 60% | **Refined (default)** — lighter, glassier, subtler rim. |

`.glass-card--v3` is a no-op alias (the `.glass-card` base already carries the V3
defaults); it exists for explicit, symmetrical markup. (V1's tint `16%` is now *lower*
than the V3 default `18%`; the presets remain ordered by overall weight via
alpha + rim, not tint alone.)

---

## 5. How to tweak

**Pick a different preset** — swap the variant class:
```html
<li class="u-card u-card--text glass-card glass-card--v2"> … </li>
```

**Nudge one dial on one card** — inline custom property:
```html
<li class="… glass-card glass-card--v3" style="--gc-tint:22%;--gc-alpha:54%"> … </li>
```
(Via the component, pass `tint` / `alpha` / `rim` — see §6; they become this inline
style. `tint`/`alpha` are validated as `0%–100%`; a bad value fails the build.)

**Change the whole project's default look** — edit the `.glass-card` defaults in
`src/components/glass-card/glass-card.css`. Every card without an explicit `--vN`
follows.

**Change the material (blur, sweep speed, rings)** — edit the fixed values in the
`.glass-card` recipe (§3b). These are intentionally not per-instance props (they're
the identity of the effect, not a per-card knob).

**Do NOT animate the surface on hover** — no lift, no fill/alpha/blur change, no
element background. See §3d for why each was rejected; the hover is rim + sheen +
title-glow by design.

**Re-tune against the glow, not by dimming it** — see §1. If a card looks flat,
strengthen `--gc-tint`/`--gc-rim` or check the section actually has a `::before`
glow behind the card; do not weaken the glow.

---

## 6. How to apply

### 6a. Component (typed, validated) — the primary path, serves BOTH shapes

`src/components/glass-card/glass-card.ts` → `glassCard(params)`. Params are validated
by `src/schema/glass-card.ts` (Effect Schema) — a bad `variant`, an out-of-range
`tint`, a malformed footer, or a missing required field **fails the build**, not
the browser.

One signature covers both text-card shapes. The shape differences are modelled so
invalid combinations can't be expressed:

- `title`, `body` — always required.
- `href` — **Option**. Present → linked title `<h3><a>`; absent → plain `<h3>`.
- `eyebrow` — **Option**. Present → accent kicker; absent → none.
- `footer` — **Option of a tagged Union** (a *choice*, not two flags):
  - `{ _tag: "meta", date, readMinutes }` → the component builds
    `<time datetime="…">Mon D, YYYY</time> · N min read` (owns the machine-readable
    date; reuses `displayDate` from `src/data/posts.ts`).
  - `{ _tag: "cta", label, href }` → a `.link-arrow` call to action.
  - The Union makes "a meta **and** a cta on one card" and "half a pair" (a `date`
    with no `readMinutes`, etc.) **unrepresentable** — the build-time guarantee the
    Schema exists for. The template switches on `_tag` exhaustively; a new variant
    without a case is a `tsc` error, not a silent empty footer.
- `variant` — optional, default `"v3"`. `extraClass` / `tint` / `alpha` / `rim` —
  optional (see §5). All content is `esc()`'d at the boundary.

**Blog/article card** (eyebrow + linked title + time-meta):
```ts
glassCard({
  eyebrow: "Engineering",
  title: "Why Spatial Computing…",
  href: "blog/why-spatial.html",                       // → linked title
  body: "Spatial computing moves…",
  footer: { _tag: "meta", date: "2026-05-01", readMinutes: 4 },
  extraClass: "blog-text",                             // homepage editorial tweaks
});
```

**Services / Solutions card** (no eyebrow, plain title, CTA):
```ts
glassCard({
  title: "InfiExplore",
  body: "AR & MR powered experiential solutions…",     // no href → plain <h3>
  footer: { _tag: "cta", label: "Learn More", href: "#contact" },
});
```

`extraClass: "blog-text"` carries the homepage editorial tweaks (eyebrow tint, etc.)
defined in `.blog .blog-text` (`u-card.overrides.css`).

### 6b. Bare class — low-level escape hatch

If you need glass on a card the component doesn't model (a genuinely different
shape, or non-`<li>` markup), put `glass-card glass-card--vN` directly on the
element. The component is just the typed authoring path; the **class is the
effect**. Requirement: the element must be a `.u-card` (for `overflow:clip`, which
masks the sheen AND clips the `::before` frost — see §2) and sit over a section glow
(§3c). The homepage text-card sets (Services, blog, Solutions) go through the
component (§6a); the photo/overlay cards (`.blog-feature`, `.solution-feature`) are a
different shape and stay bespoke.

> Note: a *bare* `.glass-card` that is NOT also `.u-card--text` will not get the
> element-bg hover swap described in §3d — that swap is what made the
> `background:transparent` hover guard necessary. Keep the guard regardless; it's
> harmless on bare cards and required on the `.u-card--text` ones.

---

## 7. Accessibility & progressive enhancement

- **Reduced motion** (`prefers-reduced-motion: reduce`): the sheen `::after` is
  hidden. (There is no hover lift to remove anymore — hover already does no motion
  beyond the sheen.) The static frost + lit rim + title-glow remain (the effect
  degrades to a still glass card, not a flat one).
- **No `backdrop-filter` support**: the entire glassy fill is inside
  `@supports (backdrop-filter)` on the `::before`. The fallback is the base opaque
  `.u-card` surface — legible, just not frosted. Nothing breaks.
- **Contrast**: body text is `--fg`/`--fg-muted` over the tinted surface; the V3
  tint (now `18%`) is still light enough that AA holds over the dark base. If you
  raise `--gc-tint`/`--gc-alpha` a lot (toward V2+), re-check text contrast over the
  denser surface.
- **Zero client JS**: the whole effect is CSS (`::before` frost, `::after` sweep,
  `:hover`). The component is build-time TypeScript compiled to static HTML. The JS
  budget (≤10 KB) and the "new JS needs approval" rule do not apply.

---

## 8. Files

| File | Role |
|------|------|
| `src/components/glass-card/glass-card.css` → `.glass-card` | The recipe (`::before` frost + element border/shadow) + the five dials + variant presets + reduced-motion + the `background:transparent` hover guard. |
| `src/schema/glass-card.ts` | Effect Schema validating the component's params (variant enum, percent bounds, required content). |
| `src/components/glass-card/glass-card.ts` | `glassCard(params) → string` render fn (the typed authoring path; serves both text-card shapes via Option slots + the footer Union). |
| `src/pages/index/body.ts` | Call sites: Our Services cards, blog teaser cards, AND Solutions cards all via `glassCard()` (§6a). |
| `src/css/tokens.css` | `--c-bg` (teal-charcoal base) + the `--bg-*` surface derivatives that lift toward the accent — the grey-banish fix (§1 corollary). |
| `src/components/u-card/u-card.css` | The `.u-card`/`.u-card--text` base; also the shared card-header title neon (`:hover :is(h2,h3)`) and the `.u-card--text:hover` bg rule that §3d guards against. |
| `src/css/layout.css` → `.services::before`, `.blog::before`, `.solutions::before` | The section glow backdrops the frost refracts. |
| `SPEC.md` → V36 | The project invariant that points here. |
