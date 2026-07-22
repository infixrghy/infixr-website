/**
 * pages/about/body.ts — the "Who We Are" page <main>, as a typed render fn
 * `renderAboutBody() → string`.
 *
 * Rebuilt 2026-07-13 from .tmp/who-we-are.pdf (a design export). Like the Services
 * page (pages/services/body.ts), the PDF was image-only: its text is OUTLINED
 * vectors (0-byte text layer — liteparse extracted nothing) and its OCR path
 * crashed on the 6637px-tall single page, so every string below was read off a
 * rendered, contrast-boosted screenshot and proofread against the source.
 *
 * The PDF is a full redesign of this page — six sections replacing the old
 * story/values/how-we-work prose:
 *   1. hero        — headline + intro copy, paired with a real team-in-VR photo
 *   2. core-purpose— "Creating meaningful experiences…" + 4 value cards
 *   3. how-we-work — sticky-left title + 4 process steps (Understand→Deliver)
 *   4. founder     — Sarwar Islam's bio + a pull-quote
 *   5. team        — the five people, as headshot cards
 *   6. cta-band    — "Need something custom?" deep-linking the one contact form
 *
 * FOUR faithful-to-INTENT (not to-pixels) departures from the mock, each a house
 * rule already established by the Services page:
 *   • HEADSHOTS: real, client-supplied photos now ship. The founder portrait
 *     (founder-sarwar, added 2026-07-13) and five team headshots (team-hemanth/
 *     -prajwal/-rishab/-sujeet/-prerana — 640² square centre-crops in src/assets)
 *     are wired via picture(); every member carries a real photo. The house rule
 *     against FAKING imagery (reusing unrelated renders as stand-ins) still holds —
 *     the PDF's stock face comps stay ignored.
 *   • The hero PHOTO uses who-1.webp — a genuine team-in-VR-headsets shot that
 *     already ships for THIS page (not a reused unrelated render), so it's honest.
 *   • The 4 core-purpose cards render FULLY LEGIBLE AT REST. In the mock three of
 *     them are light-grey-on-light-grey — that's a hover-state snapshot of a static
 *     comp, not a resting spec (they had to be contrast-boosted just to read). The
 *     dark "active" look is delivered as the site-standard .u-card :hover (rim +
 *     title-neon), so nothing is a WCAG failure at rest — critical on mobile, which
 *     has no hover.
 *   • NO inline First-name/Email form in the CTA. The site has ONE Web3Forms form
 *     (homepage #contact); every other page deep-links it as `.#contact` rather
 *     than duplicating the handler. The mock's CTA sub-copy was InfiTrain's product
 *     description pasted in (the same paste artefact corrected on the Services CTA);
 *     replaced here with the actual "Need something custom?" chrome copy the mock's
 *     heading promises.
 *
 * The nav in the mock ("OUR SOLUTIONS", "SERVICES", "BLOGS") is just mock chrome —
 * the shared nav (components/nav/nav.ts) is authoritative and untouched.
 *
 * Takes no data (static copy), like About-before and Services. Page meta sits
 * beside it in pages/about/meta.ts (aboutMeta); this is body only.
 */
import { html, esc } from "../../templates/html.ts";
import { button } from "../../components/button/button.ts";
import { picture } from "../../templates/picture.ts";
import { glassCard } from "../../components/glass-card/glass-card.ts";

/** A core-purpose value card: a plain title + body glass card (no eyebrow/footer).
 *  Rendered via glassCard() — the same typed authoring path the Solutions cards use. */
type Value = { title: string; body: string };

const VALUES: ReadonlyArray<Value> = [
  {
    title: "Innovate Faster",
    body:
      "Prototype, visualize, and test ideas rapidly using immersive technologies that accelerate decision-making and development.",
  },
  {
    title: "Train Safer",
    body:
      "Enable hands-on practice in risk-free virtual environments, reducing costs while improving confidence and preparedness.",
  },
  {
    title: "Educate Better",
    body:
      "Transform passive learning into immersive experiences that improve engagement, retention, and real-world understanding.",
  },
  {
    title: "Engage Deeper",
    body:
      "Create meaningful interactions that help users explore, understand, and connect with information in entirely new ways.",
  },
];

/** One step in the "How We Work" process rail. */
type Step = { name: string; body: string };

const STEPS: ReadonlyArray<Step> = [
  {
    name: "Understand",
    body:
      "We begin by understanding your goals, challenges, and audience to identify where immersive technology can create the greatest value.",
  },
  {
    name: "Design",
    body:
      "Our team transforms ideas into engaging concepts, experiences, and interactions tailored to your specific requirements.",
  },
  {
    name: "Develop",
    body:
      "Using VR, AR, AI, and interactive technologies, we build custom solutions designed for performance, usability, and scalability.",
  },
  {
    name: "Deliver & Support",
    body:
      "We deploy, refine, and continuously support our solutions to ensure they achieve meaningful real-world outcomes.",
  },
];

