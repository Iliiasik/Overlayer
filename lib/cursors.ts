const INK = '#111827';
const HALO = '#ffffff';

function svgCursor(body: string, hotspotX: number, hotspotY: number, fallback: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspotX} ${hotspotY}, ${fallback}`;
}

function haloGlyph(path: string): string {
  return (
    `<path d="${path}" fill="${HALO}" stroke="${HALO}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="${path}" fill="${INK}"/>`
  );
}

const ARROW_PATH = 'M5.6 2.8v16.6l4.1-3.9 2.4 5.5 2.9-1.2-2.4-5.5h5.8Z';
const PEN_PATH = 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z';
const ERASER_PATH =
  'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7Z';

export const CURSORS = {
  arrow: svgCursor(haloGlyph(ARROW_PATH), 5, 3, 'default'),
  pen: svgCursor(haloGlyph(PEN_PATH), 2, 22, 'crosshair'),
  crosshair: svgCursor(
    `<path d="M12 3.5v17M3.5 12h17" stroke="${HALO}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M12 3.5v17M3.5 12h17" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
    12,
    12,
    'crosshair',
  ),
  add: svgCursor(
    `<circle cx="12" cy="12" r="9.5" fill="${HALO}"/>` +
      `<circle cx="12" cy="12" r="8" fill="${INK}"/>` +
      `<path d="M12 8v8M8 12h8" stroke="${HALO}" stroke-width="2" stroke-linecap="round"/>`,
    12,
    12,
    'copy',
  ),
  eraser: svgCursor(
    `<path d="${ERASER_PATH}" fill="${HALO}" stroke="${HALO}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="${ERASER_PATH}" fill="${INK}"/>` +
      `<path d="m5.5 11.5 7 7" stroke="${HALO}" stroke-width="1.8"/>`,
    4,
    19,
    'cell',
  ),
  remove: svgCursor(
    `<circle cx="12" cy="12" r="9.5" fill="${HALO}"/>` +
      `<circle cx="12" cy="12" r="8" fill="${INK}"/>` +
      `<path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" stroke="${HALO}" stroke-width="2" stroke-linecap="round"/>`,
    12,
    12,
    'not-allowed',
  ),
} as const;
