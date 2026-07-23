/**
 * content.config.ts — Astro content collections.
 *
 * One collection: `posts`, loaded from the repo-root content/posts/*.md (the
 * SAME folder the site has always used — the blog-author workflow in README.md
 * is unchanged). Front-matter is validated by src/data/post-schema.ts; a bad
 * or missing field fails the build with the file named.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

import { postSchema } from "./data/post-schema.ts";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/posts" }),
  schema: postSchema,
});

export const collections = { posts };
