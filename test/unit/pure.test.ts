/**
 * test/unit/pure.test.ts — unit tests for the pure data layer: the post
 * front-matter schema (the build's validation gate) and the deterministic
 * date formatting. The render layer itself is .astro templates, exercised by
 * the output tests (test/output/build.test.ts) against the real build.
 */
import { test, expect, describe } from "vitest";

import { postSchema } from "../../src/data/post-schema.ts";
import { displayDate } from "../../src/utils/posts.ts";

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

// ── postSchema: the front-matter gate. A bad field here = a failed build. ──
describe("postSchema", () => {
  const valid = {
    title: "Post",
    date: "2026-07-01",
    readMinutes: 4,
    category: "Engineering",
    slug: "a-valid-slug",
    excerpt: "An excerpt.",
  };

  test("valid front-matter parses", () => {
    const r = postSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });
  test("a YAML Date object is normalised to the ISO string", () => {
    // Unquoted `date: 2026-07-01` arrives from YAML as a Date (UTC midnight).
    const r = postSchema.safeParse({ ...valid, date: new Date(Date.UTC(2026, 6, 1)) });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.date).toBe("2026-07-01");
  });
  test("a malformed date string fails", () => {
    expect(postSchema.safeParse({ ...valid, date: "01-07-2026" }).success).toBe(false);
  });
  test("a non-kebab slug fails", () => {
    expect(postSchema.safeParse({ ...valid, slug: "Not Kebab Case" }).success).toBe(false);
  });
  test("readMinutes <= 0 fails", () => {
    expect(postSchema.safeParse({ ...valid, readMinutes: 0 }).success).toBe(false);
  });
  test("a missing required field (excerpt) fails", () => {
    const { excerpt, ...noExcerpt } = valid;
    expect(postSchema.safeParse(noExcerpt).success).toBe(false);
  });
  test("an empty title fails", () => {
    expect(postSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });
});
