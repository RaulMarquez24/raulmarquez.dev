import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import type { ImageMetadata } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import tokens from '../styles/tokens.css?raw';
import { OG_HEIGHT, OG_WIDTH } from './og';

/** A page's social preview card, in the site's dark theme and with the dot-field signature. */
export interface OgCard {
  eyebrow: string;
  title: string;
  lead?: string;
  cover?: { src: ImageMetadata; background: string };
}

/** The dark-theme colour tokens, converted from OKLCH (tokens.css) to hex for satori. */
const palette = (() => {
  const dark = tokens.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? '';
  const colours: Record<string, string> = {};
  for (const [, name, l, c, h] of dark.matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g,
  )) {
    colours[name] = oklchToHex(Number(l), Number(c), Number(h));
  }
  return colours;
})();

function oklchToHex(l: number, c: number, h: number): string {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ];
  const [L, M, S] = lms;
  const linear = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  return `#${linear
    .map((x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055))
    .map((x) =>
      Math.round(Math.min(1, Math.max(0, x)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Same families as the site. satori reads woff, not woff2, so they come from Fontsource. */
const require = createRequire(import.meta.url);
const fontFile = (name: string) => readFile(require.resolve(`@fontsource/${name}`));
const fonts = Promise.all([
  fontFile('inter-tight/files/inter-tight-latin-400-normal.woff'),
  fontFile('inter-tight/files/inter-tight-latin-500-normal.woff'),
  fontFile('jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'),
]).then(([regular, medium, mono]) => [
  { name: 'Inter Tight', data: regular, weight: 400 as const },
  { name: 'Inter Tight', data: medium, weight: 500 as const },
  { name: 'JetBrains Mono', data: mono, weight: 400 as const },
]);

/**
 * The dot-field signature, still: a grid that fades towards the bottom, with the dots around a
 * focus point pushed aside and lit in the accent, as they are under the cursor on the site.
 */
function dotField(focus?: { x: number; y: number }): string {
  const spacing = 24;
  const reach = 190;
  let dots = '';
  for (let y = spacing / 2; y < OG_HEIGHT; y += spacing) {
    for (let x = spacing / 2; x < OG_WIDTH; x += spacing) {
      const dx = focus ? x - focus.x : 0;
      const dy = focus ? y - focus.y : 0;
      const distance = Math.hypot(dx, dy) || 1;
      const near = focus ? Math.max(0, 1 - distance / reach) : 0;
      const alpha = (0.16 + 0.6 * near) * Math.max(0, 1 - (y / OG_HEIGHT) * 1.15);
      if (alpha < 0.02) continue;
      const push = near * 12;
      dots += `<circle cx="${(x + (dx / distance) * push).toFixed(1)}" cy="${(y + (dy / distance) * push).toFixed(1)}" r="${(1.3 + near).toFixed(2)}" fill="${near > 0.2 ? palette.accent : palette.fg}" fill-opacity="${alpha.toFixed(3)}"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">${dots}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** A cover as a JPEG data URI (resvg doesn't read WebP or AVIF). */
async function coverDataUri(src: ImageMetadata): Promise<string | undefined> {
  const file = (src as ImageMetadata & { fsPath?: string }).fsPath;
  if (!file || src.format === 'svg') return undefined;
  const jpeg = await sharp(file).resize({ width: 1120 }).jpeg({ quality: 86 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

export async function renderOgImage({
  eyebrow,
  title,
  lead,
  cover,
}: OgCard): Promise<Uint8Array<ArrayBuffer>> {
  const coverUri = cover && (await coverDataUri(cover.src));
  const hasCover = Boolean(coverUri);
  const titleSize = hasCover ? 80 : title.length > 32 ? 76 : 96;

  const card = (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 72,
        backgroundColor: palette.bg,
        color: palette.fg,
        fontFamily: 'Inter Tight',
      }}
    >
      <img
        src={dotField(hasCover ? undefined : { x: 900, y: 210 })}
        width={OG_WIDTH}
        height={OG_HEIGHT}
        style={{ position: 'absolute', top: 0, left: 0 }}
        alt=""
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 500, letterSpacing: -0.6 }}>
          RMU<span style={{ color: palette.accent }}>.</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
            color: palette['fg-subtle'],
          }}
        >
          raulmarquez.dev
        </div>
      </div>

      {coverUri && (
        <div
          style={{
            position: 'absolute',
            right: 72,
            top: 168,
            display: 'flex',
            width: 520,
            height: 293,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: cover?.background,
            border: `1px solid ${palette.line}`,
          }}
        >
          <img src={coverUri} width={520} height={293} style={{ objectFit: 'cover' }} alt="" />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: hasCover ? 500 : 980 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'JetBrains Mono',
            fontSize: 22,
            color: palette['fg-subtle'],
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontSize: titleSize,
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: -0.04 * titleSize,
          }}
        >
          {title}
        </div>
        {lead && (
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: 28,
              lineHeight: 1.4,
              color: palette['fg-muted'],
            }}
          >
            {lead}
          </div>
        )}
      </div>
    </div>
  );

  const svg = await satori(card, { width: OG_WIDTH, height: OG_HEIGHT, fonts: await fonts });
  return new Uint8Array(
    new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng(),
  );
}
