/**
 * pages/index/meta.ts — page-meta config for the home page (index.html).
 *
 * This is the full <head> superset: og:image:alt + og:locale are present here
 * (Option Some) and absent on about/blog (Option None). Raw object, decoded by
 * build.ts through PageMeta — so a typo here (e.g. empty title) fails the build.
 * Body markup lives beside it in pages/index/body.ts (renderHomeBody).
 */
export const indexMeta = {
  title: "Industrial VR Development & Corporate Solutions | InfiXR",
  description:
    "End-to-end VR training solutions for safer & faster learning. We design and develop VR solutions that go beyond visuals.",
  canonical: "https://infixr.com/",
  ogUrl: "https://infixr.com/",
  ogTitle: "Industrial VR Development & Corporate Solutions | InfiXR",
  ogDescription:
    "End-to-end VR training solutions for safer & faster learning. Built around your needs.",
  twitterTitle: "InfiXR — VR Solutions, Built Around Your Needs.",
  twitterDescription:
    "End-to-end VR training solutions for safer & faster learning.",
  nav: "home",
  ogImageAlt: "InfiXR — VR Solutions, Built Around Your Needs.",
  ogLocale: "en_US",
} as const;
