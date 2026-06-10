/**
 * schema/glass-card.ts — Effect Schema for the glass-card component's params.
 *
 * Unlike schema/post.ts (which validates EXTERNAL markdown front-matter), a glass
 * card's content comes from already-validated data. What this schema guards is the
 * component's OWN parameter API: a typo'd variant ("v4") or an out-of-range tint
 * ("150%") would otherwise render broken glass silently. Decoding the params at
 * build time turns that misuse into a BUILD FAILURE, not a browser surprise — the
 * reason the typed-param approach was chosen over a bare render fn.
 *
 * Matches the post.ts idiom: Schema.Struct, pattern-validated strings, optional →
 * Option (never null). The five teal dials map 1:1 to the .glass-card CSS custom
 * props (--gc-tint/--gc-alpha/--gc-rim/--gc-ring/--gc-halo) documented in
 * design/GLASS-CARD.md.
 *
 * The component serves TWO card shapes (blog/article + the Solutions cards) from
 * one signature. The differences are modelled precisely so the build rejects
 * nonsense:
 *   • eyebrow  → Option        (blog has a category kicker; Solutions doesn't)
 *   • href     → Option        (Some = linked <h3><a>; None = plain <h3>)
 *   • footer   → Option<Union>  a CHOICE between a time-meta line and a CTA link
 * The footer is a tagged Union, NOT two optional pairs: that makes "both a meta
 * AND a cta on one card" and "half a pair" (date without readMinutes, etc.)
 * UNREPRESENTABLE — exactly the build-time guarantee Schema exists to give.
 */
import { Effect, Schema } from "effect";

import { IsoDate } from "./common.ts";

/** A CSS percentage 0–100%, e.g. "50%". Pattern + bound; kept as a string so it
 *  drops straight into a custom-prop value. Guards the teal-strength overrides. */
const Percent = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.isPattern(/^(?:100|\d{1,2})%$/, {
      title: "percentage",
      description: "must be a percentage 0%–100% (e.g. \"50%\")",
    })
  )
);

/** The three tuned presets. Anything else fails the build (no silent fallback). */
export const GlassVariant = Schema.Literals(["v1", "v2", "v3"]);
export type GlassVariant = typeof GlassVariant.Type;

/**
 * The footer slot — a tagged Union, so exactly one form (or none) is possible:
 *   • meta — a publish date + read estimate → the component builds
 *            `<time datetime=…>Mon D, YYYY</time> · N min read` (blog/article cards).
 *            date + readMinutes are required TOGETHER (no half-set pair).
 *   • cta  — a label + href → a `.link-arrow` call to action (Solutions cards).
 * Both fields of each variant are required, so a malformed footer fails the build.
 */
export const GlassFooter = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("meta"),
    /** Publish date, ISO — drives the <time datetime>. */
    date: IsoDate,
    /** Read time in minutes — the "· N min read" half. */
    readMinutes: Schema.Number.pipe(Schema.check(Schema.isGreaterThan(0))),
  }),
  Schema.Struct({
    _tag: Schema.Literal("cta"),
    /** Visible CTA text, e.g. "View Case Study". */
    label: Schema.NonEmptyString,
    /** CTA destination, e.g. "#contact". */
    href: Schema.NonEmptyString,
  }),
]);
export type GlassFooter = typeof GlassFooter.Type;

/**
 * Glass-card render params, serving both the blog/article and Solutions card
 * shapes. `title` + `body` are always required; `eyebrow`, `href` (linked title),
 * and `footer` are Option/choice so each shape supplies only what it has. The five
 * teal dials are optional per-instance overrides — omit them and the variant preset
 * (or the V3 default) drives the look.
 */
export const GlassCardParams = Schema.Struct({
  /** Card title (always present). */
  title: Schema.NonEmptyString,
  /** Body copy (one paragraph). */
  body: Schema.NonEmptyString,

  /** Some → title is a link (<h3><a href>); None → plain <h3>. */
  href: Schema.OptionFromOptional(Schema.NonEmptyString),
  /** Some → eyebrow kicker above the title (e.g. category); None → no kicker. */
  eyebrow: Schema.OptionFromOptional(Schema.NonEmptyString),
  /** The footer: a time-meta line OR a CTA link OR nothing (see GlassFooter). */
  footer: Schema.OptionFromOptional(GlassFooter),

  /** Which tuned preset: V3 ("Refined") is the chosen default. */
  variant: GlassVariant.pipe(Schema.withDecodingDefaultType(Effect.succeed("v3" as const))),

  /** Extra class on the <li> (e.g. "blog-text" for the homepage editorial tweaks). */
  extraClass: Schema.OptionFromOptional(Schema.NonEmptyString),

  // ── per-instance teal-dial overrides (Option → never null) ──
  /** Override --gc-tint: accent mixed INTO the surface. */
  tint: Schema.OptionFromOptional(Percent),
  /** Override --gc-alpha: surface opacity. */
  alpha: Schema.OptionFromOptional(Percent),
  /** Override --gc-rim: full CSS colour for the lit border (free-form, not %). */
  rim: Schema.OptionFromOptional(Schema.NonEmptyString),
});
export type GlassCardParams = typeof GlassCardParams.Type;

/** Decode unknown → validated params; throws (fails the build) on bad input. */
export const decodeGlassCard = Schema.decodeUnknownSync(GlassCardParams);
