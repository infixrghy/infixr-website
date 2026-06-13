/**
 * pages/about/body.ts — the About page <main>, as a typed render fn
 * `renderAboutBody() → string`.
 *
 * Was src/pages/about.body.html (a hand-authored static partial read raw in
 * build.ts) → src/about.ts → here (the per-page folder, paired with meta.ts).
 * Promoted from the static partial to a render fn for ONE reason: its CTA button
 * now goes through the typed button() component (components/button/button.ts) like
 * every other button on the site — a static .html file can't call a TS function, so
 * the page had to become a render fn. The prose is otherwise byte-for-byte the old
 * partial; only the trailing CTA <a> is now button({variant:"glass", …}).
 *
 * Takes no data (unlike index/blog which take posts) — the About body is static
 * copy. Page meta lives beside it in pages/about/meta.ts (aboutMeta); this is body
 * only.
 */
import { html } from "../../templates/html.ts";
import { button } from "../../components/button/button.ts";

export const renderAboutBody = (): string =>
  html`<main>

  <section class="page-hero" aria-labelledby="page-title">
    <p class="eyebrow">About InfiXR</p>
    <h1 id="page-title" class="page-title">We build immersive experiences that change how teams train and decide.</h1>
    <p class="page-lead">We're a team of engineers, designers, and domain specialists building XR tooling that holds up under real-world conditions&mdash;not just demo floors.</p>
  </section>

  <section class="prose" aria-labelledby="story-title">
    <h2 id="story-title">Our story</h2>
    <p>InfiXR started with a simple frustration: VR demos looked great in showrooms but rarely moved the needle on the metrics that matter&mdash;reduced incident rates, faster onboarding, measurable behavior change. We set out to close that gap.</p>
    <p>Today we partner with industrial operators, corporate L&amp;D teams, and architectural firms to deliver experiences that are practical, accessible, and measurable&mdash;built around real equipment, real workflows, and the outcomes each team is held to.</p>

    <h2>What we believe</h2>
    <ul class="value-grid">
      <li class="u-card u-card--text glass-card glass-card--v3">
        <div class="u-card__body">
          <h3>Practical over flashy</h3>
          <p>Every project is judged on outcomes&mdash;not visual fidelity, not headset count, not feature lists.</p>
        </div>
      </li>
      <li class="u-card u-card--text glass-card glass-card--v3">
        <div class="u-card__body">
          <h3>Accessibility first</h3>
          <p>Our experiences run across VR, web, and mobile so teams can deploy without re-buying hardware.</p>
        </div>
      </li>
      <li class="u-card u-card--text glass-card glass-card--v3">
        <div class="u-card__body">
          <h3>Built to last</h3>
          <p>Production-grade tooling, version-controlled content, and clear handoff so your team owns what we ship.</p>
        </div>
      </li>
      <li class="u-card u-card--text glass-card glass-card--v3">
        <div class="u-card__body">
          <h3>Measure what matters</h3>
          <p>Telemetry baked into every experience. You get the data you need to defend the investment.</p>
        </div>
      </li>
    </ul>

    <h2>How we work</h2>
    <p>We start with the problem worth solving, not the technology. Before a single asset is modelled we map the procedure, the people who run it, and the metric the program is meant to move&mdash;so the experience is built backwards from the outcome rather than forwards from a demo.</p>
    <p>From there it's a tight build-measure loop: a focused pilot proves the idea, telemetry tells us what's landing, and we design the rollout alongside the pilot so scaling is a gear change, not a restart. You finish owning version-controlled content and a clear handoff&mdash;not a dependency on us.</p>
  </section>

  <section class="cta-band" aria-labelledby="cta-title">
    <h2 id="cta-title">Have a problem worth solving in VR?</h2>
    <p>Tell us what you're building. We'll send back a short read on whether it's the right fit and what shipping it would look like.</p>
    ${button({
    label: "Start a conversation",
    variant: "glass",
    action: { _tag: "link", href: "index.html#contact" },
  })}
  </section>

</main>`;
