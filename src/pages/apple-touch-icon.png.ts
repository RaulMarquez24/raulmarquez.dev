import type { APIRoute } from 'astro';
import { renderIcon } from '../lib/icons';

/** iOS home-screen icon. Served at the root too, where iOS looks for it without a <link>. */
export const GET: APIRoute = async () =>
  new Response(await renderIcon(180, { fullBleed: true }), {
    headers: { 'Content-Type': 'image/png' },
  });
