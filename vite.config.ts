import path from "path"
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/gouldian_finch/", // GitHub Pages deployment path
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [tailwindcss()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
