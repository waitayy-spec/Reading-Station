import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["rabbit.svg", "book.svg", "icon-192.svg", "icon-512.svg"],
      manifest: {
        name: "儿童阅读打卡",
        short_name: "阅读打卡",
        theme_color: "#FFE8A3",
        background_color: "#FFF8DC",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true
      }
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    // 临时外网隧道（loca.lt）访问时需要放行 Host
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true
      }
    }
  }
});
