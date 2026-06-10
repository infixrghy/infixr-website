/**
 * pages/index/body.ts — the homepage <main>, rendered from templates + live post data.
 *
 * Was src/pages/index.body.html (a hand-authored static partial) → src/home.ts →
 * here (the per-page folder, paired with meta.ts). Promoted from the static partial
 * to a render fn for two reasons:
 *   1. The blog section was a hand-copied snapshot of content/posts/*.md that had
 *      already drifted — wrong links (all → blog.html, never the per-post page),
 *      invented read-times, and a fixed top-5 that silently ignored new posts.
 *      It's now driven by the same validated BlogPost[] the blog index uses.
 *   2. The 5 repeated <picture> blocks (hero + 3 who cards + solution feature) now
 *      go through the typed picture() helper — no copied srcset / mismatched w/h.
 *
 * Everything else (hero copy, who/solutions/contact markup) is the SAME content as
 * the old partial — just authored here now. Output is byte-stable with the prior
 * build. The trailing hero-3d loader <script> is part of this body (it sat after
 * </main> in the partial), so it's appended after the closing tag here too.
 *
 * A `posts → string` render fn fed by loadPosts (content.ts) in build.ts; the post
 * data layer (loadPosts/displayDate) lives in src/content.ts — shared with the blog
 * page, not owned by either.
 */
import { html, esc } from "../../templates/html.ts";
import { picture } from "../../templates/picture.ts";
import { glassCard } from "../../components/glass-card/glass-card.ts";
import { button } from "../../components/button/button.ts";
import { timeMeta } from "../../content.ts";
import type { BlogPost } from "../../schema/post.ts";

/**
 * The homepage blog teaser is 3 cards, NOT the full index (a "View More →" link
 * carries the rest). The shape is a hybrid: ONE large photo card leads (the
 * featured/newest post), and TWO editorial text cards stack beside it.
 *
 * Why not the old 5-cell photo mosaic? Posts carry no image field
 * (title/date/readMinutes/category/slug/excerpt — see schema/post.ts), so the
 * old grid FAKED imagery: two cells reused the hero headset render, two were
 * stock conic gradients, one borrowed a who-carousel face. That "ran out of
 * pictures" look is the weakness. The hybrid is honest — the one card that gets
 * a photo uses `sol-corporate` (a real render that's otherwise UNUSED on the
 * homepage, so no third repeat of the headset / who faces), and the text cards
 * own their type instead of hiding it under a gradient. Meta line: date +
 * read-time only (the homepage teaser never showed a category eyebrow on the
 * photo card — the text cards do, where it reads as editorial kicker).
 */
const HOME_FEATURE_IMG = "sol-corporate";

/**
 * The lead card: a real photo (sol-corporate) fills it, the title + meta sit at
 * the bottom over the .u-card--overlay scrim, the whole card is one link. Photo
 * is decorative (alt="") — it isn't of this post, it sets the workspace tone;
 * the heading/meta carry the meaning. Spans both rows of the grid (blog-feature).
 */
const renderHomeFeature = (p: BlogPost): string =>
  html`<li class="u-card u-card--overlay u-card--feature blog-feature">
        <div class="u-card__media">
          ${picture({
    webp: `assets/${HOME_FEATURE_IMG}.webp`,
    png: `assets/${HOME_FEATURE_IMG}.png`,
    alt: "",
    width: 800,
    height: 450,
    loading: "lazy",
  })}
        </div>
        <a class="u-card__link" href="blog/${esc(p.slug)}.html">
          <div class="u-card__overlay">
            <p class="u-card__meta">${timeMeta(p.date, p.readMinutes)}</p>
            <h3>${esc(p.title)}</h3>
          </div>
          <span class="u-card__badge" aria-hidden="true">&rarr;</span>
        </a>
      </li>`;

/**
 * An editorial text card — now the typed glassCard() component (templates/
 * glass-card.ts), which emits the unified frosted .glass-card surface + the
 * machine-readable <time> meta. `extraClass: "blog-text"` carries the homepage
 * editorial tweaks (eyebrow tint, linked-title hover) from components.css.
 * Variant defaults to V3 (the chosen look). Params are Schema-validated → a bad
 * field fails the build. Data is esc()'d inside the component at the boundary.
 */
const renderHomeTextCard = (p: BlogPost): string =>
  glassCard({
    eyebrow: p.category,
    title: p.title,
    href: `blog/${p.slug}.html`,
    body: p.excerpt,
    footer: { _tag: "meta", date: p.date, readMinutes: p.readMinutes },
    extraClass: "blog-text",
  });

