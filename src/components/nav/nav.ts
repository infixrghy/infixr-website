/**
 * components/nav/nav.ts — the shared site header + primary nav.
 *
 * Replaces three hand-copied <header> blocks that had drifted: index had a Home
 * link + is-active; about/blog had dropped Home entirely. Now ONE template sets
 * is-active / aria-current from `active`, so the current page is always marked and
 * Home always exists. `isHome` switches section links between bare "#solutions"
 * (on the home page) and root-relative "#solutions" (cross-page from about/blog).
 */
import { html } from "../../templates/html.ts";
import { brandLogo } from "../brand/brand.ts";
import { button } from "../button/button.ts";
import { SERVICES } from "../../data/services.ts";
import type { NavId } from "../../schema/page.ts";

/** One nav <li>. Adds is-active class + aria-current when this item is the page. */
const navItem = (id: NavId, active: NavId, href: string, label: string): string => {
  const isActive = id === active;
  const cls = isActive ? ' class="is-active"' : "";
  const aria = isActive ? ' aria-current="page"' : "";
  return html`<li><a${cls} href="${href}"${aria}>${label}</a></li>`;
};

/**
 * The "Our Services" <li> — a parent link to services.html PLUS a nested dropdown
 * of the four products. Inlined (not folded into navItem) because it's the only
 * item with children; generalising navItem for one caller would cost more than it
 * saves. The disclosure is pure CSS (:hover + :focus-within on desktop, an
 * always-open indented sub-list in the mobile burger panel) — no JS, matching the
 * checkbox-hack burger already here. The parent <a> still navigates to the full
 * Services page; the children are deep-links INTO it.
 */
const servicesNavItem = (active: NavId, base: string): string => {
  const isActive = "services" === active;
  const cls = isActive ? " is-active" : "";
  const aria = isActive ? ' aria-current="page"' : "";
  const items = SERVICES.map(
    ([slug, label]) =>
      html`<li><a href="${base}services#${slug}">${label}</a></li>`,
  ).join("\n          ");
  // Chevron is a real inline SVG (not a CSS border-trick): exact stroke control,
  // round caps so it reads as intentional, and it inherits the link's currentColor
  // (so the muted→fg hover transition carries it for free). aria/focusable off —
  // pure decoration; the <ul aria-label> already carries the submenu semantics.
  const chevron = html`<svg class="nav-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>`;
  return html`<li class="has-dropdown">
        <a class="nav-parent${cls}" href="${base}services"${aria}>Our Services${chevron}</a>
        <ul class="nav-dropdown" aria-label="Our Services">
          ${items}
        </ul>
      </li>`;
};

/**
 * Render the full <header> for a page.
 * @param active which nav item is the current page
 * @param isHome true on index.html (section links are bare anchors, brand → #top)
 * @param base path prefix to the site root for nested pages ("" at root,
 *   "../" for blog/<slug> post pages). Keeps every cross-page link relative
 *   so the site is portable between the github.io subpath and infixr.com root.
 */
export const renderNav = (active: NavId, isHome: boolean, base = ""): string => {
  // Clean (extensionless) URLs: GH Pages serves `about.html` at `/about`, so links
  // carry no `.html`. The homepage is the ROOT, not `/index` — `home` resolves to
  // the site root relative to the current page: `.` at root depth, `../` one deep
  // (NOT the bare string "index", which would 404 at /index). Section anchors are
  // same-page on home, cross-page (root + #anchor) elsewhere.
  const home = `${base || "."}`;
  const sec = (anchor: string) => (isHome ? anchor : `${home}${anchor}`);
  const brandHref = isHome ? "#top" : home;
  const homeHref = isHome ? "#top" : home;

  return html`<header class="site-header">
  <a class="brand" href="${brandHref}" aria-label="InfiXR home">
    ${brandLogo()}
  </a>
  <nav class="primary-nav" aria-label="Primary">
    <input type="checkbox" id="nav-toggle" class="nav-toggle" hidden>
    <label for="nav-toggle" class="nav-burger" aria-label="Open menu">
      <span></span><span></span><span></span>
    </label>
    <!-- Click-away backdrop (pure CSS, mobile only): a full-screen label bound to
         #nav-toggle. When the menu is open it covers the page BEHIND the panel;
         tapping it unchecks the toggle so the menu closes. Sibling of the checkbox
         so the checked ~ nav-backdrop selector reaches it; placed before the ul in
         source so the panel stacks above it. aria-hidden — it's a dismiss surface,
         not nav; the burger label already toggles the same control for AT. -->
    <label for="nav-toggle" class="nav-backdrop" aria-hidden="true" hidden></label>
    <ul>
      ${navItem("home", active, homeHref, "Home")}
      ${servicesNavItem(active, base)}
      ${navItem("about", active, `${base}about`, "Who We Are")}
      ${navItem("blog", active, `${base}blog`, "Blog")}
      <li>${button({
    label: "Contact Us",
    variant: "glass",
    action: { _tag: "link", href: sec("#contact") },
  })}</li>
    </ul>
  </nav>
</header>`;
};
