import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static output: every page is prerendered; data is baked into /public/data.
// Deployed to GitHub Pages under /dexforge (ADR-011): site + base must match.
export default defineConfig({
  output: 'static',
  site: 'https://hell-over-studios.github.io',
  base: '/dexforge',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
