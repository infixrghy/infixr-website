/**
 * data/services.ts — THE product list, shared across chrome.
 *
 * The four InfiXR products in services.html source order, each as a
 * [slug, label] pair. The slug is the deep-link anchor: renderServiceBlock
 * (pages/services/body.ts) emits id=name.toLowerCase() on every <article>, so
 * `services.html#${slug}` jumps to that product's block.
 *
 * Lives here (not in nav.ts) because BOTH the nav dropdown AND the footer Services
 * column render this list — a single source so adding/renaming a product updates
 * both at once, instead of two arrays drifting apart. Consumed by
 * components/nav/nav.ts and components/footer/footer.ts. Build-time only, 0 client
 * bytes. (Was nav.ts's local SERVICES_MENU before the footer became a 2nd consumer
 * — extracted on the second consumer, per the codebase's common-atoms idiom.)
 */
export const SERVICES: ReadonlyArray<readonly [slug: string, label: string]> = [
  ["infilearn", "InfiLearn"],
  ["infitrain", "InfiTrain"],
  ["infisoft", "InfiSoft"],
  ["infiexplore", "InfiExplore"],
];
