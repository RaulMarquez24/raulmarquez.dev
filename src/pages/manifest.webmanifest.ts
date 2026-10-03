import type { APIRoute } from 'astro';
import { defaultLocale, pick } from '../i18n/ui';
import { getProfile } from '../lib/content';
import { pngIcons } from '../lib/icons';
import { darkPalette } from '../lib/palette';

/** Web app manifest: name and icons for "Add to home screen", in the site's dark colours. */
export const GET: APIRoute = async () => {
  const profile = await getProfile();
  const manifest = {
    name: `${profile.name} — ${pick(profile.role, defaultLocale)}`,
    short_name: profile.name,
    lang: defaultLocale,
    start_url: '/',
    display: 'browser',
    background_color: darkPalette.bg,
    theme_color: darkPalette.bg,
    icons: pngIcons
      .filter((icon) => icon.size >= 192)
      .map((icon) => ({
        src: `/icons/${icon.name}.png`,
        sizes: `${icon.size}x${icon.size}`,
        type: 'image/png',
        purpose: icon.fullBleed ? 'maskable' : 'any',
      })),
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
