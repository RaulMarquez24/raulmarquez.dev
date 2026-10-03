import tokens from '../styles/tokens.css?raw';

/**
 * The dark-theme colour tokens as hex, for places that can't read CSS variables: the social
 * preview images and the web app manifest. Read from tokens.css, so they never drift.
 */
export const darkPalette: Record<string, string> = (() => {
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
