/**
 * templates/picture.ts — the responsive <picture> idiom, rendered once.
 *
 * Every site image ships as a webp <source> over a png <img> fallback with
 * explicit width/height (to reserve layout box → no CLS) and decoding="async".
 * That block was hand-copied ~5× across the homepage (hero headset, the 3
 * byte-identical who-carousel cards, the solution-feature photo). A copied
 * srcset path or a mismatched width/height fails silently — the image just
 * loads wrong or shifts layout, nothing errors. One typed render fn removes
 * that whole class of typo.
 *
 * Matches the html.ts substrate: a typed `Data → string` fn, no DSL. alt text
 * is the only untrusted-shaped field, but every call site here passes an
 * author-controlled literal, so esc() is applied defensively at the boundary
 * anyway (cheap, and keeps the helper safe if a value ever comes from data).
 */
import { html, esc } from "./html.ts";

export interface PictureOpts {
  /** webp source path (the preferred format). */
  readonly webp: string;
  /** png/jpg fallback path → the <img> src. */
  readonly png: string;
  /** alt text. "" for decorative images (hero headset is aria-hidden/ornamental). */
  readonly alt: string;
  /** intrinsic width in px — reserves the layout box (CLS guard). */
  readonly width: number;
  /** intrinsic height in px. */
  readonly height: number;
  /** "eager" for above-the-fold (hero), "lazy" for everything below it. */
  readonly loading: "eager" | "lazy";
  /** "high" for the LCP hero image; omitted otherwise. */
  readonly fetchpriority?: "high" | "low" | "auto";
  /** class on the <picture> element (e.g. "hero__headset"). */
  readonly className?: string;
  /** webp <source> type. Defaults to image/webp; expose for future formats. */
  readonly type?: string;
}

/**
 * Render a <picture> with a single webp <source> + png <img> fallback.
 * Attribute order mirrors the prior hand-written markup so build output stays
 * byte-stable: src, alt, width, height, [fetchpriority], loading, decoding.
 */
export const picture = (o: PictureOpts): string => {
  const cls = o.className ? ` class="${o.className}"` : "";
  const type = o.type ?? "image/webp";
  const fp = o.fetchpriority ? ` fetchpriority="${o.fetchpriority}"` : "";
  return html`<picture${cls}>
              <source type="${type}" srcset="${o.webp}">
              <img src="${o.png}" alt="${esc(o.alt)}" width="${String(
    o.width
  )}" height="${String(o.height)}"${fp} loading="${o.loading}" decoding="async">
            </picture>`;
};
