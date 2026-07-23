import { defineConfig } from "vitest/config";

// Fence test discovery to our test/ dir: without this include, vitest's
// default glob would crawl the vendored Effect monorepo under repos/ (800+
// suites, many failing — not ours) and vendor/. Mirrors tsconfig's exclude.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // test/output/build.test.ts's beforeAll shells out to the real
    // `astro build` — give it headroom beyond the 10s hook default
    // (a cold CI build can take a while).
    hookTimeout: 120_000,
  },
});
