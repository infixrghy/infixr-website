/**
 * pages/about/meta.ts — page-meta config for About (about.html).
 *
 * Subset of the head: no og:image:alt, no og:locale (those stay undefined →
 * decoded to Option None → head template emits nothing for them). Body markup
 * lives beside it in pages/about/body.ts (renderAboutBody).
 */
export const aboutMeta = {
  title: "Who We Are | InfiXR",
  description:
    "InfiXR is a deep-tech innovation company and one of Northeast India's early immersive-technology pioneers, building AI-powered XR (VR/AR/MR) training, learning, and tourism experiences.",
  canonical: "https://infixr.com/about",
  ogUrl: "https://infixr.com/about",
  ogTitle: "Who We Are | InfiXR",
  ogDescription:
    "We help build immersive solutions across industries — deep-tech XR experiences that change how teams train, learn, and decide.",
  twitterTitle: "Who We Are | InfiXR",
  twitterDescription:
    "We help build immersive solutions across industries — deep-tech XR experiences that change how teams train, learn, and decide.",
  nav: "about",
} as const;
