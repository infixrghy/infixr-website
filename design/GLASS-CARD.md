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

There are two entry points. Use the component for the blog/article card shape; use
the bare class for any other card.

### 6a. Component (typed, validated) — for blog/article cards

`src/templates/glass-card.ts` → `glassCard(params)`. Params are validated by
`src/schema/glass-card.ts` (Effect Schema) — a bad `variant`, an out-of-range
`tint`, or a missing required field **fails the build**, not the browser.

```ts
import { glassCard } from "./templates/glass-card.ts";

glassCard({
  eyebrow: "Engineering",                 // required — accent kicker
  title: "Why Spatial Computing…",        // required — linked title
  href: "blog/why-spatial.html",          // required — destination
  body: "Spatial computing moves…",       // required — one paragraph
  date: "2026-05-01",                     // required — ISO; drives <time datetime>
  readMinutes: 4,                         // required — "· N min read"
  variant: "v3",                          // optional — default "v3"
  extraClass: "blog-text",                // optional — extra class on the <li>
  // tint / alpha / rim — optional per-instance dial overrides
});
```

The component **owns the meta line**: it builds `<time datetime="…">Mon D, YYYY</time>
· N min read` from `date` + `readMinutes` (reusing `displayDate`), so the
machine-readable date is never lost. Content is `esc()`'d at the boundary.

`extraClass: "blog-text"` carries the homepage editorial tweaks (eyebrow tint,
linked-title hover) defined in `.blog .blog-text` (components.css).

### 6b. Bare class — for any other card shape

The Solutions cards have a different shape (CTA link, unlinked title, no eyebrow),
so they carry the **class** on their own bespoke markup rather than routing through
the component. The shared thing is the surface, not the markup:

```html
<li class="u-card u-card--text glass-card glass-card--v3">
  <div class="u-card__body">
    <h3>Corporate Training</h3>
    <p>Immersive scenarios that sharpen…</p>
    <a class="link-arrow" href="#contact">View Case Study →</a>
  </div>
</li>
```

Requirement: the card must be inside a `.u-card` (for `overflow:clip`, which masks
the sheen) and over a section glow (§3c).

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
| `src/templates/glass-card.ts` | `glassCard(params) → string` render fn (the typed authoring path for blog-shape cards). |
| `src/home.ts` | Call sites: blog teaser text cards via `glassCard()`; Solutions cards via the bare class. |
| `src/css/layout.css` → `.blog::before`, `.solutions::before` | The section glow backdrops the frost refracts. |
| `SPEC.md` → V36 | The project invariant that points here. |