/**
 * "Who We Are" carousel slides — the 3 real cards, as data. Each maps a distinct
 * VR photo to its message (team/office, engineer/factory, lab/research).
 */
const WHO_SLIDES: ReadonlyArray<{
  img: string;
  alt: string;
  index: string;
  title: string;
  body: string;
  name: string;
}> = [
  {
    img: "who-1",
    alt: "A diverse team wearing VR headsets collaborating around a meeting table",
    index: "01",
    title: "VR Apps for Real-World Challenges",
    body: "Immersive experiences engineered to solve real operational, training, and performance problems.",
    name: "VR Apps for Real-World Challenges",
  },
  {
    img: "who-2",
    alt: "An engineer in VR manipulating a 3D model on a factory floor",
    index: "02",
    title: "Scalable &amp; Accessible",
    body: "One XR platform across VR, web, and mobile&nbsp;&mdash; easy to deploy, scale, and reach anywhere.",
    name: "Scalable and Accessible",
  },
  {
    img: "who-3",
    alt: "A researcher in a lab gesturing while wearing a VR headset",
    index: "03",
    title: "Practical, Not Experimental",
    body: "Built for usability, efficiency, and measurable outcomes&nbsp;&mdash; real results, not novelty.",
    name: "Practical, Not Experimental",
  },
];

/**
 * One carousel slide. `clone` slides are visual-only duplicates that pad the
 * scroll-container ends ([3'][1][2][3][1']) so the native ::scroll-button() never
 * hits a scroll boundary — carousel.js snap-resets to the real twin on scrollend
 * for a seamless wrap. Clones are aria-hidden and carry no ::scroll-marker (CSS
 * suppresses markers on [aria-hidden] slides), so the dot count stays 3, not 5.
 * `data-name` becomes the marker's accessible name (real slides only).
 */
const renderWhoSlide = (
  s: (typeof WHO_SLIDES)[number],
  clone = false
): string => {
  const attrs = clone ? ` aria-hidden="true"` : ` data-name="${s.name}"`;
  return html`<li class="card"${attrs}>
          <figure class="card__media">
            ${picture({
    webp: `assets/${s.img}.webp`,
    png: `assets/${s.img}.jpg`,
    alt: clone ? "" : s.alt,
    width: 800,
    height: 450,
    loading: "lazy",
  })}
          </figure>
          <div class="card__body">
            <span class="card__index" aria-hidden="true">${s.index}</span>
            <h3>${s.title}</h3>
            <p>${s.body}</p>
          </div>
        </li>`;
};

/**
 * Render the full homepage <main> + trailing hero-3d loader script.
 * @param posts validated, newest-first BlogPost[] (from loadPosts). The blog
 *   section uses the first up-to-5; fewer posts simply fill fewer slots.
 */
