/**
 * schema/button.ts — Effect Schema for the button() component's params.
 *
 * Mirrors schema/glass-card.ts: this guards the component's OWN parameter API, not
 * external data. A typo'd variant ("primaryy") or a half-set action would otherwise
 * render a broken/wrong button silently; decoding at build time makes that misuse a
 * BUILD FAILURE.
 *
 * Two things are modelled precisely so nonsense is unrepresentable:
 *   • variant → a closed Literal set (the surface classes in css/components.css).
 *   • action → a tagged Union, NOT an optional href + optional type. This is the
 *     FUNCTIONAL link-vs-submit split: a "link" renders <a href>, a "submit"/"button"
 *     renders <button type=…>. Making it a union means "an href AND type=submit" and
 *     "neither" are both impossible — the component can never turn the contact form's
 *     submit into an anchor (which would break the form) or emit a hrefless <a>.
 */
import { Effect, Schema } from "effect";

/** The surface variants — each maps to a .btn--* class (see components.css BUTTONS).
 *  Anything else fails the build (no silent fallback to a default look). */
export const ButtonVariant = Schema.Literals(["primary", "ghost", "glass"]);
export type ButtonVariant = typeof ButtonVariant.Type;

/**
 * What the button DOES — a tagged Union so exactly one form is possible:
 *   • link   — an <a href> (navigation). href required.
 *   • button — a <button type>; `kind` is the native type. Defaults to "submit"
 *              (the contact form's send). "button" is for JS-driven actions; this
 *              project ships almost none, but the type stays honest.
 */
export const ButtonAction = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("link"),
    /** Destination, e.g. "#contact" or "index.html#contact". */
    href: Schema.NonEmptyString,
  }),
  Schema.Struct({
    _tag: Schema.Literal("button"),
    /** Native button type. submit = form send (default); button = JS hook. */
    kind: Schema.Literals(["submit", "button"]).pipe(
      Schema.withDecodingDefaultType(Effect.succeed("submit" as const))
    ),
  }),
]);
export type ButtonAction = typeof ButtonAction.Type;

/**
 * Button render params. `label` + `variant` + `action` are the core ask; `uppercase`
 * and `extraClass` are optional modifiers. No per-instance colour dials (the glass
 * pill's look is fixed across its two uses — speculative knobs omitted, unlike the
 * glass card whose tint genuinely varies).
 */
export const ButtonParams = Schema.Struct({
  /** Visible button text. */
  label: Schema.NonEmptyString,
  /** Surface variant → .btn--primary | .btn--ghost | .btn--glass. */
  variant: ButtonVariant.pipe(
    Schema.withDecodingDefaultType(Effect.succeed("primary" as const))
  ),
  /** Link (<a href>) or button (<button type>) — the functional split. */
  action: ButtonAction,
  /** Add .btn--upper (uppercase + tighter tracking) when true. Default false. */
  uppercase: Schema.Boolean.pipe(Schema.withDecodingDefaultType(Effect.succeed(false))),
  /** Extra class(es) on the element, e.g. a scoping hook. */
  extraClass: Schema.OptionFromOptional(Schema.NonEmptyString),
});
export type ButtonParams = typeof ButtonParams.Type;

/** Decode unknown → validated params; throws (fails the build) on bad input. */
export const decodeButton = Schema.decodeUnknownSync(ButtonParams);
