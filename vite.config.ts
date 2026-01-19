import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
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
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['ogl', 'react-map-gl/mapbox', 'mapbox-gl'],
  },
}));
