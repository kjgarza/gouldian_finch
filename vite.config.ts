import path from "path"
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./", // Use relative paths for GitHub Pages compatibility
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
