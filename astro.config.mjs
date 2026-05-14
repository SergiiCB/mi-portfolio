import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://sergicb.netlify.app',

  vite: {
    plugins: [tailwindcss()],
  },
});