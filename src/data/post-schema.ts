/**
 * data/post-schema.ts — zod schema for blog post front-matter.
 *
 * Consumed by src/content.config.ts (the `posts` collection) and unit-tested
 * directly. All six fields are required; a missing/malformed field fails the
 * BUILD with the file named, not the browser (same guarantee the old Effect
 * Schema gave).
 *
 * Kept in its own module (not inline in content.config.ts) so tests can import
 * it without touching Astro's virtual `astro:content` module.
 */
import { z } from "astro/zod";

/** ISO calendar date kept as a STRING (YYYY-MM-DD): deterministic builds, no
 *  timezone drift in the rendered <time>. YAML parses an unquoted 2026-06-26
 *  as a Date object, so accept both and normalise Date → ISO string (UTC —
 *  YAML dates are UTC midnight, so the slice can't shift the day). */
const isoDate = z
  .union([z.string(), z.date()])
  .transform((v) => (typeof v === "string" ? v : v.toISOString().slice(0, 10)))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be ISO YYYY-MM-DD"));

export const postSchema = z.object({
  /** Post headline. */
  title: z.string().min(1),
  /** Publish date — drives <time datetime> AND ordering (newest leads). */
  date: isoDate,
  /** Estimated read time in minutes, > 0. */
  readMinutes: z.number().positive(),
  /** Section label, e.g. "Engineering" / "Perspective". */
  category: z.string().min(1),
  /** URL slug — becomes blog/<slug>.html. Kebab-case only. */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  /** One-paragraph excerpt for cards + meta description. */
  excerpt: z.string().min(1),
});

export type PostFrontMatter = z.infer<typeof postSchema>;