/** A team member. `role` is the accent line, `experience` the muted one below it,
 *  `focus` the one-line description. `photo` is a src/assets stem (a webp+jpg pair,
 *  640² square) — every member carries a real client-supplied headshot. No
 *  `linkedin` field: the mock shows LinkedIn icons but no URLs, and inventing
 *  profile links would be authoring unverified data — so the icons are omitted
 *  rather than faked. */
type Member = { name: string; role: string; experience: string; focus: string; photo: string };

const TEAM: ReadonlyArray<Member> = [
  {
    name: "Sai Hemanth",
    role: "Unity Developer",
    experience: "6+ Years Experience",
    focus: "Building immersive learning experiences and interactive simulations.",
    photo: "team-hemanth",
  },
  {
    name: "Rishab Bhattacharjee",
    role: "3D Generalist",
    experience: "3+ Years Experience",
    focus: "Creating immersive 3D environments and interactive digital experiences.",
    photo: "team-rishab",
  },
  {
    name: "Sujeet Jha",
    role: "Unity Developer",
    experience: "3+ Years Experience",
    focus: "Developing immersive VR applications and interactive simulations.",
    photo: "team-sujeet",
  },
  {
    name: "Prajwal K S",
    role: "Unity Developer",
    experience: "3+ Years Experience",
    focus: "Building engaging XR applications and real-world simulations.",
    photo: "team-prajwal",
  },
  {
    name: "Prerana Baruah",
    role: "Product Designer",
    experience: "3+ Years Experience",
    focus: "Designing intuitive XR products and immersive digital experiences.",
    photo: "team-prerana",
  },
];

/** One process step, as a frosted card in the right-hand rail. Bespoke markup (the
 *  glassCard() text card can't model the small-caps step name + body shape). */
const renderStep = (s: Step): string =>
  html`<li class="u-card glass-card glass-card--v3 step-card">
          <div class="u-card__body">
            <h3 class="step-card__name">${esc(s.name)}</h3>
            <p>${esc(s.body)}</p>
          </div>
        </li>`;

/** One team member, as a frosted text card. A square client-supplied headshot
 *  (via picture()) sits flush at the card top — mirroring the founder card — above
 *  three stacked lines (accent role, muted years, focus). */
const renderMember = (m: Member): string =>
  html`<li class="u-card u-card--text glass-card glass-card--v3 team-card">
          ${picture({
    webp: `assets/${m.photo}.webp`,
    png: `assets/${m.photo}.jpg`,
    alt: `${m.name}, ${m.role} at InfiXR.`,
    width: 640,
    height: 640,
    loading: "lazy",
    className: "team-card__photo",
  })}
          <div class="u-card__body">
            <h3 class="team-card__name">${esc(m.name)}</h3>
            <p class="team-card__role">${esc(m.role)}</p>
            <p class="team-card__exp">${esc(m.experience)}</p>
            <p class="team-card__focus">${esc(m.focus)}</p>
          </div>
        </li>`;

