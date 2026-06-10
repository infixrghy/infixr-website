/**
 * schema/post.ts — Effect Schema for blog post front-matter.
 *
 * Each content/posts/*.md file begins with YAML-ish front-matter that decodes
 * into BlogPost. Missing/malformed fields fail the build (a post with no date
 * cannot render its <time>). Every field here is read by a renderer — a field
 * nothing consumes is a promise the code doesn't keep (coverImage + updated
 * were dropped for exactly that; re-add one WITH its renderer, as
 * Schema.OptionFromOptional so absence stays typed, never null).
 *
 * `date` is kept as an ISO string (YYYY-MM-DD) rather than a Date: the build is
 * deterministic and string dates avoid timezone drift in the rendered <time>.
 */
import { Effect, Schema } from "effect";

import { IsoDate } from "./common.ts";

/** Front-matter of a single blog post (the fields above the `---` fence). */
export const BlogPostFrontMatter = Schema.Struct({
  /** Post headline. */
  title: Schema.NonEmptyString,
  /** Publish date, ISO. Drives <time datetime> + the human display string. */
  date: IsoDate,
  /** Estimated read time in minutes, e.g. 4. */
  readMinutes: Schema.Number.pipe(Schema.check(Schema.isGreaterThan(0))),
  /** Section label, e.g. "Engineering" / "Field notes". */
  category: Schema.NonEmptyString,
  /** URL slug — the output filename stem (blog/<slug>.html). */
  slug: Schema.NonEmptyString.pipe(
    Schema.check(
      Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        title: "kebab-case slug",
        description: "slug must be kebab-case",
      })
    )
  ),
  /** One-paragraph excerpt for cards + meta description. */
  excerpt: Schema.NonEmptyString,
  /** Feature the post at the top of the index? Exactly one should be true.
   *  Absent in front-matter → defaults to false. */
  featured: Schema.Boolean.pipe(Schema.withDecodingDefaultType(Effect.succeed(false))),
});
export type BlogPostFrontMatter = typeof BlogPostFrontMatter.Type;

/** A fully-resolved post: validated front-matter + rendered HTML body. */
export interface BlogPost extends BlogPostFrontMatter {
  /** marked-rendered HTML of the markdown body (build-time only). */
  readonly bodyHtml: string;
}

export const decodeFrontMatter = Schema.decodeUnknownEffect(BlogPostFrontMatter);
