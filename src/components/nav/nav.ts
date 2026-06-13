/**
 * components/nav/nav.ts — the shared site header + primary nav.
 *
 * Replaces three hand-copied <header> blocks that had drifted: index had a Home
 * link + is-active; about/blog had dropped Home entirely. Now ONE template sets
 * is-active / aria-current from `active`, so the current page is always marked and
 * Home always exists. `isHome` switches section links between bare "#solutions"
 * (on the home page) and "index.html#solutions" (cross-page from about/blog).
 */
import { html } from "../../templates/html.ts";
import { brandLogo } from "../brand/brand.ts";
import { button } from "../button/button.ts";
import type { NavId } from "../../schema/page.ts";

/** One nav <li>. Adds is-active class + aria-current when this item is the page. */
const navItem = (id: NavId, active: NavId, href: string, label: string): string => {
  const isActive = id === active;
  const cls = isActive ? ' class="is-active"' : "";
  const aria = isActive ? ' aria-current="page"' : "";
  return html`<li><a${cls} href="${href}"${aria}>${label}</a></li>`;
};

/** The four products, in services.html source order. Each deep-links to the
 *  service block's anchor (renderServiceBlock emits id=name.toLowerCase()). */
const SERVICES_MENU: ReadonlyArray<readonly [slug: string, label: string]> = [
  ["infilearn", "InfiLearn"],
  ["infitrain", "InfiTrain"],
  ["infisoft", "InfiSoft"],
  ["infiexplore", "InfiExplore"],
];

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
  const items = SERVICES_MENU.map(
    ([slug, label]) =>
      html`<li><a href="${base}services.html#${slug}">${label}</a></li>`,
  ).join("\n          ");
  return html`<li class="has-dropdown">
        <a class="nav-parent${cls}" href="${base}services.html"${aria}>Our Services</a>
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
 *   "../" for blog/<slug>.html post pages). Keeps every cross-page link relative
 *   so the site is portable between the github.io subpath and infixr.com root.
 */
export const renderNav = (active: NavId, isHome: boolean, base = ""): string => {
  // Section anchors are same-page on home, cross-page (base-prefixed) elsewhere.
  const sec = (anchor: string) => (isHome ? anchor : `${base}index.html${anchor}`);
  const brandHref = isHome ? "#top" : `${base}index.html`;
  const homeHref = isHome ? "#top" : `${base}index.html`;

  return html`<header class="site-header">
  <a class="brand" href="${brandHref}" aria-label="InfiXR home">
    ${brandLogo()}
  </a>
  <nav class="primary-nav" aria-label="Primary">
    <input type="checkbox" id="nav-toggle" class="nav-toggle" hidden>
    <label for="nav-toggle" class="nav-burger" aria-label="Open menu">
      <span></span><span></span><span></span>
    </label>
    <ul>
      ${navItem("home", active, homeHref, "Home")}
      ${servicesNavItem(active, base)}
      ${navItem("about", active, `${base}about.html`, "Who We Are")}
      ${navItem("blog", active, `${base}blog.html`, "Blog")}
      <li>${button({
    label: "Contact Us",
    variant: "glass",
    action: { _tag: "link", href: sec("#contact") },
  })}</li>
    </ul>
  </nav>
</header>`;
};
