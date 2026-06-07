# Glass Card — component spec

The frosted-glass card used by the homepage **blog teaser** text cards and the
**"What We Build" (Solutions)** text cards. One CSS recipe, one typed component,
five tunable parameters. This document specs the effect, every parameter, how to
tweak them, and how to apply it.

> Source of truth for project invariants is [`../SPEC.md`](../SPEC.md) (see **V36**).
> This file is the detailed component spec referenced from there and from the code
> comments in `src/css/components.css`, `src/templates/glass-card.ts`,
> `src/schema/glass-card.ts`. (All `src/…` / `SPEC.md` paths below are relative to
> the repo root, not this `design/` folder.)

---

## 1. What it is

A translucent card whose background is **blurred + saturated** (frosted glass) and
whose surface carries a **teal tint** with a **bright teal "lit" rim**. On hover it
**lifts**, the frost **deepens**, the rim **brightens**, and a **diagonal sheen**
sweeps across the pane.

The chosen look (project default) is **variant V3 — "Refined"**: a lighter tint and
subtler rim than the bolder presets, so it reads as elegant glass rather than a
heavy slab.

### The contrast principle (read this before tuning)

`backdrop-filter: blur()` shows a blurred copy of **whatever is behind the element**.
A frosted card is therefore only as luminous as the thing it sits over. Each section
paints an accent **glow backdrop** (`.blog::before`, `.solutions::before`) and the
card frost refracts *that glow* — it is the card's light source.

**Consequence:** the card's contrast must come from the **card itself** (its tinted
surface + lit rim), **not** from dimming the surrounding glow. Muting the glow dims
the card *interior* (less light to refract) and makes contrast **worse**, not better.
This was learned empirically during design — do not "reduce the background teal" to
make a card pop; instead push teal into the surface (`--gc-tint`, `--gc-alpha`) and
the rim (`--gc-rim`).

---

## 2. Anatomy

```
┌─────────────────────────────┐  ← --gc-rim  (1.5px lit teal border)
│ ░░░░░░░░ frosted surface ░░░ │  ← tinted translucent bg + backdrop blur+saturate
│  EYEBROW (accent kicker)    │  ← .eyebrow
│  Linked Title               │  ← <h3><a>
│  Body copy paragraph…       │  ← <p>
│  Date · N min read          │  ← .post__meta  <time datetime>…</time>
└─────────────────────────────┘
        ╲ sheen streak sweeps L→R on hover (::after, above surface, below text)
```

- Built on the unified `.u-card .u-card--text` base (structure, padding, scroll-rise).
- `.glass-card` layers the frost; `.glass-card--vN` selects the preset.
- The sheen is a single `::after` light streak, parked off-screen left, translated
  across on hover. The card body is raised above it (`z-index`) so text stays crisp.

---

## 3. Parameters

### 3a. Tunable dials (CSS custom properties)

These five drive the **teal strength** and are the only things that vary between
variants. Override them per-element (inline `style`) or per-variant (a `--vN` class).

| Property        | Default (V3) | What it controls |
|-----------------|--------------|------------------|
| `--gc-tint`     | `10%`        | How much **accent** is mixed *into* the surface colour — the card's own teal. Higher = greener card body. |
| `--gc-alpha`    | `50%`        | Surface **opacity**. Higher = more solid/saturated tint; lower = more see-through/glassy. (Hover drops this by 8 points to brighten.) |
| `--gc-rim`      | `accent 60% + border-strong` | The **border colour** — the lit catch-edge. A full CSS colour, not a percentage. Brighter/whiter = sharper lit edge. |
| `--gc-rim-hover`| `accent 70% + white 18%` | Border colour on hover (brightens toward white). |
| `--gc-ring`     | `16%`        | Strength of the **inner** 1px accent ring (just inside the border). |
| `--gc-halo`     | `18%`        | Strength of the **outer** 1px accent ring (just outside the border). |

### 3b. Fixed recipe values (same across variants)

Changing these alters the *material*, not just the teal weight — edit in
`src/css/components.css` (`.glass-card`) if you really need to.

| Aspect          | Resting value            | Hover value            |
|-----------------|--------------------------|------------------------|
| Blur            | `blur(22px)`             | `blur(28px)`           |
| Saturation      | `saturate(170%)`         | `saturate(185%)`       |
| Lift (translateY)| `0`                     | `-8px`                 |
| Sheen sweep     | parked `translateX(-120%)`| `translateX(120%)` over **1.05s** `cubic-bezier(.2,.7,.2,1)` |
| Border width    | `1.5px`                  | (same)                 |
| Drop shadow     | `0 14px 44px -16px rgba(0,0,0,.72)` | deepened + restrained accent halo |

### 3c. Required behind the card

The card MUST sit over an accent glow (something for the blur to refract) or it
reads as a flat dark panel. Provided by the section:

- `.blog::before` — right-weighted glow (cards are in the right column).
- `.solutions::before` — left-weighted glow (cards are in the left column).

