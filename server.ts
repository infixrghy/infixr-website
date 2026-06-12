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

    const filePath = join(ROOT, pathname);
    if (!filePath.startsWith(ROOT)) return new Response("forbidden", { status: 403 });

    try {
      const s = await stat(filePath);
      if (s.isDirectory()) return Response.redirect(url.pathname + "/", 301);
      const file = Bun.file(filePath);
      const type = TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
      return new Response(file, {
        headers: {
          "content-type": type,
          "cache-control": "no-cache",
        },
      });
    } catch {
      return new Response("not found", { status: 404 });
    }
  },
});

console.log(`infiXR dev server: http://${server.hostname}:${server.port}`);
