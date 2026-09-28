// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://pedro.tec.br',
  integrations: [sitemap({
    filter: (page) => {
      if (page.includes('/category/') || page.includes('/tag/')) return false;
      if (page.includes('/comments/') || page.endsWith('/feed/')) return false;
      if (page.includes('/404')) return false;
      if (page.includes('/mobile-a/') || page.includes('/mobile-b/')) return false;
      if (process.env.PUBLIC_ENABLE_EVENTS !== 'true' && page.endsWith('/events/')) return false;
      return true;
    },
  })],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: false,
    },
  },
});
