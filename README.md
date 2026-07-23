# InfiXR website

Static site for **[infixr.com](https://infixr.com/)**. Pages are built from source by GitHub Actions and deployed to GitHub Pages automatically on every push — you never upload files anywhere by hand.

Blog posts live as plain-text Markdown files. Adding one file and pushing it publishes a new post everywhere it appears: the blog index at `/blog`, its own page at `/blog/<slug>`, and (if it's the newest) the featured cards on the homepage and at the top of the blog page. **The newest `date` always leads** — publishing a new post automatically makes it the featured one.

## Writing a new blog post

### 1. Create the file

Add one file in the `content/posts/` folder, named after the post's URL slug:

```
content/posts/my-new-post.md
```

The filename (minus `.md`) should match the `slug` field below. The post's address becomes `infixr.com/blog/my-new-post`.

### 2. Fill in the front-matter

Every post starts with a block between two `---` lines. **All six fields are required** — the build refuses to publish a post with a missing or malformed field (you get an error naming the file instead of a broken page going live).

```markdown
---
title: "My New Post"
date: 2026-08-01
readMinutes: 4
category: Perspective
slug: my-new-post
excerpt: One or two sentences summarising the post. This text appears on the blog cards and in search results, so make it count.
---
```

| Field | Rules |
|---|---|
| `title` | The headline. Keep it in double quotes. |
| `date` | Publish date, exactly `YYYY-MM-DD`. Decides ordering — newest post leads the blog page and homepage. |
| `readMinutes` | Estimated reading time, a whole number above 0 (roughly one minute per 200 words). |
| `category` | Section label shown with the post, e.g. `Perspective` or `Engineering`. |
| `slug` | The URL part. Lowercase letters, numbers, and hyphens only (`my-new-post` — no spaces, no capitals). |
| `excerpt` | One-paragraph summary for cards + search description. |

### 3. Write the body

Everything below the closing `---` is the article, in ordinary Markdown:

```markdown
Regular paragraphs are just text with a blank line between them.

## A section heading

**Bold**, *italic*, and [links](https://example.com) work as usual.

- Bullet lists too
```

Look at the existing files in `content/posts/` for real examples — copying one and rewriting it is the easiest way to start.

## Previewing on your computer (optional but recommended)

One-time setup: install [Node.js](https://nodejs.org) (version 24 or newer), then in the project folder run:

```
npm install
```

Then, whenever you want to preview:

```
npm run dev
```

Open <http://localhost:8765/blog> in your browser and check your post. The preview updates live as you edit and save the file. Press `Ctrl+C` in the terminal to stop it.

If the page shows an error instead — read it; it names the file and field that's wrong (usually a typo in the front-matter). Fix the file and the page reloads by itself.

## Publishing

Commit the new file and push. That's the whole deployment:

```
git add content/posts/my-new-post.md
git commit -m 'feat(blog): add "My New Post" post'
git push
```

Commit message template — swap in your post title, keep the shape:

```
feat(blog): add "Why Northeast India's XR Moment is Now" post
```

(Removing a post is the same flow: delete the file, commit with `feat(blog): remove the <slug> post`, push.)

After `git push`, GitHub Actions builds and deploys automatically — the post is live on infixr.com in about 1–2 minutes. If it doesn't appear, do a hard refresh (`Ctrl+Shift+R`), then check the repo's **Actions** tab on GitHub for a red ✗ — a failed build means a front-matter error; the log names the file.

## Rules

- Only touch `content/posts/` for blog work. The `dist/` folder is generated output — never edit it (it's rebuilt from scratch on every push, and any hand edit is silently lost). The `public/` folder holds the site's images, fonts, and scripts — leave it alone for blog work.
- One file per post; the site handles everything else (index cards, homepage teaser, per-post page, ordering) from the front-matter.
- The site is built with [Astro](https://astro.build) — pages live in `src/pages/`, components in `src/components/`. Blog work never needs to touch them.
