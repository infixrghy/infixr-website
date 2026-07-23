import { defineConfig } from "vitest/config";

// Fence test discovery to our test/ dir (same job the old bunfig.toml
// `[test] root` did for `bun test`): without this include, vitest's default
// glob would crawl the vendored Effect monorepo under repos/ (800+ suites,
// many failing — not ours) and vendor/. Mirrors tsconfig's `exclude: repos`.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // test/output/build.test.ts's beforeAll shells out to the real
    // `node build.ts` — give it headroom beyond the 10s hook default.
    hookTimeout: 30_000,
  },
});
