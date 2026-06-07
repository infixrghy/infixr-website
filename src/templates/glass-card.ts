/**
 * templates/glass-card.ts — the frosted glass-card component, rendered once.
 *
 * The approved V3 glass (sheen sweep + lit teal rim + tinted surface) lives as the
 * .glass-card CSS class (css/components.css) and can be dropped onto ANY card. This
 * component is the typed AUTHORING path for the blog/article-shaped glass card:
 * eyebrow + linked title + body + a machine-readable <time> meta line. Params are
 * validated by schema/glass-card.ts (a bad variant or out-of-range tint fails the
 * build, not the browser — the reason typed params were chosen).
 *
 * Scope: the blog teaser text cards. The Solutions cards are a DIFFERENT shape
 * (CTA link, unlinked title, no eyebrow) — they carry the .glass-card CLASS on
 * their own bespoke markup rather than routing through here; the shared thing is
 * the surface, not the markup. Full spec: design/GLASS-CARD.md.
 *
 * Idiom matches picture.ts: a typed `params → string` fn, content esc()'d at the
 * boundary. The component OWNS the meta line — it builds <time> from date +
 * readMinutes (reusing displayDate) so the machine-readable date is never lost.
 */
import { Option } from "effect";
import { html, esc } from "./html.ts";
import { displayDate } from "../blog.ts";
import {
  decodeGlassCard,
  type GlassCardParams,
} from "../schema/glass-card.ts";

/** Build the inline `style` for any supplied per-instance dial overrides. Returns
 *  "" when none are set (the variant preset / V3 default then drives the look). */
const overrideStyle = (p: GlassCardParams): string => {
  const decls: string[] = [];
  Option.map(p.tint, (v) => decls.push(`--gc-tint:${v}`));
  Option.map(p.alpha, (v) => decls.push(`--gc-alpha:${v}`));
  Option.map(p.rim, (v) => decls.push(`--gc-rim:${esc(v)}`));
  return decls.length ? ` style="${decls.join(";")}"` : "";
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
  // The component owns the meta line: machine-readable <time> + read estimate.
  const meta = html`<p class="post__meta"><time datetime="${
    p.date
  }">${displayDate(p.date)}</time> &middot; ${String(p.readMinutes)} min read</p>`;

  return html`<li class="u-card u-card--text glass-card glass-card--${
    p.variant
  }${extra}"${style}>
        <div class="u-card__body">
          <p class="eyebrow">${esc(p.eyebrow)}</p>
          <h3><a href="${esc(p.href)}">${esc(p.title)}</a></h3>
          <p>${esc(p.body)}</p>
          ${meta}
        </div>
      </li>`;
};
