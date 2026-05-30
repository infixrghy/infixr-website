/**
 * home.ts — the homepage <main>, rendered from templates + live post data.
 *
 * Was src/pages/index.body.html (a hand-authored static partial). Promoted to a
 * render fn for two reasons:
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
 * Mirrors blog.ts: a `posts → string` render fn fed by loadPosts in build.ts.
 */
import { html, esc } from "./templates/html.ts";
import { picture } from "./templates/picture.ts";
import { displayDate } from "./blog.ts";
import type { BlogPost } from "./schema/post.ts";

/**
 * The homepage blog grid is a fixed 5-cell mosaic (CSS grid-template-areas:
 * a b / c people / d people). Each slot has a hardcoded photo/gradient surface
 * and grid-area class, plus whether it carries the corner arrow badge. The DATA
 * (title, date, read-time, link) fills each slot; this map is the LAYOUT and
 * stays literal — it's design, not content. Order matches newest-first posts:
 * the two large feature photos lead, two small gradient cards, then the tall
 * people-photo card. Exactly 5 — the grid has no 6th cell.
 */
const HOME_BLOG_SLOTS: ReadonlyArray<{ cls: string; badge: boolean }> = [
  { cls: "u-card u-card--overlay u-card--feature surf-headset-a blog-a", badge: true },
  { cls: "u-card u-card--overlay u-card--feature surf-headset-b blog-b", badge: true },
  { cls: "u-card u-card--overlay surf-grad blog-c", badge: false },
  { cls: "u-card u-card--overlay surf-grad blog-d", badge: false },
  { cls: "u-card u-card--overlay u-card--feature surf-people blog-people", badge: true },
];

/**
 * One homepage blog card: an overlay card linking to the post's own page. Meta is
 * date + read-time only (no category — the homepage cards never showed one). The
 * surface + grid-area + badge come from the positional slot; title/date/href from
 * the post. Fixes the drift: href is the per-post page, read-time is the real
 * front-matter value. Post fields are our own validated data but esc()'d at the
 * boundary regardless (title may contain author punctuation).
 */
const renderHomeBlogCard = (
  p: BlogPost,
  slot: { cls: string; badge: boolean }
): string => {
  const badge = slot.badge
    ? `\n          <span class="u-card__badge" aria-hidden="true">&rarr;</span>`
    : "";
  return html`<li class="${slot.cls}">
        <a class="u-card__link" href="blog/${esc(p.slug)}.html">
          <div class="u-card__overlay">
            <p class="u-card__meta"><time datetime="${p.date}">${displayDate(
    p.date
  )}</time> &middot; ${String(p.readMinutes)} min read</p>
            <h3>${esc(p.title)}</h3>
          </div>${badge}
        </a>
      </li>`;
};

/**
 * Render the full homepage <main> + trailing hero-3d loader script.
 * @param posts validated, newest-first BlogPost[] (from loadPosts). The blog
 *   section uses the first up-to-5; fewer posts simply fill fewer slots.
 */
