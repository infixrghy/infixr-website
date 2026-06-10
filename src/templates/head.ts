/**
 * templates/head.ts — the shared <head>. Biggest duplication killed: ~25 lines of
 * meta repeated-with-variation across three pages. Consumes a Schema-validated
 * PageMeta, so a malformed page config fails the build, not the browser.
 *
 * Option<string> is where "no null, ultra type safety" actually pays: ogImageAlt
 * and ogLocale exist only on index today. They're Options, so this template MUST
 * handle the absent case via Option.match — it cannot silently emit `content=""`
 * or `undefined`. Present → the <meta> line is emitted; None → nothing.
 *
 * The favicon + manifest + charset/viewport block is invariant across pages, so it
 * lives here literally rather than in the schema.
 *
 * HEAD IS RENDERED FINISHED (V47): renderHead takes `preloads` + `inlineCss` as
 * params and emits the COMPLETE head — the <style> block and any <link rel=preload>
 * lines come out in their final position. There is no post-assembly regex mutation
 * of the built HTML (no marker-replace, no link-strip, no head-splice): that layer
 * failed silently (a pattern that stopped matching shipped degraded output green,
 * the class of scar B8 hid in). The old <!--CSS_INLINE--> marker pair + build.ts's
 * inlineAndPreload regexes are gone; CSS + preloads are data flowing in, not text
 * spliced after the fact.
 */
import { Option } from "effect";
import { html } from "./html.ts";
import type { PageMeta } from "../schema/page.ts";

/** Emit a single optional <meta property> line, or "" when the Option is None. */
const optMeta = (property: string, value: Option.Option<string>): string =>
  Option.match(value, {
    onNone: () => "",
    onSome: (v) => html`\n  <meta property="${property}" content="${v}">`,
  });

/**
 * Render the complete <head> for a page from its validated metadata.
 * @param base path prefix to site root for nested pages ("" at root, "../" for
 *   post pages). Prefixes the root-relative favicon + manifest links so they
 *   resolve from blog/<slug>.html. canonical/og:url carry full URLs (from meta);
 *   og:image/twitter:image are absolute — none of those take `base`.
 * @param preloads pre-formatted <link rel=preload> lines to inject just inside
 *   <head> (each already `\n  `-indented), or "" for none. Built by build.ts so
 *   the asset hints land at the top of the head; this template just places them.
 * @param inlineCss the complete inner text of the page's <style> block (@font-face
 *   + concatenated CSS), assembled by build.ts. Emitted verbatim inside <style>.
 */
export const renderHead = (
  m: PageMeta,
  base = "",
  preloads = "",
  inlineCss = ""
): string => html`<head>${preloads}
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#232323">
  <title>${m.title}</title>
  <meta name="description" content="${m.description}">
  <link rel="canonical" href="${m.canonical}">

  <!-- Favicons -->
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="${base}assets/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="${base}assets/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="${base}manifest.webmanifest">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${m.ogUrl}">
  <meta property="og:site_name" content="InfiXR">
  <meta property="og:title" content="${m.ogTitle}">
  <meta property="og:description" content="${m.ogDescription}">
  <meta property="og:image" content="https://infixr.com/assets/og-image.png">${optMeta(
    "og:image:alt",
    m.ogImageAlt
  )}
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">${optMeta("og:locale", m.ogLocale)}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${m.twitterTitle}">
  <meta name="twitter:description" content="${m.twitterDescription}">
  <meta name="twitter:image" content="https://infixr.com/assets/og-image.png">

<style>${inlineCss}</style>
</head>`;
