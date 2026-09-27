import { defaultLocale, type Locale } from '../i18n/ui';

/** Social preview images (Open Graph): one per page and locale, rendered at build time (og-card.tsx). */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Where a page's preview image lives: "/" → "/og/es/home.png", "/work/x" → "/og/en/work/x.png". */
export function ogImagePath(path: string, locale: Locale = defaultLocale): string {
  const page = path.split('/').filter(Boolean).join('/') || 'home';
  return `/og/${locale}/${page}.png`;
}
