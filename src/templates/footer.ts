/**
 * templates/footer.ts — shared site footer.
 *
 * Unifies three drifted footers: index used #top/#about anchors + a JS-stamped
 * <span id="year">; about/blog used index.html/about.html links + a hardcoded
 * "2026". Now ONE template: `isHome` switches anchor vs cross-page links, and a
 * single <span id="year"> means the sanctioned year-stamp JS (form.js) updates the
 * year on EVERY page — previously only index could be stamped. Footer "Our
 * Applications" is canonicalised to "Our Solutions" to match the nav.
 */
import { html } from "./html.ts";
import { brandLogo } from "./nav.ts";

const linkedInIcon = html`<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.04h4.56V24H.22V8.04zM7.86 8.04h4.37v2.18h.06c.61-1.15 2.11-2.36 4.34-2.36 4.64 0 5.5 3.06 5.5 7.03V24h-4.56v-7.34c0-1.75-.03-4-2.44-4-2.44 0-2.81 1.9-2.81 3.87V24H7.86V8.04z"/></svg>`;
const instagramIcon = html`<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>`;

/**
 * Render the shared <footer>.
 * @param isHome true on index.html → Quick Links use bare anchors (#top, #about…)
 * @param base path prefix to site root for nested pages ("" at root, "../" for
 *   post pages) — same portability contract as renderNav.
 */
export const renderFooter = (isHome: boolean, base = ""): string => {
  const home = isHome ? "#top" : `${base}index.html`;
  const about = isHome ? "#about" : `${base}about.html`;
  const sec = (anchor: string) => (isHome ? anchor : `${base}index.html${anchor}`);

  return html`<footer class="site-footer">
  <div class="site-footer__grid">
    <div>
      ${brandLogo("site-footer__logo")}
    </div>
    <div>
      <h3 class="footer-h">Email</h3>
      <p><a href="mailto:contact@infixr.com">contact@infixr.com</a></p>
    </div>
    <div>
      <h3 class="footer-h">Quick Links</h3>
      <ul class="footer-links">
        <li><a href="${home}">Home</a></li>
        <li><a href="${about}">About Us</a></li>
        <li><a href="${sec("#solutions")}">Our Solutions</a></li>
        <li><a href="${sec("#contact")}">Contact</a></li>
      </ul>
    </div>
    <div>
      <h3 class="footer-h">Social</h3>
      <ul class="social-links" aria-label="Social media">
        <li><a href="https://www.linkedin.com/" aria-label="LinkedIn" rel="noopener">
          ${linkedInIcon}
        </a></li>
        <li><a href="https://www.instagram.com/" aria-label="Instagram" rel="noopener">
          ${instagramIcon}
        </a></li>
      </ul>
    </div>
    <div>
      <h3 class="footer-h">Location</h3>
      <address>InfiXR, Block 2B, Regent Paradise, Bhetapara, Ghy 781028</address>
    </div>
  </div>
  <p class="site-footer__copy">Copyright &copy; <span id="year">2026</span> &nbsp;|&nbsp; Powered by InfiXR</p>
</footer>`;
};
