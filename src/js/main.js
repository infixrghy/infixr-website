(() => {
  document.getElementById("year").textContent = new Date().getFullYear();

  const form = document.getElementById("contact-form");
  if (!form) return;

  // Web3Forms backend → contact@infixr.com. access_key is a public hidden field in
  // the form (no secret); host-independent. See src/pages/index/body.ts.
  const ENDPOINT = "https://api.web3forms.com/submit";

  const status = form.querySelector(".contact-form__status");
  const submit = form.querySelector('button[type="submit"]');
  const setStatus = (msg, state) => {
    status.textContent = msg;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please fix the highlighted fields.", "error");
      return;
    }
    submit.setAttribute("aria-busy", "true");
    setStatus("Sending…");
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText || "Request failed");
      form.reset();
      setStatus("Thanks — we'll be in touch shortly.", "success");
    } catch (err) {
      setStatus("Could not send right now. Email contact@infixr.com instead.", "error");
    } finally {
      submit.removeAttribute("aria-busy");
    }
  });
})();

// Carousel: transform-track infinite loop + own prev/next + own dots + debounced
// autoplay. Track is clone-padded [3'][1][2][3][1']; `i` indexes those 5. Stepping
// onto an edge clone then instant-teleporting to its pixel-identical real twin =
// seamless loop. Autoplay = one interval gated on `pauseUntil`; any user intent
// pauses it 15s. No-ops where the carousel is absent. (Ari-approved JS.)
(() => {
  const track = document.querySelector("[data-carousel]");
  if (!track) return;
  const carousel = track.closest(".carousel");
  const slides = track.children;
  const real = +track.dataset.carousel; // real-slide count (clones at [0] and [real+1])
  const dots = [...document.querySelectorAll("[data-carousel-dots] .carousel__dot")];
  let i = 1; // start on the first real slide

  const step = () => slides[2].offsetLeft - slides[1].offsetLeft; // card stride (gap-proof)
  // position(false) = instant teleport: normalize clone→real twin, then toggle
  // transition:none around the write with a forced reflow + re-arm, so the track
  // always RESTS transition-active (a lingering :none breaks the next animated
  // move → no transitionend → wrap dies). The inline normalize also covers
  // reduced-motion, where transitions are off so no transitionend fires.
  const position = (animate) => {
    if (!animate) {
      if (i === 0) i = real;            // [3'] clone → real 3
      else if (i === real + 1) i = 1;   // [1'] clone → real 1
    }
    const center = (track.parentElement.clientWidth - slides[1].offsetWidth) / 2;
    if (!animate) track.style.transition = "none";
    track.style.transform = `translateX(${center - i * step()}px)`;
    if (!animate) { void track.offsetHeight; track.style.transition = ""; } // reflow, then re-arm
    const realI = (((i - 1) % real) + real) % real; // clone index → real dot
    dots.forEach((d, k) => d.setAttribute("aria-selected", k === realI ? "true" : "false"));
  };
  position(false);

  // After an animated slide onto an edge clone, instant-teleport to its real twin.
  track.addEventListener("transitionend", (e) => {
    if (e.target !== track || e.propertyName !== "transform") return; // ignore card hover-scale bubbling up
    if (i === 0 || i === real + 1) position(false); // position() does the clone→real normalize + teleport
  });

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  // animate only when motion is allowed; reduced-motion uses position(false) so it
  // both skips the slide animation AND normalizes the clone index inline (no
  // transitionend fires to do it).
  const advance = (dir) => { i += dir; position(!reduce.matches); };
  let pauseUntil = 0;
  const hold = () => { pauseUntil = Date.now() + 15000; }; // pause autoplay 15s on intent
  const move = (dir) => { hold(); advance(dir); };         // user move = hold + advance
  document.querySelector("[data-carousel-prev]").addEventListener("click", () => move(-1));
  document.querySelector("[data-carousel-next]").addEventListener("click", () => move(1));
  dots.forEach((d, k) => d.addEventListener("click", () => { hold(); i = k + 1; position(!reduce.matches); }));
  ["pointerdown", "wheel", "touchstart", "keydown"].forEach((e) => carousel.addEventListener(e, hold, { passive: true }));
  addEventListener("resize", () => position(false));

  setInterval(() => { if (!reduce.matches && Date.now() >= pauseUntil) advance(1); }, 5000); // autoplay: advance, never hold
})();

// Cursor trail: one accent ring (.cursor-tail) that lerp-chases the native CSS
// cursor dot. The dot stays the precise pointer (CSS `cursor:`); this ring lags
// behind it at ease 0.07 per frame (tailX += (mouseX - tailX) * ease), the same
// smoothing the old infixr.com used — but written as transform: translate3d (one
// compositor layer, no per-frame layout) instead of left/top. No-ops when the
// element is absent (CSS gates it to pointer:fine) or reduced-motion is set.
// (Ari-approved JS; 10 KB budget.)
(() => {
  const tail = document.querySelector(".cursor-tail");
  if (!tail) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let mouseX = 0, mouseY = 0;          // latest pointer position
  let tailX = 0, tailY = 0;            // eased glow position (chases the pointer)
  let snap = true;                     // next move should teleport (no streak): true
                                       // on load AND after the pointer re-enters the
                                       // window, so the glow appears under the cursor
                                       // instead of flying in from its last edge spot
  const EASE = 0.07;                   // per-frame catch-up fraction; lower = lazier

  addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (snap) {                        // first move / re-entry: place glow under pointer
      snap = false;
      tailX = mouseX;
      tailY = mouseY;
    }
    tail.classList.add("is-active");   // reveal on EVERY move — re-shows after a leave,
                                       // not just the first time (was the disappear bug)
    // Swell the glow over clickable targets (a light "warming up" on hover).
    tail.classList.toggle("is-over", !!e.target.closest("a,button,[role=button],summary,label,input,select,textarea"));
  }, { passive: true });

  // Pointer left the window: hide the glow AND arm a re-snap so it doesn't streak
  // back from the edge on return. `mouseleave` on <html> fires only at the window
  // boundary and does NOT bubble (unlike `mouseout`), so no per-element false hides.
  document.documentElement.addEventListener("mouseleave", () => {
    tail.classList.remove("is-active");
    snap = true;
  });

  const chase = () => {
    tailX += (mouseX - tailX) * EASE;
    tailY += (mouseY - tailY) * EASE;
    tail.style.transform = `translate3d(${tailX}px, ${tailY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(chase);
  };
  requestAnimationFrame(chase);
})();
