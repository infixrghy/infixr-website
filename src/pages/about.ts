/**
 * pages/about.ts — page-meta config for About (about.html).
 *
 * Subset of the head: no og:image:alt, no og:locale (those stay undefined →
 * decoded to Option None → head template emits nothing for them). Body markup
 * lives in pages/about.body.html.
 */
export const aboutMeta = {
  title: "About Us | InfiXR",
  description:
    "InfiXR designs and builds immersive VR experiences for real-world operational, training, and performance challenges.",
  canonical: "https://infixr.com/about.html",
  ogUrl: "https://infixr.com/about.html",
  ogTitle: "About InfiXR",
  ogDescription:
    "We build immersive experiences that change how teams train and decide.",
  twitterTitle: "About InfiXR",
  twitterDescription:
    "We build immersive experiences that change how teams train and decide.",
  nav: "about",
} as const;
