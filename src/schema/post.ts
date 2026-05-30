/**
 * schema/post.ts — Effect Schema for blog post front-matter.
 *
 * Each content/posts/*.md file begins with YAML-ish front-matter that decodes
 * into BlogPost. Required fields fail the build if missing (a post with no date
 * cannot render its <time>); genuinely optional fields are Option<string> so the
 * template must branch on presence — never a null slipping through.
 *
 * `date` is kept as an ISO string (YYYY-MM-DD) rather than a Date: the build is
 * deterministic and string dates avoid timezone drift in the rendered <time>.
 */
import { Schema } from "effect";

/** ISO calendar date, e.g. "2026-05-01". Validated by pattern, kept as string. */
const IsoDate = Schema.NonEmptyString.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, {
    message: () => "date must be ISO YYYY-MM-DD",
  })
);

/** Front-matter of a single blog post (the fields above the `---` fence). */
export const BlogPostFrontMatter = Schema.Struct({
  /** Post headline. */
  title: Schema.NonEmptyString,
  /** Publish date, ISO. Drives <time datetime> + the human display string. */
  date: IsoDate,
  /** Estimated read time in minutes, e.g. 4. */
  readMinutes: Schema.Positive,
  /** Section label, e.g. "Engineering" / "Field notes". */
  category: Schema.NonEmptyString,
  /** URL slug — the output filename stem (blog/<slug>.html). */
  slug: Schema.NonEmptyString.pipe(
    Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: () => "slug must be kebab-case",
    })
  ),
  /** One-paragraph excerpt for cards + meta description. */
  excerpt: Schema.NonEmptyString,
  /** Feature the post at the top of the index? Exactly one should be true. */
  featured: Schema.optionalWith(Schema.Boolean, { default: () => false }),

  // ── optional → Option, never null ──
  /** Hero/cover image path; absent posts render text-only cards. */
  coverImage: Schema.OptionFromUndefinedOr(Schema.NonEmptyString),
  /** Last-updated date if revised after publish. */
  updated: Schema.OptionFromUndefinedOr(IsoDate),
});
export type BlogPostFrontMatter = typeof BlogPostFrontMatter.Type;

/** A fully-resolved post: validated front-matter + rendered HTML body. */
export interface BlogPost extends BlogPostFrontMatter {
  /** marked-rendered HTML of the markdown body (build-time only). */
  readonly bodyHtml: string;
}

export const decodeFrontMatter = Schema.decodeUnknown(BlogPostFrontMatter);
