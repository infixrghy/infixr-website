/**
 * content.config.ts — Astro content collections.
 *
 * One collection: `posts`, loaded from src/content/posts/*.md (the standard
 * Astro location for content collections). Front-matter is validated by
 * src/data/post-schema.ts; a bad or missing field fails the build with the
 * file named.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

import { postSchema } from "./data/post-schema.ts";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: postSchema,
});

export const collections = { posts };
