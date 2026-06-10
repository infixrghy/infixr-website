/**
 * components/brand/brand.ts — the InfiXR wordmark SVG, rendered once.
 *
 * Shared by the header (components/nav) and the footer (components/footer). It
 * lived inside nav.ts, which made footer.ts reach into a SIBLING component for
 * an atom both consume — the page→page misfiling pattern at component scale;
 * now each consumer points at the atom's own folder. TS-only component folder:
 * the logo is styled by its consumers' CSS (.brand__logo in nav.css,
 * .site-footer__logo in footer.css), so there is no brand.css and no
 * COMPONENT_CSS entry.
 *
 * `extraClass` doubles as the a11y switch: the bare header logo sits inside an
 * <a aria-label="InfiXR home"> so the svg is decorative (aria-hidden); the
 * footer's standalone instance (site-footer__logo) carries its own aria-label.
 */
import { html } from "../../templates/html.ts";

export const brandLogo = (extraClass = ""): string => html`<svg class="brand__logo${
  extraClass ? " " + extraClass : ""
}" viewBox="0 0 120 36" role="img" ${extraClass ? 'aria-label="InfiXR"' : 'aria-hidden="true"'}>
      <text x="0" y="28" font-family="Satoshi, system-ui, sans-serif" font-weight="800" letter-spacing="-0.04em">
        <tspan font-size="24" fill="currentColor">infi</tspan><tspan font-size="32" fill="currentColor" dy="2">XR</tspan>
      </text>
    </svg>`;
