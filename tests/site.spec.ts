import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SITE = 'https://raulmarquez.dev';
const routes = ['/', '/about/', '/cv/', '/uses/', '/now/', '/work/traindia/', '/work/anakleta/'];
const locales = [
  { prefix: '', lang: 'es-ES' },
  { prefix: '/en', lang: 'en-US' },
];

for (const { prefix, lang } of locales) {
  for (const route of routes) {
    const url = `${prefix}${route}`;

    test(`${url} renders with lang, canonical, one h1 and no a11y violations`, async ({ page }) => {
      // axe audits the settled page: entrance and scroll animations would catch text mid-fade.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${url}`);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await response?.text(), 'internal TODO notes must not ship').not.toContain('TODO(');

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });

    test(`${url} has its own 1200×630 social preview image`, async ({ page, request }) => {
      await page.goto(url);
      const content = await page.locator('meta[property="og:image"]').getAttribute('content');
      const image = new URL(content ?? '');
      expect(image.origin).toBe(SITE);
      expect(image.pathname).toBe(`/og${prefix || '/es'}/${route.slice(1, -1) || 'home'}.png`);

      const response = await request.get(image.pathname);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
      const png = await response.body();
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    });
  }
}

test('the CV links to a PDF printed from it, in each language', async ({ page, request }) => {
  for (const prefix of ['', '/en']) {
    await page.goto(`${prefix}/cv/`);
    const link = page.locator('a[data-cv-pdf]');
    await expect(link).toHaveAttribute('href', `${prefix}/cv.pdf`);
    await expect(link).toHaveAttribute('download', 'Raul-Marquez-Urbano-CV.pdf');

    const response = await request.get(`${prefix}/cv.pdf`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  }
});

/** Every case study whose frontmatter says `draft: true`, read straight from the content files. */
const drafts = ['es', 'en'].flatMap((locale) => {
  const dir = join('src/content/projects', locale);
  return readdirSync(dir)
    .filter((file) =>
      /^draft:\s*true\s*$/m.test(readFileSync(join(dir, file), 'utf8').split('---')[1] ?? ''),
    )
    .map((file) => ({ prefix: locale === 'es' ? '' : '/en', slug: file.replace(/\.mdx?$/, '') }));
});

test('drafts never reach the production build', async ({ page }) => {
  for (const { prefix, slug } of drafts) {
    const response = await page.goto(`${prefix}/work/${slug}/`);
    expect(response?.status()).toBe(404);

    await page.goto(`${prefix}/`);
    await expect(page.locator(`a[href="${prefix}/work/${slug}/"]`)).toHaveCount(0);
  }
});

test('Renterus has no case-study page and links to its own site', async ({ page }) => {
  for (const prefix of ['', '/en']) {
    const response = await page.goto(`${prefix}/work/renterus/`);
    expect(response?.status()).toBe(404);

    await page.goto(`${prefix}/`);
    const row = page.locator('#work a[href="https://renterus.com"]');
    await expect(row).toHaveCount(1);
    await expect(row).toHaveAttribute('target', '_blank');
  }
});

test('roles at the same company are grouped, like a promotion on LinkedIn', async ({ page }) => {
  await page.goto('/cv/');
  const renterus = page.locator('li', {
    has: page.locator('h3', { hasText: 'Renterus Software S.L.' }),
  });
  await expect(renterus).toHaveCount(1);
  await expect(renterus.locator('h4')).toHaveText([
    'Tech Lead & Lead Developer',
    'Full Stack Developer',
  ]);
});

test('home loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.mouse.move(400, 300);
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});

test('the dot field signature is decorative and draws into the hero', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas[data-dot-field]');
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');
  await expect
    .poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width))
    .toBeGreaterThan(0);
});

test('home never overflows horizontally on scaled screens', async ({ browser }) => {
  for (const viewport of [
    { width: 1269, height: 900 },
    { width: 375, height: 812 },
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1.5 });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    await context.close();
  }
});

test('hovering a project shows its cover next to the cursor', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch devices have no hover preview');
  await page.goto('/');
  const preview = page.locator('[data-work-preview]');
  const row = page.locator('[data-work-row="1"]');
  await row.scrollIntoViewIfNeeded();
  const box = await row.boundingBox();
  if (!box) throw new Error('work row not rendered');

  await page.mouse.move(box.x + 200, box.y + box.height / 2);
  await expect(preview).toHaveAttribute('data-visible', 'true');
  await expect(preview.locator('[data-cover="1"]')).toHaveCSS('opacity', '1');

  await page.mouse.move(box.x + 200, box.y - 400);
  await expect(preview).toHaveAttribute('data-visible', 'false');
});

