/**
 * hero-3d/loader.js — lazy loader for the rotating Meta Quest 3 hero model.
 *
 * This is the T27 JS-budget exception (approved by Ari): model-viewer is a large
 * runtime (~1 MB raw / ~250 KB gzipped). It lives under src/js/hero-3d/ which is
 * OUTSIDE V1's `src/js/*.js` 5 KB budget by design — see SPEC §V1. This loader
 * file itself is the only counted byte cost on the page, and it stays tiny.
 *
 * Strategy (decided with Ari):
 *   - The static <picture class="hero__headset"> webp is the LCP element and is
 *     ALWAYS painted first. The 3D is a progressive upgrade layered over it.
 *   - Reduced-motion → DON'T load at all. The whole point of the 3D is rotation;
 *     with rotation suppressed the static frame is the correct artifact, and we
 *     spare motion-sensitive users the ~1 MB download (V5).
 *   - <900px → skip. .hero__visual is `display:none` below 900px (mobile = text
 *     only, AA-safe), so there is nothing to upgrade. Gating on the same
 *     breakpoint avoids downloading 1 MB for a hidden element.
 *   - Otherwise inject model-viewer's module on idle (webp already painted).
 *
 * ALL injected URLs are RELATIVE. The site is served from a GitHub Pages subpath
 * (infixrghy.github.io/infixr-website/) as well as the eventual infixr.com root;
 * a root-absolute "/js/..." or "/assets/..." path 404s on the subpath. This
 * loader is index-only, so the paths are relative to the site root.
 */
(() => {
  "use strict";

  const visual = document.querySelector(".hero__visual");
  if (!visual) return; // not the home page

  // V5: rotation is the entire value of the 3D. No motion → keep the static webp.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // .hero__visual is display:none below 900px — nothing to upgrade, skip the MB.
  if (!matchMedia("(min-width: 900px)").matches) return;

  let started = false;

  const inject = () => {
    if (started) return;
    started = true;

    // model-viewer is an ES module web component. Inject the vendored, same-origin
    // build (relative URL). Once defined, <model-viewer> upgrades in place.
    const script = document.createElement("script");
    script.type = "module";
    script.src = "js/hero-3d/model-viewer.min.js";

    const mv = document.createElement("model-viewer");
    // Decorative (matches the static <img alt="">): screen-reader hidden.
    mv.setAttribute("aria-hidden", "true");
    mv.className = "hero__model";
    // Relative .glb (copied to public/assets/ by the build's assets/ copy step).
    mv.setAttribute("src", "assets/headset.glb");
    // Passive turntable: no `camera-controls` → no interaction prompt, no
    // zoom/pan/tap handlers, and wheel/touch scroll passes straight through.
    mv.setAttribute("rotation-per-second", "30deg");
    mv.setAttribute("interaction-prompt", "none");
    // Frame 0 = headset facing the viewer head-on (front lens toward the visitor),
    // slight top-down for dimension. The static webp is a pixel-exact capture of
    // THIS pose, so the model first renders identically to the webp it replaces.
    // auto-rotate is deliberately NOT set yet — see the load handler.
    mv.setAttribute("camera-orbit", "0deg 82deg 105%");
    mv.setAttribute("shadow-intensity", "1.4");
    mv.setAttribute("shadow-softness", "0.8");
    mv.setAttribute("exposure", "1.05");
    // No `environment-image` → model-viewer's built-in neutral lighting (Khronos
    // PBR neutral). No cross-origin .hdr fetch — V17 stays clean.

    // Seamless handoff. The static webp IS the model's frame 0. On `load` we reveal
    // the model (instant swap, no fade: the pixels are identical, so a crossfade
    // would only risk a faint double-image) and ONLY THEN start auto-rotate — on
    // the next frame, so rotation begins FROM frame 0 rather than from wherever a
    // turntable that had been spinning since context-init happened to be. Without
    // this defer, at 30°/s the model would already be ~tens of degrees past frame 0
    // by reveal, and the eye catches the jump.
    mv.addEventListener(
      "load",
      () => {
        visual.classList.add("hero__visual--3d");
        requestAnimationFrame(() => {
          mv.setAttribute("auto-rotate", "");
          mv.setAttribute("auto-rotate-delay", "0");
        });
      },
      { once: true }
    );

    visual.appendChild(mv);
    document.head.appendChild(script);
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(inject, { timeout: 2500 });
  } else {
    // Safari has no rIC: defer past first paint with a short timeout.
    setTimeout(inject, 1200);
  }
})();
