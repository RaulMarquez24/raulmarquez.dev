// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://raulmarquez.dev',
  // Static folders are served as /about/ — canonical, hreflang and sitemap all agree on it.
  trailingSlash: 'always',

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en-US' } },
    }),
  ],

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter Tight',
      cssVariable: '--font-inter-tight',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
    // resvg (OG images, build time only) is a native module: Vite must neither pre-bundle it nor
    // bundle it for the server, or dependency optimisation fails and the dev page never loads.
    optimizeDeps: { exclude: ['@resvg/resvg-js'] },
    ssr: { external: ['@resvg/resvg-js'] },
  },
});
