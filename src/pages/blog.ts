/**
 * pages/blog.ts — page-meta config for the blog index (blog.html).
 *
 * Subset head (no og:image:alt / og:locale → Option None). Unlike index/about,
 * blog's BODY is NOT a static partial — build.ts renders it from content/posts/*.md
 * (Phase 1.5). This module supplies only the <head> metadata for that page.
 */
export const blogMeta = {
  title: "Blog | InfiXR",
  description:
    "Field notes on building, shipping, and measuring industrial VR experiences.",
  canonical: "https://infixr.com/blog.html",
  ogUrl: "https://infixr.com/blog.html",
  ogTitle: "Blog | InfiXR",
  ogDescription:
    "Field notes on building, shipping, and measuring industrial VR experiences.",
  twitterTitle: "InfiXR Blog",
  twitterDescription:
    "Field notes on building, shipping, and measuring industrial VR experiences.",
  nav: "blog",
} as const;
