import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage } from "node:http";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      watch: {
        // Capacitor/Android build trees contain thousands of files and exhaust inotify.
        ignored: [
          "**/android/**",
          "**/dist/**",
          "**/.git/**",
        ],
      },
    },
    plugins: [
      {
        name: "r2-upload-url-dev-proxy",
        enforce: "pre",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const pathname = req.url?.split("?")[0] || "";
            if (pathname !== "/api/r2-upload-url") {
              return next();
            }

            const sendJson = (status: number, obj: Record<string, unknown>) => {
              res.statusCode = status;
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.end(JSON.stringify(obj));
            };

            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
              res.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, apikey",
              );
              res.end();
              return;
            }

            if (req.method !== "POST") {
              sendJson(405, { error: "Method not allowed" });
              return;
            }

            try {
              const { createR2PresignedUpload } = await import("./lib/r2-presign");
              const raw = await readBody(req as IncomingMessage);
              const body = JSON.parse(raw || "{}") as Record<string, unknown>;
              const result = await createR2PresignedUpload({
                env,
                authorizationHeader: String(req.headers.authorization || ""),
                body,
              });
              sendJson(result.status, result.body);
            } catch {
              sendJson(500, { error: "R2 upload URL proxy error" });
            }
          });
        },
      },
      {
        name: "vercel-ai-dev-proxy",
        enforce: "pre",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const pathname = req.url?.split("?")[0] || "";
            if (pathname !== "/api/ai") {
              return next();
            }

            const sendJson = (status: number, obj: Record<string, unknown>) => {
              res.statusCode = status;
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.end(JSON.stringify(obj));
            };

            if (req.method === "OPTIONS") {
              res.statusCode = 204;
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "Content-Type");
              res.end();
              return;
            }

            if (req.method !== "POST") {
              sendJson(405, { error: "Method not allowed" });
              return;
            }

            const apiKey = env.VERCEL_AI_API_KEY?.trim();
            if (!apiKey) {
              sendJson(503, {
                error: "AI gateway not configured (set VERCEL_AI_API_KEY in .env)",
              });
              return;
            }

            try {
              const raw = await readBody(req as IncomingMessage);
              const body = JSON.parse(raw || "{}") as {
                messages?: unknown;
                max_tokens?: number;
              };
              if (!Array.isArray(body.messages) || body.messages.length === 0) {
                sendJson(400, { error: "messages array required" });
                return;
              }
              const model = env.VERCEL_AI_GATEWAY_MODEL?.trim() || DEFAULT_MODEL;
              const upstream = await fetch(GATEWAY_URL, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model,
                  messages: body.messages,
                  max_tokens: body.max_tokens ?? 2048,
                }),
              });
              const data = (await upstream.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
                error?: { message?: string };
              };
              if (!upstream.ok) {
                sendJson(upstream.status, {
                  error: data.error?.message || upstream.statusText || "Gateway error",
                });
                return;
              }
              const text = data.choices?.[0]?.message?.content ?? "";
              if (!text) {
                sendJson(502, { error: "Empty model response" });
                return;
              }
              sendJson(200, { text });
            } catch {
              sendJson(500, { error: "AI proxy error" });
            }
          });
        },
      },
      // Make CSS non-render-blocking (preload + media=print swap) while keeping a tiny
      // critical baseline inline to avoid a flash of white background before CSS loads.
      {
        name: "non-blocking-css",
        enforce: "post",
        transformIndexHtml(html, ctx) {
          // Only transform for build output (avoid breaking dev HMR)
          if (ctx.server) return html;

          // Inline minimal critical CSS for first paint (background + text color).
          // This is intentionally tiny; full styling still comes from the main CSS bundle.
          const critical = `
<style>
  :root{--background:222 47% 6%;--foreground:210 40% 98%}
  html,body{background:hsl(var(--background));color:hsl(var(--foreground))}
  body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
</style>`;

          // Convert <link rel="stylesheet" href="/assets/*.css"> into:
          // 1) <link rel="preload" as="style" href="...">
          // 2) <link rel="stylesheet" href="..." media="print" onload="this.media='all'">
          const updated = html.replace(
            /<link([^>]*?)rel="stylesheet"([^>]*?)href="(\/assets\/[^"]+\.css)"([^>]*?)>/g,
            (_m, p1, p2, href, p4) => {
              return [
                `<link rel="preload" as="style" href="${href}">`,
                `<link${p1}rel="stylesheet"${p2}href="${href}"${p4} media="print" onload="this.media='all'">`,
              ].join("");
            }
          );

          // Inject critical CSS early in <head>
          return updated.replace("</head>", `${critical}\n</head>`);
        },
      },
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["ogl", "react-map-gl/mapbox", "mapbox-gl"],
    },
  };
});
