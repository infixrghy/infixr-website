/**
 * schema/page.ts — Effect Schema for page-level <head> metadata.
 *
 * index.html ships the FULL head superset (og:image:alt, og:locale); about/blog
 * ship a subset. So the shared fields are required, and the index-only fields are
 * modelled as Option<string> — absence is encoded in the type, never as null.
 * This is the "no null, use Option, ultra type safety" rule: a template that
 * forgets to handle a missing og:locale will not compile.
 *
 * Schema ships in `effect` core (the old @effect/schema is merged in). Effect v4.
 */
import { Schema } from "effect";

/** Which top-nav item is the current page. Drives `aria-current` + `is-active`.
 *  v4: multi-arg `Literal(...)` → `Literals([...])` (variadic→array). */
export const NavId = Schema.Literals(["home", "about", "solutions", "products", "blog"]);
export type NavId = typeof NavId.Type;

/**
 * Per-page <head> data. Constant bits (favicons, manifest, charset, viewport)
 * live in the head template literally — they never vary, so they are not modelled
 * here. Only the parts that differ page-to-page are fields.
 */
export const PageMeta = Schema.Struct({
  /** <title> + og:title default source. */
  title: Schema.NonEmptyString,
  /** <meta name="description"> — also the og/twitter description fallback. */
  description: Schema.NonEmptyString,
  /** Absolute canonical URL, e.g. https://infixr.com/about.html */
  canonical: Schema.NonEmptyString,
  /** og:url — usually equals canonical but kept explicit (root "/" vs "/about.html"). */
  ogUrl: Schema.NonEmptyString,
  /** og:title — may differ from <title> (index uses a shorter social title). */
  ogTitle: Schema.NonEmptyString,
  /** og:description — index's is shorter than the meta description. */
  ogDescription: Schema.NonEmptyString,
  /** twitter:title — index uses a brand-led variant distinct from og:title. */
  twitterTitle: Schema.NonEmptyString,
  /** twitter:description. */
  twitterDescription: Schema.NonEmptyString,
  /** Which nav item is active on this page. */
  nav: NavId,

  // ── index-only fields: absent on about/blog → Option, not null ──
  /** og:image:alt — present only on index.html today. */
  ogImageAlt: Schema.OptionFromOptional(Schema.NonEmptyString),
  /** og:locale — present only on index.html today. */
  ogLocale: Schema.OptionFromOptional(Schema.NonEmptyString),
});
export type PageMeta = typeof PageMeta.Type;

/** Decoder: unknown (e.g. a plain page-config object) → validated PageMeta Effect.
 *  v4: `decodeUnknown` → `decodeUnknownEffect`. */
export const decodePageMeta = Schema.decodeUnknownEffect(PageMeta);
