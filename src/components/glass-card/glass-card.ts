/**
 * components/glass-card/glass-card.ts — the frosted glass-card component, rendered once.
 *
 * The approved V3 glass (sheen sweep + lit teal rim + tinted surface) lives as the
 * .glass-card CSS class (components/glass-card/glass-card.css) and can be dropped onto ANY card. This
 * component is the typed AUTHORING path for the text-card shapes that carry it: the
 * blog/article cards (eyebrow + linked title + <time> meta) AND the Solutions cards
 * (plain title + CTA link, no eyebrow). One signature serves both — the shape
 * differences are modelled as Option/Union in schema/glass-card.ts so the build
 * rejects nonsense (a bad variant, an out-of-range tint, a malformed footer).
 *
 * Scope: the four text cards. The overlay PHOTO cards (.blog-feature,
 * .solution-feature) are a different shape (image-fill + scrim) and stay bespoke.
 *
 * Idiom matches picture.ts: a typed `params → string` fn, content esc()'d at the
 * boundary. Full spec: design/GLASS-CARD.md.
 */
import { Option } from "effect";
import { html, esc } from "../../templates/html.ts";
import { displayDate } from "../../blog.ts";
import {
  decodeGlassCard,
  type GlassCardParams,
  type GlassFooter,
} from "../../schema/glass-card.ts";

/** Build the inline `style` for any supplied per-instance dial overrides. Returns
 *  "" when none are set (the variant preset / V3 default then drives the look). */
const overrideStyle = (p: GlassCardParams): string => {
  const decls: string[] = [];
  Option.map(p.tint, (v) => decls.push(`--gc-tint:${v}`));
  Option.map(p.alpha, (v) => decls.push(`--gc-alpha:${v}`));
  Option.map(p.rim, (v) => decls.push(`--gc-rim:${esc(v)}`));
  return decls.length ? ` style="${decls.join(";")}"` : "";
};

/** The footer slot. Exhaustive over GlassFooter's tags — a new variant added to
 *  the schema without a case here is a COMPILE error (the never-assignment), not a
 *  silently empty footer. */
const renderFooter = (f: GlassFooter): string => {
  switch (f._tag) {
    case "meta":
      return html`<p class="post__meta"><time datetime="${
        f.date
      }">${displayDate(f.date)}</time> &middot; ${String(
        f.readMinutes
      )} min read</p>`;
    case "cta":
      return html`<a class="link-arrow" href="${esc(f.href)}">${esc(
        f.label
      )} &rarr;</a>`;
    default: {
      const _exhaustive: never = f;
      return _exhaustive;
    }
  }
};

/**
 * Render a glass card from RAW (unvalidated) params. Decodes via the schema first
 * — call sites pass plain objects; malformed input throws at build. Public entry.
 */
export const glassCard = (raw: unknown): string =>
  renderGlassCard(decodeGlassCard(raw));

/**
 * Render from already-decoded params (skip re-validation when the caller decoded
 * upstream). `glassCard` is the usual entry; this is exposed for hot paths/tests.
 */
export const renderGlassCard = (p: GlassCardParams): string => {
  const extra = Option.match(p.extraClass, {
    onNone: () => "",
    onSome: (c) => ` ${esc(c)}`,
  });
  const style = overrideStyle(p);

  // Eyebrow kicker — only when supplied (blog yes, Solutions no).
  const eyebrow = Option.match(p.eyebrow, {
    onNone: () => "",
    onSome: (e) => html`<p class="eyebrow">${esc(e)}</p>\n          `,
  });

  // Title — linked (<h3><a>) when href is Some, plain <h3> otherwise.
  const title = Option.match(p.href, {
    onNone: () => html`<h3>${esc(p.title)}</h3>`,
    onSome: (h) => html`<h3><a href="${esc(h)}">${esc(p.title)}</a></h3>`,
  });

  // Footer — time-meta, CTA, or nothing (the GlassFooter union; see renderFooter).
  const footer = Option.match(p.footer, {
    onNone: () => "",
    onSome: (f) => html`\n          ${renderFooter(f)}`,
  });

  return html`<li class="u-card u-card--text glass-card glass-card--${
    p.variant
  }${extra}"${style}>
        <div class="u-card__body">
          ${eyebrow}${title}
          <p>${esc(p.body)}</p>${footer}
        </div>
      </li>`;
};
