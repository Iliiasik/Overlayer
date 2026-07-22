import { describe, expect, it } from 'vitest';
import { ART_GRID_WIDTH, impressionPaper, renderArtPixels } from '../impression-art';

const WIDTH = ART_GRID_WIDTH;
const HEIGHT = 100;
const SURFACE = 1200;

describe('impressionPaper', () => {
  it('returns the paper color of each theme', () => {
    expect(impressionPaper('green')).toBe('#e9e2d0');
    expect(impressionPaper('blue')).toBe('#dfe8ee');
    expect(impressionPaper('space')).toBe('#3b98a0');
  });
});

describe('renderArtPixels', () => {
  it('produces an rgba buffer of the requested size', () => {
    const pixels = renderArtPixels(WIDTH, HEIGHT, SURFACE, 'green');
    expect(pixels).toHaveLength(WIDTH * HEIGHT * 4);
  });

  it('is deterministic for identical input', () => {
    const first = renderArtPixels(WIDTH, HEIGHT, SURFACE, 'space');
    const second = renderArtPixels(WIDTH, HEIGHT, SURFACE, 'space');
    expect(first).toEqual(second);
  });

  it('differs between themes', () => {
    const green = renderArtPixels(WIDTH, HEIGHT, SURFACE, 'green');
    const blue = renderArtPixels(WIDTH, HEIGHT, SURFACE, 'blue');
    expect(green).not.toEqual(blue);
  });

  it('cuts the arch in the bottom center but keeps the bottom corners opaque', () => {
    const pixels = renderArtPixels(WIDTH, HEIGHT, SURFACE, 'green');
    const alphaAt = (x: number, y: number) => pixels[(y * WIDTH + x) * 4 + 3];
    expect(alphaAt(Math.floor(WIDTH / 2), HEIGHT - 1)).toBe(0);
    expect(alphaAt(0, HEIGHT - 1)).toBe(255);
    expect(alphaAt(WIDTH - 1, HEIGHT - 1)).toBe(255);
    expect(alphaAt(Math.floor(WIDTH / 2), 0)).toBe(255);
  });

  it('renders a full-page frame well inside a frame budget', () => {
    renderArtPixels(WIDTH, 260, SURFACE, 'green');
    const runs = 5;
    const started = performance.now();
    for (let run = 0; run < runs; run++) {
      renderArtPixels(WIDTH, 260, SURFACE, run % 2 === 0 ? 'blue' : 'space');
    }
    const average = (performance.now() - started) / runs;
    expect(average).toBeLessThan(250);
  });
});
