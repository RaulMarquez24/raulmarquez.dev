import type { APIRoute } from 'astro';
import { icoSizes, renderIco } from '../lib/icons';

export const GET: APIRoute = async () =>
  new Response(await renderIco(icoSizes), { headers: { 'Content-Type': 'image/x-icon' } });