test('case studies open with a 16:9 cover showing the project image', async ({ page }) => {
  for (const [url, alt] of [
    ['/work/traindia/', /Traindía/],
    ['/work/anakleta/', /Añakleta/],
  ] as const) {
    await page.goto(url);
    const hero = page.locator('article .project-cover');
    await expect(hero).toHaveCount(1);
    const box = await hero.boundingBox();
    expect(Math.round(((box?.width ?? 0) / (box?.height ?? 1)) * 100) / 100).toBeCloseTo(16 / 9, 1);
    const image = hero.getByRole('img', { name: alt });
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test('external links inside case studies open in a new tab', async ({ page }) => {
  for (const [url, name] of [
    ['/work/anakleta/', 'política de contenido de fans'],
    ['/en/work/anakleta/', 'Fan Content Policy'],
  ] as const) {
    await page.goto(url);
    const link = page.locator('.prose-content a', { hasText: name });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
  }
});

test('the Renterus logo swaps variant with the theme', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The hover preview only exists with a mouse');
  await page.goto('/');
  const cover = page.locator('[data-cover="0"]');
  const display = (selector: string) =>
    cover.locator(selector).evaluate((img) => getComputedStyle(img).display);

  expect(await display('img.theme-dark-only')).not.toBe('none');
  expect(await display('img.theme-light-only')).toBe('none');

  await page.getByRole('button', { name: 'Cambiar tema' }).click();
  await expect.poll(() => display('img.theme-light-only')).not.toBe('none');
  expect(await display('img.theme-dark-only')).toBe('none');
});

test('opening a project from its preview morphs only that cover', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The hover preview only exists with a mouse');
  // Logs the view-transition names on the page once loaded, and again at the moment of leaving
  // it (listening from `load` on, so the page's own pageswap handlers have already run).
  await page.addInitScript(() => {
    const report = (moment: string) => {
      const names = [...document.querySelectorAll('*')]
        .map((element) => getComputedStyle(element).viewTransitionName)
        .filter((name) => name !== 'none' && name !== 'root');
      console.log(`${moment}:${names.join(',')}`);
    };
    addEventListener('load', () => {
      report('load');
      addEventListener('pageswap', () => report('pageswap'));
    });
  });
  const reports: string[] = [];
  page.on('console', (message) => reports.push(message.text()));

  await page.goto('/');
  const row = page.locator('[data-work-row="1"]');
  await row.scrollIntoViewIfNeeded();
  const box = await row.boundingBox();
  if (!box) throw new Error('work row not rendered');
  await page.mouse.move(box.x + 200, box.y + box.height / 2);
  await expect(page.locator('[data-work-preview]')).toHaveAttribute('data-visible', 'true');

  await page.mouse.click(box.x + 200, box.y + box.height / 2);
  await expect(page).toHaveURL(/\/work\/traindia\/$/);
  await expect
    .poll(() => reports.filter((line) => /^(load|pageswap):/.test(line)))
    .toEqual(['load:', 'pageswap:cover-traindia', 'load:cover-traindia']);
});

test('with motion, openings and scroll reveals settle fully visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCSS('opacity', '1');

  const contact = page.locator('section[aria-labelledby="contact-title"]');
  await contact.scrollIntoViewIfNeeded();
  await expect(contact).toHaveCSS('opacity', '1');
});

test('the contact email can be copied, with a confirmation', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copiar el email' }).click();
  await expect(page.getByRole('status')).toHaveText('Copiado');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('me@raulmarquez.dev');
});

test('with reduced motion the dot field still renders', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const canvas = page.locator('canvas[data-dot-field]');
  await expect
    .poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width))
    .toBeGreaterThan(0);
  await context.close();
});

test('unknown routes serve the 404 page', async ({ page }) => {
  const response = await page.goto('/this-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Página no encontrada');
});

test('language switch opens the same page in the other locale', async ({ page }) => {
  await page.goto('/cv/');
  await page.getByRole('link', { name: 'Read this page in English' }).click();
  await expect(page).toHaveURL(/\/en\/cv\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');

  await page.getByRole('link', { name: 'Leer esta página en español' }).click();
  await expect(page).toHaveURL(/\/cv\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-ES');
});

test('theme is dark by default, toggles, persists and stays accessible', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Cambiar tema' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect
    .poll(() => html.evaluate((root) => root.hasAttribute('data-theme-switching')))
    .toBe(false);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test('home exposes structured data for the person', async ({ page }) => {
  await page.goto('/');
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(json ?? '{}');
  expect(data['@type']).toBe('Person');
  expect(data.name).toBe('Raúl Márquez Urbano');
});
