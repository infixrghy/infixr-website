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
      ${navItem("solutions", active, sec("#solutions"), "Our Solutions")}
      ${navItem("about", active, `${base}about.html`, "Who We Are")}
      ${navItem("products", active, sec("#products"), "Products")}
      ${navItem("blog", active, `${base}blog.html`, "Blogs")}
      <li>${button({
    label: "Contact Us",
    variant: "glass",
    action: { _tag: "link", href: sec("#contact") },
  })}</li>
    </ul>
  </nav>
</header>`;
};
