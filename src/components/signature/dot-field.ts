/**
 * Signature interaction: a field of dots that breathes slowly and parts around the cursor,
 * lighting up in the accent colour. Canvas 2D, no dependencies.
 *
 * - Pauses when off-screen or when the tab is hidden.
 * - With prefers-reduced-motion it draws a still field and ignores the pointer.
 * - Colours come from the design tokens (--fg, --accent) and follow theme changes.
 */

interface Options {
  /** Distance between dots, in CSS pixels. */
  spacing: number;
  /** Radius of the cursor's influence. */
  radius: number;
  /** How far dots are pushed away at the centre of the influence. */
  push: number;
}

const DEFAULTS: Options = { spacing: 22, radius: 150, push: 18 };
/** Dots are batched into a few alpha levels so each frame is a handful of fills, not thousands. */
const ALPHA_LEVELS = 12;
const TAU = Math.PI * 2;

export function mountDotField(canvas: HTMLCanvasElement, options: Partial<Options> = {}) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const { spacing, radius, push } = { ...DEFAULTS, ...options };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  let width = 0;
  let height = 0;
  let colors = readColors();
  let visible = true;
  let running = false;
  let time = 0;
  let lastFrame = 0;

  const pointer = { x: 0, y: 0, inside: false };
  /** Eased copy of the pointer: gives the field its fluid, slightly delayed response. */
  const focus = { x: 0, y: 0, strength: 0 };

  function readColors() {
    const styles = getComputedStyle(canvas);
    return {
      base: styles.getPropertyValue('--fg').trim() || '#ededef',
      accent: styles.getPropertyValue('--accent').trim() || '#ff6a3d',
    };
  }

  /** The canvas fills its parent; measuring the parent (never the canvas) rules out a resize feedback loop. */
  const host = canvas.parentElement ?? canvas;

  function resize() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const still = reducedMotion.matches;
    const target = pointer.inside && !still ? 1 : 0;
    focus.strength += (target - focus.strength) * 0.08;
    if (pointer.inside) {
      focus.x += (pointer.x - focus.x) * 0.2;
      focus.y += (pointer.y - focus.y) * 0.2;
    }

    const base = Array.from({ length: ALPHA_LEVELS }, () => new Path2D());
    const lit = Array.from({ length: ALPHA_LEVELS }, () => new Path2D());
    const offset = spacing / 2;

    for (let gx = offset; gx < width; gx += spacing) {
      for (let gy = offset; gy < height; gy += spacing) {
        const wave = still ? 0 : Math.sin(gx * 0.018 + time) * Math.cos(gy * 0.022 + time * 0.8);
        const dx = gx - focus.x;
        const dy = gy - focus.y;
        const distance = Math.hypot(dx, dy) || 1;
        const linear = Math.max(0, 1 - distance / radius) * focus.strength;
        const influence = linear * linear * (3 - 2 * linear);

        const x = gx + (dx / distance) * influence * push;
        const y = gy + (dy / distance) * influence * push + wave * 2;
        const alpha = Math.min(1, 0.12 + (wave + 1) * 0.07 + influence * 0.8);
        const size = 0.9 + influence * 1.5;
        const level = Math.min(ALPHA_LEVELS - 1, Math.floor(alpha * ALPHA_LEVELS));
        const path = influence > 0.04 ? lit[level] : base[level];
        path.moveTo(x + size, y);
        path.arc(x, y, size, 0, TAU);
      }
    }

    ctx.clearRect(0, 0, width, height);
    for (let level = 0; level < ALPHA_LEVELS; level++) {
      ctx.globalAlpha = (level + 0.5) / ALPHA_LEVELS;
      ctx.fillStyle = colors.base;
      ctx.fill(base[level]);
      ctx.fillStyle = colors.accent;
      ctx.fill(lit[level]);
    }
    ctx.globalAlpha = 1;
  }

  function shouldRun() {
    return visible && !document.hidden && !reducedMotion.matches;
  }

  function tick(now: number) {
    const delta = lastFrame ? Math.min(now - lastFrame, 50) : 16;
    lastFrame = now;
    time += delta * 0.00075;
    draw();
    if (shouldRun()) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      lastFrame = 0;
    }
  }

  function start() {
    if (running || !shouldRun()) return;
    running = true;
    requestAnimationFrame(tick);
  }

  function refresh() {
    if (shouldRun()) start();
    else draw();
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      const wasInside = pointer.inside;
      pointer.inside =
        pointer.x >= 0 && pointer.x <= rect.width && pointer.y >= 0 && pointer.y <= rect.height;
      if (pointer.inside && !wasInside && focus.strength < 0.01) {
        focus.x = pointer.x;
        focus.y = pointer.y;
      }
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.inside = false;
  });

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    refresh();
  }).observe(canvas);
  new MutationObserver(() => {
    colors = readColors();
    draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener('change', refresh);

  resize();
  start();
}
