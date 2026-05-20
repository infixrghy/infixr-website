(() => {
  document.getElementById("year").textContent = new Date().getFullYear();

  const form = document.getElementById("contact-form");
  if (!form) return;

  // TODO: replace with real endpoint
  const ENDPOINT = "https://example.com/api/contact";

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
