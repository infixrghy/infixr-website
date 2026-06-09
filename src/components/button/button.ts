/**
 * components/button/button.ts — the button component, rendered once.
 *
 * The button SURFACES live as context-free .btn--* classes (components/button/button.css);
 * this is the typed AUTHORING path that assembles them. One signature emits every
 * button on the site: hero CTAs (glass + uppercase links), the contact form's send
 * (glass + uppercase submit), and the about CTA (primary link).
 *
 * Idiom matches glass-card.ts / picture.ts: a typed `params → string` fn, content
 * esc()'d at the boundary, optionals as Option, the link-vs-submit choice as an
 * exhaustive tagged Union (a new action tag without a case here is a COMPILE error,
 * not a silently wrong element).
 */
import { Option } from "effect";
import { html, esc } from "../../templates/html.ts";
import {
  decodeButton,
  type ButtonParams,
  type ButtonAction,
} from "../../schema/button.ts";

/** Assemble the class list: base .btn + the variant surface + optional modifiers. */
const classList = (p: ButtonParams): string => {
  const classes = ["btn", `btn--${p.variant}`];
  if (p.uppercase) classes.push("btn--upper");
  Option.map(p.minWidth, (w) => classes.push(`btn--w-${w}`));
  Option.map(p.extraClass, (c) => classes.push(esc(c)));
  return classes.join(" ");
};

/**
 * Render a button from RAW (unvalidated) params — decodes via the schema first, so
 * a bad variant / malformed action throws at build. Public entry (mirrors glassCard).
 */
export const button = (raw: unknown): string => renderButton(decodeButton(raw));

/**
 * Render from already-decoded params. The action union decides the ELEMENT:
 *   • link   → <a href> (esc'd href)
 *   • button → <button type=submit|button>
 * Exhaustive over ButtonAction — the never-assignment makes an unhandled tag a
 * compile error.
 */
export const renderButton = (p: ButtonParams): string => {
  const cls = classList(p);
  const label = esc(p.label);
  const action: ButtonAction = p.action;

  switch (action._tag) {
    case "link":
      return html`<a class="${cls}" href="${esc(action.href)}">${label}</a>`;
    case "button":
      return html`<button type="${action.kind}" class="${cls}">${label}</button>`;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
};
