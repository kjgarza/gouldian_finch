import path from "path"
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages compatibility
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
