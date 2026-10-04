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

/**
 * /favicon.ico with the given sizes, each stored as PNG inside the ICO container. Many clients
 * request /favicon.ico without reading the page, and Google wants a multiple of 48 px.
 */
export async function renderIco(sizes: readonly number[]): Promise<Uint8Array<ArrayBuffer>> {
  const images = await Promise.all(sizes.map((size) => renderIcon(size)));
  const header = 6 + 16 * images.length;
  const ico = new Uint8Array(header + images.reduce((total, png) => total + png.length, 0));
  const view = new DataView(ico.buffer);
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, images.length, true);
  let offset = header;
  images.forEach((png, i) => {
    const entry = 6 + 16 * i;
    view.setUint8(entry, sizes[i] % 256); // 0 means 256
    view.setUint8(entry + 1, sizes[i] % 256);
    view.setUint16(entry + 4, 1, true); // colour planes
    view.setUint16(entry + 6, 32, true); // bits per pixel
    view.setUint32(entry + 8, png.length, true);
    view.setUint32(entry + 12, offset, true);
    ico.set(png, offset);
    offset += png.length;
  });
  return ico;
}

export const icoSizes = [32, 48] as const;

/** PNG icons published under /icons/, also listed in the web app manifest. */
export const pngIcons = [
  { name: 'icon-192', size: 192, fullBleed: false },
  { name: 'icon-512', size: 512, fullBleed: false },
  { name: 'icon-maskable-512', size: 512, fullBleed: true },
] as const;
