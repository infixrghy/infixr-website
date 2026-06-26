/**
 * pages/blog/meta.ts — page-meta config for the blog index (blog.html).
 *
 * Subset head (no og:image:alt / og:locale → Option None). Unlike index/about,
 * blog's BODY (pages/blog/body.ts) is data-driven — build.ts renders it from
 * content/posts/*.md (via loadPosts in data/posts.ts). This module supplies only the
 * <head> metadata for that page; the per-POST head meta is postPageMeta in body.ts.
 */
export const blogMeta = {
  title: "Blog | InfiXR",
  description:
    "Writing on building, shipping, and measuring industrial VR experiences.",
  canonical: "https://infixr.com/blog",
  ogUrl: "https://infixr.com/blog",
  ogTitle: "Blog | InfiXR",
  ogDescription:
    "Writing on building, shipping, and measuring industrial VR experiences.",
  twitterTitle: "InfiXR Blog",
  twitterDescription:
    "Writing on building, shipping, and measuring industrial VR experiences.",
  nav: "blog",
} as const;
