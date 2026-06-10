/**
 * content.ts — the blog-post DATA LAYER, shared across pages.
 *
 * Reads content/posts/*.md → validates front-matter (schema/post.ts) → marked-
 * renders the body → returns a newest-first BlogPost[]. Plus the deterministic
 * date formatter used wherever a post date is shown.
 *
 * WHY ITS OWN MODULE (not in pages/blog/body.ts): the loader + formatter are NOT
 * blog-page code — they are content infrastructure that several surfaces consume:
 *   - pages/blog/body.ts   — the blog index + per-post pages
 *   - pages/index/body.ts  — the homepage blog mosaic (3-card teaser)
 *   - components/glass-card — displayDate, for the <time> meta line
 * Previously this lived in src/blog.ts and home.ts imported displayDate FROM the
 * blog page — a page reaching into another page's file. Pulling it here makes the
 * dependency arrow page→data (correct) instead of page→page (the misfiling).
 *
 * marked runs build-time only (0 client bytes). The pipeline is an Effect with a
 * typed failure channel: a bad/missing front-matter field fails with a
 * Schema.SchemaError; a missing posts dir or unreadable file fails with a tagged
 * PostsDirError/PostReadError — never an opaque defect.
 */
import { Effect, Schema } from "effect";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";

import {
  decodeFrontMatter,
  type BlogPost,
} from "./schema/post.ts";

const POSTS_DIR = "content/posts";

/** Typed IO errors for the post loader. A missing posts dir or an unreadable
 *  .md file fails with a LOCATED tagged error on the Effect error channel,
 *  not an untyped defect. */
class PostsDirError extends Schema.TaggedErrorClass<PostsDirError>()("PostsDirError", {
  path: Schema.String,
  cause: Schema.Defect(),
}) {}
class PostReadError extends Schema.TaggedErrorClass<PostReadError>()("PostReadError", {
  path: Schema.String,
  cause: Schema.Defect(),
}) {}

/** Format an ISO date (YYYY-MM-DD) as e.g. "May 1, 2026" — deterministic, UTC. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const displayDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/**
 * The post meta-line fragment: `<time datetime=…>Mon D, YYYY</time> &middot;
 * N min read` — the ONE source for it (it was hand-built in three files: the
 * blog cards, the home feature card, the glass-card meta footer). Returns the
 * inner fragment only: callers own their wrapper (`<p class="post__meta">` vs
 * `<p class="u-card__meta">`) and any trailing segments (the blog index appends
 * `&middot; Category`). Inputs are schema-validated upstream (IsoDate pattern,
 * positive number), so they interpolate raw.
 */
export const timeMeta = (date: string, readMinutes: number): string =>
  `<time datetime="${date}">${displayDate(date)}</time> &middot; ${String(readMinutes)} min read`;

/**
 * Split a raw .md file into its front-matter object + markdown body. Front-matter
 * is the block between the leading `---` fences; values may be quoted. This is a
 * deliberately tiny parser (no YAML dep) — our front-matter is flat key:value.
 */
// CC 11 / CRAP 132: VERBATIM-relocated from the old src/blog.ts (this code is
// unchanged by the per-page-folder reorg — fallow's new-only gate flags it only
// because content.ts is a new FILE path, not because the logic is new). It passed
// the gate in blog.ts. The scalar-coercion branch ladder is inherently branchy but
// simple + covered by the build (a bad field fails the Schema decode downstream).
// fallow-ignore-next-line complexity
function parseFrontMatter(raw: string): { data: Record<string, unknown>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const [, fm, body] = m;
  const data: Record<string, unknown> = {};
  for (const line of fm.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val: unknown = line.slice(idx + 1).trim();
    // strip surrounding quotes
    if (typeof val === "string" && /^".*"$/.test(val)) val = val.slice(1, -1);
    // coerce scalars the schema expects as non-strings
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (typeof val === "string" && /^\d+$/.test(val)) val = Number(val);
    data[key] = val;
  }
  return { data, body };
}

/** Load + validate + render every post. Typed failure channel: a bad/missing
 *  front-matter field fails with `Schema.SchemaError` (the decode); a missing
 *  posts dir or unreadable file fails with `PostsDirError`/`PostReadError` (the
 *  tagged IO wraps). `Effect.gen` short-circuits on the first, so one bad post
 *  aborts the build with a located message — not never, not an opaque defect. */
export const loadPosts: Effect.Effect<
  ReadonlyArray<BlogPost>,
  Schema.SchemaError | PostsDirError | PostReadError
> = Effect.gen(
  function* () {
    const files = (yield* Effect.tryPromise({
      try: () => readdir(POSTS_DIR),
      catch: (cause) => new PostsDirError({ path: POSTS_DIR, cause }),
    })).filter((f) => f.endsWith(".md"));

    const posts: BlogPost[] = [];
    for (const file of files) {
      const path = join(POSTS_DIR, file);
      const raw = yield* Effect.tryPromise({
        try: () => readFile(path, "utf8"),
        catch: (cause) => new PostReadError({ path, cause }),
      });
      const { data, body } = parseFrontMatter(raw);
      const fm = yield* decodeFrontMatter(data);
      // marked.parse is synchronous (returns string) when no async extensions are
      // registered — wrap in Effect.sync, not Effect.promise (a string has no .then).
      const bodyHtml = yield* Effect.sync(() => marked.parse(body) as string);
      posts.push({ ...fm, bodyHtml });
    }

    // newest first
    posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return posts;
  }
);
