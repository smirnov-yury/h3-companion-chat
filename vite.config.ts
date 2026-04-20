import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,otf}"],
        navigateFallbackDenylist: [/^\/~oauth/, /^\/admin/],
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
            handler: "CacheFirst",
            options: {
              cacheName: "component-images",
              expiration: {
                maxEntries: 500,
                // No maxAgeSeconds — keep cached images indefinitely
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
