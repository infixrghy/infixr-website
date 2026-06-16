import { serve } from "bun";
import { join, extname } from "node:path";
import { stat } from "node:fs/promises";

// Serve the built site. Run `bun run build.ts` first (or `bun run dev` which chains both).
const ROOT = join(import.meta.dir, "public");
const PORT = Number(process.env.PORT ?? 8765);
// Loopback by default (not LAN-exposed). For on-device testing from a phone on the same
// Wi-Fi, opt in with `HOST=0.0.0.0 bun run server.ts` to bind all interfaces.
const HOST = process.env.HOST ?? "127.0.0.1";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

const server = serve({
  port: PORT,
  hostname: HOST,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const base = join(ROOT, pathname);
    if (!base.startsWith(ROOT)) return new Response("forbidden", { status: 403 });

    // Mirror GitHub Pages' extensionless resolution so the local mirror can't lie
    // about which links work. For a clean URL `/about`, GH serves `about.html`; for
    // `/blog` it serves `blog.html` EVEN THOUGH `blog/` is also a directory (the
    // .html sibling wins). Resolve in GH's exact priority, serving the first hit at
    // 200 with NO redirect (a trailing slash would shift the relative-link base and
    // break resolution differently than production, making local tests lie):
    //   1. public/about           literal file (assets, real .html)
    //   2. public/about.html       the clean-URL page
    //   3. public/blog/index.html  real dir-index, if one exists
    const serveFile = async (p: string): Promise<Response | null> => {
      try {
        const s = await stat(p);
        if (s.isDirectory()) return null;
        const type = TYPES[extname(p).toLowerCase()] ?? "application/octet-stream";
        return new Response(Bun.file(p), {
          headers: { "content-type": type, "cache-control": "no-cache" },
        });
      } catch {
        return null;
      }
    };

    const res =
      (await serveFile(base)) ??
      (await serveFile(base + ".html")) ??
      (await serveFile(join(base, "index.html")));
    return res ?? new Response("not found", { status: 404 });
  },
});

console.log(`infiXR dev server: http://${server.hostname}:${server.port}`);
