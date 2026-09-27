// Prints the CV pages of the build to PDF, so the PDF always matches the site's data.
// Runs after `astro build` (see package.json) and needs Playwright's Chromium
// (`pnpm exec playwright install chromium`). Every page with a `[data-cv-pdf]` link is printed
// to the path that link points to. The build is served straight from dist/, with no server.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const dist = new URL('../dist/', import.meta.url);
const origin = 'http://build.localhost';
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

const pages = [];
for (const file of await readdir(dist, { recursive: true })) {
  const path = file.replaceAll('\\', '/');
  if (!path.endsWith('index.html')) continue;
  if ((await readFile(new URL(path, dist), 'utf8')).includes('data-cv-pdf')) {
    pages.push(`/${path.replace(/index\.html$/, '')}`);
  }
}
if (pages.length === 0) throw new Error('No page in dist/ links to a CV PDF ([data-cv-pdf])');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route(`${origin}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    const file = decodeURI(pathname.endsWith('/') ? `${pathname}index.html` : pathname);
    try {
      const body = await readFile(new URL(`.${file}`, dist));
      await route.fulfill({
        body,
        contentType: types[extname(file)] ?? 'application/octet-stream',
      });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });

  for (const path of pages) {
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const target = await page.locator('[data-cv-pdf]').first().getAttribute('href');
    const title = await page.title();
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true,
    });
    const out = new URL(`.${target}`, dist);
    await writeFile(out, pdf);
    console.log(`cv-pdf: ${path} → ${fileURLToPath(out)} (${title})`);
  }
} finally {
  await browser.close();
}