export const renderHomeBody = (posts: ReadonlyArray<BlogPost>): string => {
  // Newest-first already (loadPosts sorts). 3-card teaser: the FEATURED post (or
  // newest as fallback) is the photo lead; the next two are editorial text cards.
  // Fewer than 3 posts simply renders fewer cards (no index-past-end).
  const feature = posts.find((p) => p.featured) ?? posts[0];
  const textPosts = posts.filter((p) => p !== feature).slice(0, 2);
  const blogCards =
    (feature ? "\n      " + renderHomeFeature(feature) : "") +
    textPosts.map((p) => "\n      " + renderHomeTextCard(p)).join("");

  return (
    html`<main id="top">

  <!-- HERO -->
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__content">
      <h1 id="hero-title" class="hero__title">
        <span class="hero__line">
          <span class="xr-slot" aria-label="XR">
            <span class="word-slot__sr">XR</span>
            <ul class="xr-slot__list" aria-hidden="true">
              <li>XR</li>
              <li>VR</li>
              <li>AR</li>
              <li>MR</li>
            </ul></span> Solutions,</span>
        <span class="hero__line">Built Around Your</span>
        <span class="word-slot" aria-label="needs, training, experiences, simulations, walkthroughs">
          <span class="word-slot__sr">Needs.</span>
          <ul class="word-slot__list" aria-hidden="true">
            <li>Needs.</li>
            <li>Training.</li>
            <li>Experiences.</li>
            <li>Simulations.</li>
            <li>Walkthroughs.</li>
          </ul>
        </span>
      </h1>
      <p class="hero__sub">End-to-end VR training solutions for safer &amp; faster learning.</p>
      <div class="hero__cta">
        ${button({
    label: "Request a Demo",
    variant: "glass",
    minWidth: "cta",
    action: { _tag: "link", href: "#contact" },
  })}
        ${button({
    label: "Explore Our Work",
    variant: "ghost",
    minWidth: "cta",
    action: { _tag: "link", href: "#solutions" },
  })}
      </div>
    </div>

    <!-- Decorative headset (3D on desktop/motion via js/hero-3d, else static webp)
         orbiting a single static SVG ellipse. Purely ornamental → aria-hidden.
         The ring is the ONLY still element framing the rotating headset: one point
         of motion (the headset), one static frame (the orbit). Hidden ≤900px. -->
    <div class="hero__visual" aria-hidden="true">
      <svg class="hero__ring" viewBox="0 0 600 600" fill="none" preserveAspectRatio="xMidYMid meet">
        <!-- single perspective-flattened orbit (was 2 concentric ellipses spinning;
             now 1 static — confident, less stock-decoration) -->
        <ellipse class="hero__ring-arc" cx="300" cy="300" rx="250" ry="120" transform="rotate(-18 300 300)"/>
        <!-- static waypoint nodes riding the orbit; the teal one is the single accent -->
        <circle class="hero__node" cx="535" cy="262" r="4"/>
        <circle class="hero__node hero__node--accent" cx="92" cy="356" r="7"/>
        <circle class="hero__node" cx="360" cy="178" r="3.5"/>
      </svg>
      <!-- Static fallback = the model-viewer's exact frame-0 render (captured from
           the live renderer: same orbit 0deg/80deg/105%, neutral PBR lighting,
           contact shadow, transparent bg). Square 1500² so it occupies the SAME
           box as .hero__model — when the 3D reveals at frame 0 the pixels match and
           rotation begins from here, so the handoff is seamless. -->
      ${picture({
      webp: "assets/hero-headset-1200.webp",
      png: "assets/hero-headset-1200.png",
      alt: "",
      width: 1500,
      height: 1500,
      loading: "eager",
      fetchpriority: "high",
      className: "hero__headset",
    })}
    </div>
  </section>

  <!-- OUR SOLUTIONS -->
  <section class="solutions" id="solutions" aria-labelledby="solutions-title">
    <header class="solutions__head">
      <div class="solutions__headline">
        <p class="eyebrow">What We Build</p>
        <h2 id="solutions-title">From Idea to Immersive Reality</h2>
      </div>
      <p class="solutions__lead">A streamlined process that turns operational challenges into immersive, measurable training.</p>
      <a class="link-arrow link-arrow--bold solutions__more" href="#contact">View More &rarr;</a>
    </header>
    <ul class="solutions__grid">
      <!-- 2 small frosted glass-card text cards (V3), via the same glassCard()
           component as the blog cards. The Solutions shape = plain title (no href)
           + a CTA footer (no eyebrow); the component's Option/footer-union handles
           it. The .solutions::before glow is what the frost refracts. -->
      ${glassCard({
    title: "Corporate Training",
    body: "Immersive scenarios that sharpen communication, decision-making, and leadership—so teams practice high-stakes moments before they happen for real.",
    footer: { _tag: "cta", label: "View Case Study", href: "#contact" },
  })}
      ${glassCard({
    title: "Workforce Training",
    body: "Hands-on skill-building at scale. Repeatable, measurable VR modules onboard and upskill your workforce faster than classroom or video ever could.",
    footer: { _tag: "cta", label: "View Case Study", href: "#contact" },
  })}
      <!-- 1 large photo feature card (overlay, spans both rows) -->
      <li class="u-card u-card--overlay u-card--feature solution-feature">
        <div class="u-card__media">
          ${picture({
      webp: "assets/sol-industrial-feature.webp",
      png: "assets/sol-industrial-feature.png",
      alt: "Industrial and safety training simulation in a warehouse",
      width: 512,
      height: 230,
      loading: "lazy",
    })}
        </div>
        <div class="u-card__body">
          <h3>Industrial &amp; Safety Training</h3>
          <p>Train for high-risk environments without the risk. From equipment handling to emergency response, we make dangerous work safe to rehearse&mdash;and scalable.</p>
          <a class="link-arrow" href="#contact">View Case Study &rarr;</a>
        </div>
      </li>
    </ul>
  </section>

  <!-- WHO WE ARE -->
  <section class="who" id="about" aria-labelledby="who-title">
    <div class="who__intro">
      <p class="eyebrow">Who We Are</p>
      <h2 id="who-title" class="who__title">VR for Real-World Challenges</h2>
      <a class="who__link link-arrow" href="about.html">Learn More &rarr;</a>
    </div>

    <div class="carousel" role="region" aria-label="Who we are highlights" aria-roledescription="carousel">
      <!-- Transform-track carousel: the track translateX-shifts inside a clip
           viewport (NOT a scroll container — a scroll container can't center the
           first AND last card without runway hacks that fight flexbox). Clone-
           padded [3'][1][2][3][1']; the carousel code in main.js shifts one card per
           step and, on transitionend at an edge clone, instant-jumps to its real
           twin → seamless infinite loop. Own dots + corner buttons drive it (the
           native ::scroll-marker/::scroll-button APIs can't do seamless-loop +
           one-card-step + centered-peek together). data-carousel="3" = real count. -->
      <div class="carousel__viewport">
        <ol class="carousel__track" data-carousel="3">
          ${renderWhoSlide(WHO_SLIDES[2], true)}
          ${renderWhoSlide(WHO_SLIDES[0])}
          ${renderWhoSlide(WHO_SLIDES[1])}
          ${renderWhoSlide(WHO_SLIDES[2])}
          ${renderWhoSlide(WHO_SLIDES[0], true)}
        </ol>
      </div>
      <!-- Control band: prev/next in the lower corners, own dots centered between. -->
      <button type="button" class="carousel__btn carousel__btn--prev" data-carousel-prev aria-label="Previous slide">&lsaquo;</button>
      <div class="carousel__dots" role="tablist" aria-label="Choose slide" data-carousel-dots>
        <button type="button" class="carousel__dot" role="tab" aria-label="Slide 1: VR Apps for Real-World Challenges"></button>
        <button type="button" class="carousel__dot" role="tab" aria-label="Slide 2: Scalable and Accessible"></button>
        <button type="button" class="carousel__dot" role="tab" aria-label="Slide 3: Practical, Not Experimental"></button>
      </div>
      <button type="button" class="carousel__btn carousel__btn--next" data-carousel-next aria-label="Next slide">&rsaquo;</button>
    </div>
  </section>

  <!-- BLOG -->
  <section class="blog" id="blog" aria-labelledby="blog-title">
    <header class="blog__head">
      <p class="eyebrow">Blogs</p>
      <h2 id="blog-title">The Future of Spatial Experiences</h2>
      <p class="blog__lead">Exploring immersive experiences, spatial storytelling, and where VR training goes next.</p>
      <a class="link-arrow link-arrow--bold blog__more" href="blog.html">View More &rarr;</a>
    </header>
    <ul class="blog__grid">${blogCards}
    </ul>
  </section>

  <!-- CONTACT -->
  <section class="contact" id="contact" aria-labelledby="contact-title">
    <div class="u-card contact__card">
      <p class="eyebrow">Get In Touch</p>
      <h2 id="contact-title">Let's build something together.</h2>
      <p class="contact__lead">At InfiXR, we design and develop VR solutions that go beyond visuals&mdash;helping teams train better, reduce risks, and perform with confidence in high-stakes environments. Tell us what you're building&mdash;we'd love to be a part of it.</p>

      <form class="contact-form" id="contact-form" novalidate>
        <div class="field">
          <label for="cf-name">Name</label>
          <input id="cf-name" name="name" type="text" required autocomplete="name" minlength="2" maxlength="80" placeholder="Ram Das">
        </div>
        <div class="field">
          <label for="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" required autocomplete="email" maxlength="120" placeholder="das@company.com">
        </div>
        <div class="field">
          <label for="cf-phone">Phone Number</label>
          <input id="cf-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" pattern="[0-9 +()\\-]{6,20}" maxlength="20" placeholder="+91 98765 43210">
        </div>
        <div class="field field--full">
          <label for="cf-message">Message</label>
          <textarea id="cf-message" name="message" required minlength="10" maxlength="2000" rows="5" placeholder="The skill to train, the risk to cut, the moment to nail."></textarea>
        </div>
        <div class="field field--full contact-form__actions">
          ${button({
    label: "Send Message",
    variant: "glass",
    action: { _tag: "button", kind: "submit" },
  })}
          <p class="contact-form__status" role="status" aria-live="polite"></p>
        </div>
      </form>
    </div>
  </section>

</main>

<!-- Hero 3D (T27): lazy-loads the rotating Meta Quest 3 (model-viewer) over the
     static webp on desktop, motion allowed. Index-only. The model-viewer runtime
     lives under js/hero-3d/ — outside the V1 5 KB budget per Ari-approved
     exception; this loader stays tiny. defer = off the critical path. -->
<script src="js/hero-3d/loader.js" defer></script>`
  );
};
