/**
 * utils/posts.ts — pure helpers for post data (no IO; loading/validation is
 * Astro's content layer + src/data/post-schema.ts).
 */
import type { CollectionEntry } from "astro:content";

/** Format an ISO date (YYYY-MM-DD) as e.g. "May 1, 2026" — deterministic, UTC,
 *  pure string math (no Date, no timezone drift). */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const displayDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/** Newest-first sort (ISO strings compare lexicographically = chronologically).
 *  The newest post automatically leads the blog index + homepage teaser — the
 *  date is the only lever, there is no "featured" flag. */
export const newestFirst = (
  posts: CollectionEntry<"posts">[],
): CollectionEntry<"posts">[] =>
  [...posts].sort((a, b) => b.data.date.localeCompare(a.data.date));
