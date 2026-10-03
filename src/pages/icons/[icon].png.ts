import type { APIRoute, GetStaticPaths } from 'astro';
import { pngIcons, renderIcon } from '../../lib/icons';

export const getStaticPaths = (() =>
  pngIcons.map((icon) => ({ params: { icon: icon.name }, props: icon }))) satisfies GetStaticPaths;

export const GET: APIRoute<(typeof pngIcons)[number]> = async ({ props }) =>
  new Response(await renderIcon(props.size, { fullBleed: props.fullBleed }), {
    headers: { 'Content-Type': 'image/png' },
  });
