/**
 * blog.ts — data-driven blog: content/posts/*.md → validated BlogPost[] → rendered
 * blog index body. This is Phase 1.5: the blog body is the one page body that is
 * NOT a static partial — it is generated from front-matter + markdown.
 *
 * Pipeline per file: read → split `---` front-matter fence → parse key:value →
 * Schema.decode (typed failure on bad/missing fields) → marked() the body to HTML.
 * marked runs build-time only (0 client bytes).
 *
 * Posts are sorted newest-first; the single `featured: true` post renders as the
 * large lead card, the rest fill the grid — mirroring the prior hand-written
 * blog.html layout, now sourced from data.
 */
import { Effect, Schema, Option } from "effect";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";

import {
  decodeFrontMatter,
  type BlogPost,
} from "./schema/post.ts";
import { html, esc } from "./templates/html.ts";

const POSTS_DIR = "content/posts";

/** Typed IO errors for the post loader (Effect v4). A missing posts dir or an
 *  unreadable .md file now fails decode with a LOCATED tagged error on the Effect
 *  error channel, not an untyped defect (was `Effect.promise` → `Effect<A,never>`). */
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
 * Split a raw .md file into its front-matter object + markdown body. Front-matter
 * is the block between the leading `---` fences; values may be quoted. This is a
 * deliberately tiny parser (no YAML dep) — our front-matter is flat key:value.
 */
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
 *  aborts the build with a located message — not never, not an opaque defect.
 *  v4: decode error is `Schema.SchemaError` (was `ParseResult.ParseError`). */
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

/** Meta line: `<time>Date</time> · N min read · Category`. */
const postMeta = (p: BlogPost): string =>
  html`<p class="post__meta"><time datetime="${p.date}">${displayDate(
    p.date
  )}</time> &middot; ${String(p.readMinutes)} min read &middot; ${esc(p.category)}</p>`;

/** The large lead card for the featured post. */
const renderFeatured = (p: BlogPost): string => html`<article class="u-card u-card--text glass-card glass-card--v3 blog-featured">
      <div class="u-card__body">
        ${postMeta(p)}
        <h2><a href="blog/${esc(p.slug)}.html">${esc(p.title)}</a></h2>
        <p>${esc(p.excerpt)}</p>
        <a class="link-arrow" href="blog/${esc(p.slug)}.html">Read post &rarr;</a>
      </div>
    </article>`;

/** A small grid card. */
const renderCard = (p: BlogPost): string => html`<article class="u-card u-card--text glass-card glass-card--v3">
        <div class="u-card__body">
          ${postMeta(p)}
          <h3><a href="blog/${esc(p.slug)}.html">${esc(p.title)}</a></h3>
          <p>${esc(p.excerpt)}</p>
          <a class="link-arrow" href="blog/${esc(p.slug)}.html">Read &rarr;</a>
        </div>
      </article>`;

/**
 * Per-post page <main>: a page-hero header (category eyebrow + title + meta line)
 * above the marked-rendered body wrapped in `.prose`. The markdown body has NO
 * title of its own (title/date/read-time live in front-matter), so the header is
 * synthesised here — without it every post would be a titleless wall of text.
 * bodyHtml is trusted (our own markdown, marked-rendered at build time).
 */
export const renderPost = (p: BlogPost): string => html`<main class="post-page">

  <article>
    <header class="page-hero" aria-labelledby="post-title">
      <p class="eyebrow">${esc(p.category)}</p>
      <h1 id="post-title" class="page-title">${esc(p.title)}</h1>
      ${postMeta(p)}
    </header>

    <div class="prose">
      ${p.bodyHtml}
    </div>

    <p class="post-page__back"><a class="link-arrow" href="../blog.html">&larr; All posts</a></p>
  </article>

</main>`;

/**
 * Page-meta config for a single post page (blog/<slug>.html). Mirrors blogMeta's
 * URL format; canonical/og:url point at the post's own nested URL. Subset head
 * (no og:image:alt / og:locale → Option None). nav highlights "blog".
 */
export const postPageMeta = (p: BlogPost) => {
  const url = `https://infixr.com/blog/${p.slug}.html`;
  return {
    title: `${p.title} | InfiXR`,
    description: p.excerpt,
    canonical: url,
    ogUrl: url,
    ogTitle: p.title,
    ogDescription: p.excerpt,
    twitterTitle: p.title,
    twitterDescription: p.excerpt,
    nav: "blog",
  } as const;
};

/**
 * Render the full blog-index <main>. Featured post (the one with featured:true,
 * or newest as fallback) leads; the remaining posts fill the grid.
 */
export const renderBlogBody = (posts: ReadonlyArray<BlogPost>): string => {
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);

  return html`<main>

  <section class="page-hero" aria-labelledby="page-title">
    <p class="eyebrow">Field Notes</p>
    <h1 id="page-title" class="page-title">Writing on shipping VR that actually gets used.</h1>
    <p class="page-lead">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  </section>

  <section class="blog-list" aria-label="All blog posts">

    ${renderFeatured(featured)}

    <div class="blog__grid">
      ${rest.map((p) => "\n      " + renderCard(p)).join("")}
    </div>

  </section>

</main>`;
};
