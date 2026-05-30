/**
 * templates/html.ts — tiny tagged-template helper. This IS the "templating engine":
 * a typed `Data -> string` substrate, no DSL, no runtime cost beyond string concat.
 *
 * Discipline:
 *   - Static markup I author inside html`...` is TRUSTED and passes through raw.
 *   - Interpolated arrays are flattened + joined (so `.map(renderCard)` drops in clean).
 *   - Untrusted DATA (blog titles, excerpts from .md front-matter) must be wrapped in
 *     esc() at the interpolation site. esc() is explicit, not automatic, because most
 *     interpolations here are trusted sub-templates — auto-escaping would double-encode
 *     the entities the source HTML already uses (&copy;, &mdash;, &rarr;).
 *
 * The lit-html VS Code grammar highlights html`...` as HTML for free.
 */

/** HTML-escape a raw text value. Wrap any untrusted data value with this. */
export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;"
    : c === "<" ? "&lt;"
    : c === ">" ? "&gt;"
    : c === '"' ? "&quot;"
    : "&#39;"
  );

/** Interpolatable value: a string, or an array of them (flattened + concatenated). */
export type Html = string | ReadonlyArray<string>;

/**
 * Tagged template that concatenates parts. Arrays are joined with "" so list
 * renders (`${posts.map(renderPost)}`) need no manual .join(). Values are inserted
 * verbatim — escape data with esc() at the call site.
 */
export const html = (strings: TemplateStringsArray, ...values: Html[]): string => {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    out += (Array.isArray(v) ? v.join("") : (v as string)) + strings[i + 1];
  }
  return out;
};
