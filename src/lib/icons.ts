import sharp from 'sharp';
import icon from '../assets/icon.svg?raw';

/** The site icon, from one source (src/assets/icon.svg): the SVG favicon and every PNG size. */
export const iconSvg = icon;

/**
 * The icon as a PNG of `size`×`size`, rasterised at that size (not scaled up from 32 px).
 * `fullBleed` drops the rounded corners: iOS and maskable Android icons apply their own mask,
 * and transparent corners would show up as black.
 */
export async function renderIcon(
  size: number,
  { fullBleed = false } = {},
): Promise<Uint8Array<ArrayBuffer>> {
  const svg = fullBleed ? icon.replace(/\s+rx="[\d.]+"/, '') : icon;
  const viewBoxWidth = Number(icon.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/)?.[1] ?? 32);
  const png = await sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / viewBoxWidth) })
    .resize(size, size)
    .png()
    .toBuffer();
  return new Uint8Array(png);
}

/** PNG icons published under /icons/, also listed in the web app manifest. */
export const pngIcons = [
  { name: 'favicon-32', size: 32, fullBleed: false },
  { name: 'icon-192', size: 192, fullBleed: false },
  { name: 'icon-512', size: 512, fullBleed: false },
  { name: 'icon-maskable-512', size: 512, fullBleed: true },
] as const;
