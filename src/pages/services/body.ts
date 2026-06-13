/**
 * pages/services/body.ts — the Services page <main>, as a typed render fn
 * `renderServicesBody() → string`.
 *
 * Built from design/services.pdf (the page was an image-only PDF; copy was read
 * off a rendered screenshot). Takes no data — static product copy, like
 * pages/about/body.ts. Page meta lives beside it in pages/services/meta.ts.
 *
 * Layout follows the about-idiom (page-hero → section intro → blocks → cta-band),
 * NOT the mock's alternating photo rows: the four products have NO per-product
 * imagery in src/assets (only the headset render + already-used sol-/who- photos),
 * and this codebase has an explicit rule against faking imagery by reusing the few
 * renders it has (see pages/index/body.ts:36 — the homepage #services teaser is
 * glass-card-only for exactly this reason). So each service is a frosted
 * .glass-card BLOCK (the V3 frost dropped straight onto a bespoke <article> — the
 * glassCard() component only models the small eyebrow+title+body+footer text card,
 * which can't hold the two-column Features/Benefits this page needs).
 *
 * Two copy-paste errors in the source mock are corrected here, NOT reproduced:
 *   1. InfiExplore's Key Features listed "Safety and emergency response training"
 *      — lifted from InfiTrain, nonsensical for a museum/tourism AR product. It's
 *      OMITTED (not replaced — inventing a feature claim for a real product would
 *      be authoring an unverified claim). InfiExplore keeps its other 5 real
 *      features; the source's 6th slot was that paste error, so 5 is correct.
 *   2. The mock's CTA sub-copy was InfiTrain's description pasted under "Need
 *      something custom?" — replaced with site cta-band chrome copy (the same line
 *      the About page uses), since that slot is page chrome, not a product claim.
 * Every product summary / feature / benefit below is transcribed verbatim from the
 * PDF (the PDF was image-only + OCR crashed, so copy was read off a rendered
 * screenshot — proofread against the source before this ships).
 * The "Request a Demo" CTA on each block (and the cta-band) deep-links to the one
 * site-wide contact form (index.html#contact) rather than duplicating the
 * Web3Forms form + handler here — same single-form rule the about page follows.
 */
import { html, esc } from "../../templates/html.ts";
import { button } from "../../components/button/button.ts";

/** One product offering. `features`/`benefits` are the two bullet columns. */
type Service = {
  name: string;
  /** The short positioning line under the product name. */
  summary: string;
  /** The "What It Does" paragraph. */
  whatItDoes: string;
  features: ReadonlyArray<string>;
  benefits: ReadonlyArray<string>;
};

const SERVICES: ReadonlyArray<Service> = [
  {
    name: "InfiLearn",
    summary:
      "Custom browser-based XR learning experiences for schools, polytechnics, ITIs, and skill development institutes.",
    whatItDoes:
      "Deliver interactive 3D learning simulations aligned with your curriculum—accessible directly through a web browser, with no headset required.",
    features: [
      "Curriculum-aligned 3D simulations",
      "Works on laptops, tablets, and smartphones",
      "Optional VR headset compatibility",
      "Teacher &amp; admin dashboards",
      "Assessment and reporting tools",
      "NCERT, NSDC &amp; NELIT aligned",
    ],
    benefits: [
      "Expands access to practical learning",
      "Supports experiential education",
      "Low deployment cost",
      "Works on existing devices",
    ],
  },
  {
    name: "InfiTrain",
    summary:
      "Custom VR simulations for safety, operational, and skill-based training in manufacturing, construction, energy, utilities, and industrial environments.",
    whatItDoes:
      "Train teams in realistic virtual environments using simulations built around your equipment, workflows, and safety procedures—without disrupting operations or exposing workers to risk.",
    features: [
      "Custom equipment &amp; workplace simulations",
      "Safety and emergency response training",
      "Real-time feedback &amp; performance tracking",
      "Multi-user collaborative training",
      "Analytics dashboard for supervisors",
      "Meta Quest &amp; PC VR compatible",
    ],
    benefits: [
      "Reduce training risks and incidents",
      "Accelerate workforce readiness",
      "Train at scale with consistent outcomes",
      "Improve safety compliance and retention",
      "Support multilingual training delivery",
    ],
  },
  {
    name: "InfiSoft",
    summary:
      "Immersive AI and XR-based training experiences that help organizations develop communication, leadership, sales, customer service, and interpersonal skills through realistic roleplay simulations.",
    whatItDoes:
      "Enable employees to practice high-stakes workplace interactions with AI-powered virtual characters in a safe, repeatable, and measurable environment.",
    features: [
      "AI-powered virtual roleplay scenarios",
      "Communication &amp; leadership training",
      "Sales, negotiation &amp; customer interaction simulations",
      "Real-time feedback and sentiment analysis",
      "AI-driven performance assessment",
      "LMS &amp; HR system integration",
    ],
    benefits: [
      "Consistent and scalable workforce training",
      "Objective performance measurement",
      "Safe environment for practice and improvement",
      "Faster skill development and readiness",
    ],
  },
  {
    name: "InfiExplore",
    summary:
      "Immersive AR, MR, and AI-powered experiences that transform museums, heritage sites, and tourism destinations into engaging, interactive journeys.",
    whatItDoes:
      "Bring stories, artifacts, and cultural heritage to life through augmented reality, immersive storytelling, and interactive visitor experiences.",
    features: [
      "AR-enhanced exhibits and heritage storytelling",
      "Interactive museum and site walkthroughs",
      "Multi-language audio and visual guides",
      "Gamified visitor engagement experiences",
      "Cloud-based content management system",
    ],
    benefits: [
      "Increase visitor engagement and dwell time",
      "Enhance learning and cultural storytelling",
      "Create memorable, shareable experiences",
      "Easily update exhibits without physical changes",
      "Extend cultural experiences beyond traditional displays",
    ],
  },
];

