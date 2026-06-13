/**
 * pages/services/meta.ts — page-meta config for Services (services.html).
 *
 * Same subset shape as about/blog (no og:image:alt, og:locale → Option None →
 * head emits nothing). Body markup lives beside it in pages/services/body.ts
 * (renderServicesBody). nav:"services" marks the nav item active — "services" is
 * already a NavId literal (schema/page.ts), so no schema change was needed to add
 * this page. Canonical/OG point at the infixr.com apex (matches the CNAME the
 * build emits + the other pages' hardcoded absolute URLs).
 */
export const servicesMeta = {
  title: "Our Services | InfiXR",
  description:
    "Custom XR & AI solutions across industries — InfiLearn, InfiTrain, InfiSoft, and InfiExplore. Browser-based learning, VR safety training, AI roleplay, and AR heritage experiences.",
  canonical: "https://infixr.com/services.html",
  ogUrl: "https://infixr.com/services.html",
  ogTitle: "Custom XR & AI Solutions Across Industries",
  ogDescription:
    "A family of AI-powered XR platforms crafted to deliver immersive, intelligent, and measurable outcomes.",
  twitterTitle: "InfiXR Services — Custom XR & AI Solutions",
  twitterDescription:
    "A family of AI-powered XR platforms crafted to deliver immersive, intelligent, and measurable outcomes.",
  nav: "services",
} as const;
