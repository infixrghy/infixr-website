/**
 * pages/blog/body.ts — the blog-index + per-post page MARKUP (the render layer).
 *
 * Was src/blog.ts → here (the per-page folder, paired with meta.ts). When it moved,
 * the post DATA LAYER (loadPosts / displayDate / parseFrontMatter / the post IO
 * errors) was extracted to src/content.ts — that's content infrastructure shared
 * with the homepage mosaic, not blog-page code. What's left here is purely the blog
 * page's render fns: the index body, the per-post page, and the per-post head meta.
 *
 * The blog body is the one page body generated from data (content/posts/*.md →
 * validated BlogPost[] → marked HTML, all in content.ts). Posts arrive newest-first
 * (content.ts sorts); the single `featured: true` post renders as the large lead
 * card, the rest fill the grid.
 */
import type { BlogPost } from "../../schema/post.ts";
import { displayDate } from "../../content.ts";
import { html, esc } from "../../templates/html.ts";

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
