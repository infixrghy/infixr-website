import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { join, extname } from "node:path";
import { stat } from "node:fs/promises";

// Serve the built site. Run `npm run build` first (or `npm run dev` which chains both).
const ROOT = join(import.meta.dirname, "public");
const PORT = Number(process.env.PORT ?? 8765);
// Loopback by default (not LAN-exposed). For on-device testing from a phone on the same
// Wi-Fi, opt in with `HOST=0.0.0.0 node server.ts` to bind all interfaces.
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

// Mirror GitHub Pages' extensionless resolution so the local mirror can't lie
// about which links work. For a clean URL `/about`, GH serves `about.html`; for
// `/blog` it serves `blog.html` EVEN THOUGH `blog/` is also a directory (the
// .html sibling wins). Resolve in GH's exact priority, serving the first hit at
// 200 with NO redirect (a trailing slash would shift the relative-link base and
// break resolution differently than production, making local tests lie):
//   1. public/about           literal file (assets, real .html)
//   2. public/about.html       the clean-URL page
//   3. public/blog/index.html  real dir-index, if one exists
const resolveFile = async (p: string): Promise<string | null> => {
  try {
    const s = await stat(p);
    return s.isDirectory() ? null : p;
  } catch {
    return null;
  }
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const base = join(ROOT, pathname);
    if (!base.startsWith(ROOT)) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("forbidden");
      return;
    }

    const hit =
      (await resolveFile(base)) ??
      (await resolveFile(base + ".html")) ??
      (await resolveFile(join(base, "index.html")));
    if (!hit) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }

    const type = TYPES[extname(hit).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
    createReadStream(hit).pipe(res);
  } catch {
    // Bad URL escape / unexpected IO error — never let an async throw escape the
    // handler (an unhandled rejection would crash the whole dev server).
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("internal error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`infiXR dev server: http://${HOST}:${PORT}`);
});