export const renderHomeBody = (posts: ReadonlyArray<BlogPost>): string => {
  // Newest-first already (loadPosts sorts). Take up to 5 to fill the mosaic; zip
  // each with its positional slot so a short post list never indexes past the map.
  const homePosts = posts.slice(0, HOME_BLOG_SLOTS.length);
  const blogCards = homePosts
    .map((p, i) => "\n      " + renderHomeBlogCard(p, HOME_BLOG_SLOTS[i]))
    .join("");

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
        <a class="btn btn--primary" href="#contact">Request a Demo</a>
        <a class="btn btn--ghost" href="#solutions">Explore Our Work</a>
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

  <!-- WHO WE ARE -->
  <section class="who" id="about" aria-labelledby="who-title">
    <div class="who__intro">
      <p class="eyebrow">Who We Are</p>
      <h2 id="who-title" class="who__title">VR for Real-World Challenges</h2>
      <a class="who__link link-arrow" href="about.html">Learn More &rarr;</a>
    </div>

    <div class="carousel" role="region" aria-label="Who we are highlights" aria-roledescription="carousel">
      <!-- Radio nav (CSS-only): autoplay runs until a dot is chosen, then :checked
           pins that slide and halts the keyframe. No JS. -->
      <!-- none checked on load → autoplay runs; first dot-click pins via :checked -->
      <input type="radio" name="who-slide" id="who-nav-1" class="carousel__radio">
      <input type="radio" name="who-slide" id="who-nav-2" class="carousel__radio">
      <input type="radio" name="who-slide" id="who-nav-3" class="carousel__radio">
      <div class="carousel__viewport">
      <ol class="carousel__track">
        <li class="card" id="who-1">
          <figure>
            ${picture({
      webp: "assets/who-headset-white.webp",
      png: "assets/who-headset-white.png",
      alt: "Meta Quest VR headset on a clean studio table",
      width: 900,
      height: 317,
      loading: "lazy",
    })}
          </figure>
          <div class="card__body">
            <h3>We Create VR Apps For Real-World Challenges</h3>
            <p>We build immersive VR experiences designed to solve real operational, training, and performance challenges.</p>
          </div>
        </li>
        <li class="card" id="who-2">
          <figure>
            ${picture({
      webp: "assets/who-headset-white.webp",
      png: "assets/who-headset-white.png",
      alt: "Meta Quest VR headset on a clean studio table",
      width: 900,
      height: 317,
      loading: "lazy",
    })}
          </figure>
          <div class="card__body">
            <h3>Scalable &amp; Accessible</h3>
            <p>Our XR platform works across VR, web, and mobile making it easy to deploy, scale, and access immersive experiences anywhere.</p>
          </div>
        </li>
        <li class="card" id="who-3">
          <figure>
            ${picture({
      webp: "assets/who-headset-white.webp",
      png: "assets/who-headset-white.png",
      alt: "Meta Quest VR headset on a clean studio table",
      width: 900,
      height: 317,
      loading: "lazy",
    })}
          </figure>
          <div class="card__body">
            <h3>Practical, Not Experimental</h3>
            <p>Every solution is designed for usability, efficiency, and measurable outcomes focused on real results, not just innovation.</p>
          </div>
        </li>
      </ol>
      </div>
      <div class="carousel__dots" role="group" aria-label="Choose slide">
        <label class="carousel__dot" for="who-nav-1" aria-label="Go to slide 1"></label>
        <label class="carousel__dot" for="who-nav-2" aria-label="Go to slide 2"></label>
        <label class="carousel__dot" for="who-nav-3" aria-label="Go to slide 3"></label>
      </div>
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
      <!-- 2 small dark-glass text cards (unified .u-card, glass via @supports) -->
      <li class="u-card u-card--text">
        <div class="u-card__body">
          <h3>Corporate Training</h3>
          <p>Immersive scenarios that sharpen communication, decision-making, and leadership&mdash;so teams practice high-stakes moments before they happen for real.</p>
          <a class="link-arrow" href="#contact">View Case Study &rarr;</a>
        </div>
      </li>
      <li class="u-card u-card--text">
        <div class="u-card__body">
          <h3>Workforce Training</h3>
          <p>Hands-on skill-building at scale. Repeatable, measurable VR modules onboard and upskill your workforce faster than classroom or video ever could.</p>
          <a class="link-arrow" href="#contact">View Case Study &rarr;</a>
        </div>
      </li>
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
          <input id="cf-name" name="name" type="text" required autocomplete="name" minlength="2" maxlength="80">
        </div>
        <div class="field">
          <label for="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" required autocomplete="email" maxlength="120">
        </div>
        <div class="field">
          <label for="cf-phone">Phone Number</label>
          <input id="cf-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" pattern="[0-9 +()\\-]{6,20}" maxlength="20">
        </div>
        <div class="field field--full">
          <label for="cf-message">Message</label>
          <textarea id="cf-message" name="message" required minlength="10" maxlength="2000" rows="5"></textarea>
        </div>
        <div class="field field--full contact-form__actions">
          <button type="submit" class="btn btn--primary">Send Message</button>
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