export const renderAboutBody = (): string =>
  html`<main>

  <section class="about-hero" aria-labelledby="page-title">
    <div class="about-hero__copy">
      <p class="eyebrow">Who We Are</p>
      <h1 id="page-title" class="about-hero__title">We Help Build <span class="about-hero__accent">Immersive Solutions</span> Across Industries</h1>
    </div>
    <div class="about-hero__lead">
      <p>At InfiXR, we are a deep-tech innovation company helping organizations transform ideas into impactful digital solutions. From concept development and product design to deployment and scale, we partner with businesses, institutions, startups, and government organizations to build technology products tailored to their unique needs.</p>
      <p>Whether you're validating a new idea, modernizing operations, building custom software, or creating immersive experiences, we combine deep-tech expertise, strategy, and innovation to turn ideas into scalable solutions that drive measurable results.</p>
      <p>As one of Northeast India's early immersive technology pioneers, we are building scalable solutions for clients across the country.</p>
    </div>
    ${picture({
    webp: "assets/who-1.webp",
    png: "assets/who-1.jpg",
    alt: "A diverse team wearing VR headsets collaborating around a meeting table.",
    width: 800,
    height: 450,
    loading: "eager",
    fetchpriority: "high",
    className: "about-hero__media",
  })}
  </section>

  <section class="core-purpose" aria-labelledby="purpose-title">
    <header class="section-head">
      <p class="eyebrow">Core Purpose</p>
      <h2 id="purpose-title">Creating Meaningful Experiences Through Immersive Technology.</h2>
      <p class="section-head__lead">InfiXR is Northeast India's first AI-powered XR (VR/AR/MR) platform, delivering customized immersive training, learning, and tourism experiences &mdash; combining 3D/XR environments with AI-driven adaptive content, simulation intelligence, and personalized learning paths.</p>
    </header>

    <ul class="value-cards" role="list">
      ${VALUES.map((v) =>
    glassCard({ title: v.title, body: v.body, variant: "v3", extraClass: "value-card" }),
  ).join("\n      ")}
    </ul>
  </section>

  <section class="how-we-work" aria-labelledby="how-title">
    <div class="how-we-work__intro">
      <p class="eyebrow">How We Work</p>
      <h2 id="how-title">Turning Vision Into Reality Through Technology</h2>
    </div>
    <ol class="how-we-work__steps" role="list">
      ${STEPS.map(renderStep).join("\n      ")}
    </ol>
  </section>

  <section class="founder" aria-labelledby="founder-title">
    <header class="section-head">
      <p class="eyebrow">Meet the Founder</p>
      <h2 id="founder-title">Leading the Future of Immersive Learning</h2>
      <p class="section-head__lead">Combining technology, creativity, and education to redefine how people learn, train, and grow.</p>
    </header>

    <div class="founder__grid">
      <div class="u-card glass-card glass-card--v3 founder__card">
        ${picture({
    webp: "assets/founder-sarwar.webp",
    png: "assets/founder-sarwar.jpg",
    alt: "Sarwar Islam, founder of InfiXR.",
    width: 680,
    height: 1061,
    loading: "lazy",
    className: "founder__photo",
  })}
        <div class="u-card__body">
          <h3 class="founder__name">Sarwar Islam</h3>
          <p class="founder__role">Founder &amp; CEO | InfiXR (OPC) Private Limited</p>
          <p class="founder__exp">16+ Years Experience</p>
        </div>
      </div>

      <div class="founder__bio">
        <p>Sarwar Islam is the Founder and CEO of InfiXR, where he combines his background in Visual Effects, 3D design, and immersive technologies to build practical XR solutions for industry, education, government, and tourism.</p>
        <p>A graduate of Vancouver Film School, Canada, Sarwar began his career in the Visual Effects industry in 2010, working with production studios in Canada and India on internationally recognized film and television projects. These experiences helped him develop a deep understanding of 3D environments, spatial design, real-time visualization, and interactive digital experiences.</p>
        <p>Over the years, he realized that the same technologies used to create cinematic worlds could also solve real-world challenges in training, education, and communication. This inspired him to establish InfiXR, with a focus on creating customized Virtual Reality (VR), Augmented Reality (AR), Mixed Reality (MR), WebXR, and AI-powered immersive solutions tailored to each client's unique needs.</p>
        <p>A significant turning point in his professional journey came while working on an immersive technology initiative with IIT Guwahati. The experience highlighted the transformative potential of XR for skill development and workforce training, reinforcing his vision to create immersive learning solutions that are practical, scalable, and capable of addressing real-world challenges across multiple industries.</p>
        <blockquote class="founder__quote">
          <span class="founder__quote-mark" aria-hidden="true">&ldquo;</span>
          <p>If we can make learning feel real, we can make it truly meaningful.</p>
        </blockquote>
      </div>
    </div>
  </section>

  <section class="team" aria-labelledby="team-title">
    <header class="section-head">
      <p class="eyebrow">Our Team</p>
      <h2 id="team-title">The People Turning Ideas Into Immersive Experiences.</h2>
      <p class="section-head__lead">We're a team of creators, developers, and innovators committed to making VR, AR, and AI technologies more accessible, practical, and impactful for organizations across industries.</p>
    </header>

    <ul class="team-grid" role="list">
      ${TEAM.map(renderMember).join("\n      ")}
    </ul>
  </section>

  <section class="cta-band" aria-labelledby="cta-title">
    <h2 id="cta-title">Need something custom?</h2>
    <p>Tell us the problem worth solving in XR. We'll send back a short read on whether it's the right fit and what shipping it would look like.</p>
    ${button({
    label: "Contact Us",
    variant: "glass",
    // The contact form lives on the homepage. `.#contact` = the root dir's
    // #contact (NOT bare "#contact", which targets THIS page). About is root-depth,
    // so `.` resolves to `/`. Keep the leading dot — don't "simplify".
    action: { _tag: "link", href: ".#contact" },
  })}
  </section>

</main>`;
