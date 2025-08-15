import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages compatibility
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
