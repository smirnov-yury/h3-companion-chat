import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";

function h3masterSitemapPlugin(): Plugin {
  return {
    name: "h3master-sitemap",
    apply: "build",
    async closeBundle() {
      try {
        const { generateSitemap } = await import("./scripts/generate-sitemap");
        await generateSitemap("dist");
      } catch (err) {
        console.warn(
          "[sitemap] Generation failed, continuing build without sitemap.xml:",
          err instanceof Error ? err.message : err,
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,otf}"],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [
          /^\/~oauth/,
          /^\/admin/,
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/,
        ],
        runtimeCaching: [
          {
            // Supabase REST API responses (data tables)
            urlPattern: ({ url }) =>
              url.hostname.endsWith("supabase.co") && url.pathname.startsWith("/rest/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-data",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase Storage images (component-media bucket etc.)
            urlPattern: ({ url }) =>
              url.hostname.endsWith("supabase.co") &&
              url.pathname.startsWith("/storage/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "component-images",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    h3masterSitemapPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