The two are deliberately weighted to opposite sides so the adjacent sections don't
read as one component pasted twice — but both put glow **behind their glass cards**.
If you add `.glass-card` to a new section, give that section a glow backdrop too.

---

## 4. Variant presets

Three tuned points on the teal-strength axis. Pick with a class; V3 is the default.

| Variant | Class             | tint | alpha | rim        | Feel |
|---------|-------------------|------|-------|------------|------|
| **V1**  | `.glass-card--v1` | 16%  | 58%   | accent 78% | Current/balanced — present teal glass, bright rim. |
| **V2**  | `.glass-card--v2` | 26%  | 66%   | accent 92% | Bolder — deeper saturated body, near-full rim. |
| **V3**  | `.glass-card--v3` | 10%  | 50%   | accent 60% | **Refined (default)** — lighter, glassier, subtler rim. |

`.glass-card--v3` is a no-op alias (the `.glass-card` base already carries the V3
defaults); it exists for explicit, symmetrical markup.

---

## 5. How to tweak

**Pick a different preset** — swap the variant class:
```html
<li class="u-card u-card--text glass-card glass-card--v2"> … </li>
```

**Nudge one dial on one card** — inline custom property:
```html
<li class="… glass-card glass-card--v3" style="--gc-tint:14%;--gc-alpha:54%"> … </li>
```
(Via the component, pass `tint` / `alpha` / `rim` — see §6; they become this inline
style. `tint`/`alpha` are validated as `0%–100%`; a bad value fails the build.)

**Change the whole project's default look** — edit the `.glass-card` defaults in
`src/css/components.css`. Every card without an explicit `--vN` follows.

**Change the material (blur, sweep speed, lift)** — edit the fixed values in the
`.glass-card` recipe (§3b). These are intentionally not per-instance props (they're
the identity of the effect, not a per-card knob).

**Re-tune against the glow, not by dimming it** — see §1. If a card looks flat,
strengthen `--gc-tint`/`--gc-rim` or check the section actually has a `::before`
glow behind the card; do not weaken the glow.

---

## 6. How to apply

### 6a. Component (typed, validated) — the primary path, serves BOTH shapes

`src/templates/glass-card.ts` → `glassCard(params)`. Params are validated by
`src/schema/glass-card.ts` (Effect Schema) — a bad `variant`, an out-of-range
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
    date; reuses `displayDate`).
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

**Solutions card** (no eyebrow, plain title, CTA):
```ts
glassCard({
  title: "Corporate Training",
  body: "Immersive scenarios that sharpen…",           // no href → plain <h3>
  footer: { _tag: "cta", label: "View Case Study", href: "#contact" },
});
```

`extraClass: "blog-text"` carries the homepage editorial tweaks (eyebrow tint,
linked-title hover) defined in `.blog .blog-text` (components.css).

### 6b. Bare class — low-level escape hatch

If you need glass on a card the component doesn't model (a genuinely different
shape, or non-`<li>` markup), put `glass-card glass-card--vN` directly on the
element. The component is just the typed authoring path; the **class is the
effect**. Requirement: the element must be a `.u-card` (for `overflow:clip`, which
masks the sheen) and sit over a section glow (§3c). Both homepage text-card sets
(blog + Solutions) go through the component (§6a); the photo/overlay cards
(`.blog-feature`, `.solution-feature`) are a different shape and stay bespoke.

---

## 7. Accessibility & progressive enhancement

- **Reduced motion** (`prefers-reduced-motion: reduce`): the sheen `::after` is
  hidden and the hover lift is removed. The static frost + lit rim remain (the
  effect degrades to a still glass card, not a flat one).
- **No `backdrop-filter` support**: the entire glassy fill is inside
  `@supports (backdrop-filter)`. The fallback is the base opaque `.u-card` surface —
  legible, just not frosted. Nothing breaks.
- **Contrast**: body text is `--fg`/`--fg-muted` over the tinted surface; the V3
  tint is light enough that AA holds. If you raise `--gc-tint`/`--gc-alpha` a lot
  (toward V2+), re-check text contrast over the denser surface.
- **Zero client JS**: the whole effect is CSS (`::after` sweep, `:hover`). The
  component is build-time TypeScript compiled to static HTML. The ≤5 KB JS budget
  and the "new JS needs approval" rule do not apply.

---

## 8. Files

| File | Role |
|------|------|
| `src/css/components.css` → `.glass-card` | The recipe + the five dials + variant presets + reduced-motion. |
| `src/schema/glass-card.ts` | Effect Schema validating the component's params (variant enum, percent bounds, required content). |
| `src/templates/glass-card.ts` | `glassCard(params) → string` render fn (the typed authoring path; serves both text-card shapes via Option slots + the footer Union). |
| `src/home.ts` | Call sites: blog teaser cards AND Solutions cards both via `glassCard()` (§6a). |
| `src/css/layout.css` → `.blog::before`, `.solutions::before` | The section glow backdrops the frost refracts. |
| `SPEC.md` → V36 | The project invariant that points here. |
