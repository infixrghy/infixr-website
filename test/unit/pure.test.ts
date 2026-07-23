/**
 * test/unit/pure.test.ts — unit tests for the pure `Data → string` layer.
 *
 * These are the byte-producing functions the build composes: escaping, the
 * front-matter parser, date/meta formatting, and the two typed components. They
 * take data and return a string with no IO/DOM, so they test in isolation with
 * zero setup. Run with `npm test` (vitest — plain, NOT @effect/vitest: that is
 * still an effect-v3 package and the project is effect@4-beta, so Effect
 * values are exercised via Effect.runPromiseExit rather than it.effect()).
 */
import { test, expect, describe } from "vitest";
import { Effect, Exit } from "effect";

import { esc, html } from "../../src/templates/html.ts";
import { picture } from "../../src/templates/picture.ts";
import { displayDate, timeMeta, parseFrontMatter } from "../../src/data/posts.ts";
import { button } from "../../src/components/button/button.ts";
import { glassCard } from "../../src/components/glass-card/glass-card.ts";
import { decodeFrontMatter } from "../../src/schema/post.ts";
import { decodePageMeta } from "../../src/schema/page.ts";

// ── esc: the XSS boundary. Every untrusted .md value flows through this. ──
describe("esc", () => {
  test("escapes all five HTML-significant characters", () => {
    expect(esc("&")).toBe("&amp;");
    expect(esc("<")).toBe("&lt;");
    expect(esc(">")).toBe("&gt;");
    expect(esc('"')).toBe("&quot;");
    expect(esc("'")).toBe("&#39;");
  });
  test("escapes a mix without double-encoding the ampersands it emits", () => {
    // Single-pass regex-with-callback: each source char maps once and the emitted
    // entity text is never re-scanned, so "<&>" can't become "&amp;lt;…". This
    // pins that no-double-encode property (a naive sequential .replace chain that
    // ran & after < WOULD double-encode; this test would catch such a rewrite).
    expect(esc("<&>")).toBe("&lt;&amp;&gt;");
  });
  test("neutralises a script-injection payload", () => {
    expect(esc('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });
  test("leaves safe text untouched", () => {
    expect(esc("Hello, world 123")).toBe("Hello, world 123");
  });
});

// ── html tagged template: array flatten + verbatim insertion ──
describe("html", () => {
  test("joins interpolated arrays with no separator", () => {
    expect(html`<ul>${["<li>a</li>", "<li>b</li>"]}</ul>`).toBe(
      "<ul><li>a</li><li>b</li></ul>"
    );
  });
  test("inserts string values verbatim (no auto-escape — esc is explicit)", () => {
    expect(html`<p>${"&mdash;"}</p>`).toBe("<p>&mdash;</p>");
  });
});

// ── parseFrontMatter: the hand-rolled front-matter splitter (branchy) ──
describe("parseFrontMatter", () => {
  test("splits fenced front-matter from the body", () => {
    const { data, body } = parseFrontMatter('---\ntitle: Hello\n---\nBody text');
    expect(data.title).toBe("Hello");
    expect(body).toBe("Body text");
  });
  test("strips surrounding double-quotes from values", () => {
    const { data } = parseFrontMatter('---\ntitle: "Quoted Title"\n---\n');
    expect(data.title).toBe("Quoted Title");
  });
  test("coerces true/false to booleans", () => {
    const { data } = parseFrontMatter("---\ndraft: true\nlive: false\n---\n");
    expect(data.draft).toBe(true);
    expect(data.live).toBe(false);
  });
  test("coerces bare integers to numbers", () => {
    const { data } = parseFrontMatter("---\nreadMinutes: 7\n---\n");
    expect(data.readMinutes).toBe(7);
    expect(typeof data.readMinutes).toBe("number");
  });
  test("handles CRLF line endings", () => {
    const { data, body } = parseFrontMatter("---\r\ntitle: Win\r\n---\r\nBody");
    expect(data.title).toBe("Win");
    expect(body).toBe("Body");
  });
  test("no fence → empty data, whole input is body", () => {
    const { data, body } = parseFrontMatter("Just a body, no fence");
    expect(data).toEqual({});
    expect(body).toBe("Just a body, no fence");
  });
  test("skips blank lines and lines without a colon", () => {
    const { data } = parseFrontMatter("---\ntitle: A\n\nnocolon\ndate: 2026-01-01\n---\n");
    expect(data).toEqual({ title: "A", date: "2026-01-01" });
  });
  test("keeps only the first colon (values may contain colons)", () => {
    const { data } = parseFrontMatter("---\ntime: 10:30:00\n---\n");
    expect(data.time).toBe("10:30:00");
  });
});

// ── displayDate: deterministic ISO → display (pure string math, no Date) ──
describe("displayDate", () => {
  test("formats an ISO date as 'Mon D, YYYY'", () => {
    expect(displayDate("2026-07-01")).toBe("Jul 1, 2026");
  });
  test("first and last month resolve correctly (no off-by-one)", () => {
    expect(displayDate("2026-01-15")).toBe("Jan 15, 2026");
    expect(displayDate("2026-12-31")).toBe("Dec 31, 2026");
  });
  test("strips a leading zero from the day", () => {
    expect(displayDate("2026-03-05")).toBe("Mar 5, 2026");
  });
});

// ── timeMeta: the single source of the <time> · N min read fragment ──
describe("timeMeta", () => {
  test("emits a machine-readable <time datetime> + read estimate", () => {
    expect(timeMeta("2026-07-01", 4)).toBe(
      '<time datetime="2026-07-01">Jul 1, 2026</time> &middot; 4 min read'
    );
  });
});

// ── picture: required attrs present, CLS-guard width/height always emitted ──
describe("picture", () => {
  test("emits webp source + png fallback with width/height (CLS guard)", () => {
    const out = picture({
      webp: "assets/x.webp",
      png: "assets/x.png",
      alt: "hi",
      width: 800,
      height: 450,
      loading: "lazy",
    });
    expect(out).toContain('srcset="assets/x.webp"');
    expect(out).toContain('src="assets/x.png"');
    expect(out).toContain('width="800"');
    expect(out).toContain('height="450"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('decoding="async"');
  });
  test("escapes alt text", () => {
    const out = picture({
      webp: "a.webp", png: "a.png", alt: '"><img>', width: 1, height: 1, loading: "eager",
    });
    expect(out).toContain('alt="&quot;&gt;&lt;img&gt;"');
  });
  test("fetchpriority only present when supplied", () => {
    const withFp = picture({ webp: "a", png: "b", alt: "", width: 1, height: 1, loading: "eager", fetchpriority: "high" });
    const noFp = picture({ webp: "a", png: "b", alt: "", width: 1, height: 1, loading: "lazy" });
    expect(withFp).toContain('fetchpriority="high"');
    expect(noFp).not.toContain("fetchpriority");
  });
});

// ── button: variant → class, link vs submit element (decodeButton is SYNC) ──
describe("button", () => {
  test("link action renders <a href> with variant + width classes", () => {
    const out = button({
      label: "Request a Demo",
      variant: "glass",
      minWidth: "cta",
      action: { _tag: "link", href: "#contact" },
    });
    expect(out).toContain("<a ");
    expect(out).toContain('href="#contact"');
    expect(out).toContain("btn btn--glass btn--w-cta");
    expect(out).toContain("Request a Demo");
  });
  test("button action renders <button type=submit>", () => {
    const out = button({
      label: "Send",
      variant: "glass",
      action: { _tag: "button", kind: "submit" },
    });
    expect(out).toContain('<button type="submit"');
    expect(out).toContain("btn btn--glass");
  });
  test("variant defaults to primary when omitted", () => {
    const out = button({ label: "Go", action: { _tag: "link", href: "/x" } });
    expect(out).toContain("btn--primary");
  });
  test("escapes the label", () => {
    const out = button({ label: "<x>", action: { _tag: "link", href: "/" } });
    expect(out).toContain("&lt;x&gt;");
  });
  test("rejects an unknown variant at build time (throws)", () => {
    expect(() =>
      button({ label: "X", variant: "primaryy", action: { _tag: "link", href: "/" } })
    ).toThrow();
  });
  test("rejects a missing action (unrepresentable state)", () => {
    expect(() => button({ label: "X" })).toThrow();
  });
});

// ── glassCard: variant default, footer union, linked vs plain title ──
describe("glassCard", () => {
  test("defaults to the v3 variant and emits the glass-card surface", () => {
    const out = glassCard({ title: "T", body: "B" });
    expect(out).toContain("glass-card glass-card--v3");
    expect(out).toContain("<h3>T</h3>");
  });
  test("meta footer renders a <time> line via timeMeta", () => {
    const out = glassCard({
      title: "T", body: "B",
      footer: { _tag: "meta", date: "2026-07-01", readMinutes: 5 },
    });
    expect(out).toContain('<time datetime="2026-07-01">Jul 1, 2026</time>');
    expect(out).toContain("5 min read");
  });
  test("cta footer renders a .link-arrow anchor", () => {
    const out = glassCard({
      title: "T", body: "B",
      footer: { _tag: "cta", label: "Learn More", href: "services#x" },
    });
    expect(out).toContain('class="link-arrow"');
    expect(out).toContain('href="services#x"');
    expect(out).toContain("Learn More");
  });
  test("href makes the title a link", () => {
    const out = glassCard({ title: "T", body: "B", href: "blog/x" });
    expect(out).toContain('<h3><a href="blog/x">T</a></h3>');
  });
  test("rejects an out-of-range tint percentage (throws)", () => {
    expect(() => glassCard({ title: "T", body: "B", tint: "150%" })).toThrow();
  });
  test("rejects a half-set meta footer (date without readMinutes)", () => {
    expect(() =>
      glassCard({ title: "T", body: "B", footer: { _tag: "meta", date: "2026-07-01" } })
    ).toThrow();
  });
});

// ── Effect-channel decoders: decodeFrontMatter / decodePageMeta are
//    decodeUnknownEffect, so success/failure rides the Effect Exit. ──
describe("decodeFrontMatter (Effect channel)", () => {
  const valid = {
    title: "Post", date: "2026-07-01", readMinutes: 4,
    category: "Engineering", slug: "a-valid-slug", excerpt: "An excerpt.",
  };
  test("valid front-matter decodes to a success Exit", async () => {
    const exit = await Effect.runPromiseExit(decodeFrontMatter(valid));
    expect(Exit.isSuccess(exit)).toBe(true);
  });
  test("a non-kebab slug fails the decode", async () => {
    const exit = await Effect.runPromiseExit(
      decodeFrontMatter({ ...valid, slug: "Not Kebab Case" })
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
  test("readMinutes <= 0 fails the decode", async () => {
    const exit = await Effect.runPromiseExit(
      decodeFrontMatter({ ...valid, readMinutes: 0 })
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
  test("a missing required field (excerpt) fails the decode", async () => {
    const { excerpt, ...noExcerpt } = valid;
    const exit = await Effect.runPromiseExit(decodeFrontMatter(noExcerpt));
    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe("decodePageMeta (Effect channel)", () => {
  const valid = {
    title: "InfiXR", description: "d", canonical: "https://infixr.com/",
    ogUrl: "https://infixr.com/", ogTitle: "t", ogDescription: "d",
    twitterTitle: "t", twitterDescription: "d", nav: "home",
  };
  test("valid page meta decodes (index-only Options may be absent)", async () => {
    const exit = await Effect.runPromiseExit(decodePageMeta(valid));
    expect(Exit.isSuccess(exit)).toBe(true);
  });
  test("an unknown nav id fails the decode", async () => {
    const exit = await Effect.runPromiseExit(decodePageMeta({ ...valid, nav: "bogus" }));
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