/** A two-column bullet list (Key Features / Benefits) for one service block. */
const bulletColumn = (heading: string, items: ReadonlyArray<string>): string =>
  html`<div class="service-block__col">
            <h4 class="service-block__col-title">${heading}</h4>
            <ul class="service-block__list" role="list">
              ${items.map((i) => `<li>${i}</li>`).join("\n              ")}
            </ul>
          </div>`;

/**
 * One frosted service block. The V3 glass class is dropped directly onto a bespoke
 * <article> (the glassCard() component can't model this richer body). id = the
 * lowercased product name so the homepage #services CTAs could deep-link here
 * later (e.g. services.html#infitrain).
 */
const renderServiceBlock = (s: Service): string => {
  const id = s.name.toLowerCase();
  return html`<article id="${id}" class="u-card glass-card glass-card--v3 service-block" aria-labelledby="${id}-title">
        <div class="u-card__body service-block__body">
          <h3 id="${id}-title" class="service-block__name">${s.name}</h3>
          <p class="service-block__summary">${s.summary}</p>

          <h4 class="service-block__subhead">How It Works</h4>
          <p class="service-block__what">${s.whatItDoes}</p>

          <div class="service-block__cols">
            ${bulletColumn("What You Get", s.features)}
            ${bulletColumn("Why It Matters", s.benefits)}
          </div>

          ${button({
    label: "Request a Demo",
    variant: "glass",
    action: { _tag: "link", href: `index.html#contact` },
  })}
        </div>
      </article>`;
};

/** Render the full Services <main>. Static — no data dependency (like About). */
export const renderServicesBody = (): string =>
  html`<main>

  <section class="page-hero services-hero" aria-labelledby="page-title">
    <p class="eyebrow">Services</p>
    <h1 id="page-title" class="page-title">Custom <span class="services-hero__accent">XR &amp; AI Solutions</span> Across Industries</h1>
    <p class="page-lead">InfiXR develops custom Virtual Reality, Augmented Reality, and AI-powered experiential solutions for industrial, corporate, academic, and cultural sector clients&mdash;with a first-mover position across Northeast India and a clear roadmap for pan-India scale.</p>
  </section>

  <section class="service-suite" aria-labelledby="suite-title">
    <header class="service-suite__head">
      <h2 id="suite-title">Explore Our Services</h2>
      <p>Explore our suite of AI-powered XR platforms crafted to deliver immersive, intelligent, and measurable outcomes.</p>
    </header>

    <div class="service-suite__list">
      ${SERVICES.map(renderServiceBlock).join("\n\n      ")}
    </div>
  </section>

  <section class="cta-band" aria-labelledby="cta-title">
    <h2 id="cta-title">Need something custom?</h2>
    <p>Tell us the problem worth solving in XR. We'll send back a short read on whether it's the right fit and what shipping it would look like.</p>
    ${button({
    label: "Start a conversation",
    variant: "glass",
    action: { _tag: "link", href: "index.html#contact" },
  })}
  </section>

</main>`;
