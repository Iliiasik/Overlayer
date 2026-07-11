import { describe, expect, it } from 'vitest';
import {
  boardFitScale,
  centerOn,
  clampPointToBoard,
  clampScale,
  clampToBoard,
  DEFAULT_CAMERA,
  fitBounds,
  isDefaultCamera,
  MAX_SCALE,
  MIN_SCALE,
  panBy,
  toScreen,
  toWorld,
  viewportWorldBounds,
  zoomAt,
  zoomTo,
} from '../camera';

const VIEWPORT = { width: 800, height: 600 };

describe('coordinate conversion', () => {
  it('round-trips between world and screen', () => {
    const camera = { x: 120, y: -40, scale: 1.6 };
    const world = { x: 33, y: -7 };
    expect(toWorld(camera, toScreen(camera, world)).x).toBeCloseTo(world.x);
    expect(toWorld(camera, toScreen(camera, world)).y).toBeCloseTo(world.y);
  });

  it('is identity for the default camera', () => {
    expect(toWorld(DEFAULT_CAMERA, { x: 50, y: 60 })).toEqual({ x: 50, y: 60 });
  });
});

describe('clampScale', () => {
  it('keeps the scale within limits', () => {
    expect(clampScale(0.001)).toBe(MIN_SCALE);
    expect(clampScale(100)).toBe(MAX_SCALE);
    expect(clampScale(1)).toBe(1);
  });
});

describe('zoomAt', () => {
  it('keeps the point under the cursor fixed', () => {
    const camera = { x: 20, y: 30, scale: 1 };
    const cursor = { x: 400, y: 300 };
    const worldBefore = toWorld(camera, cursor);
    const zoomed = zoomAt(camera, cursor, 1.5);
    expect(zoomed.scale).toBeCloseTo(1.5);
    expect(toWorld(zoomed, cursor).x).toBeCloseTo(worldBefore.x);
    expect(toWorld(zoomed, cursor).y).toBeCloseTo(worldBefore.y);
  });

  it('clamps the resulting scale', () => {
    const zoomed = zoomAt(DEFAULT_CAMERA, { x: 0, y: 0 }, 1000);
    expect(zoomed.scale).toBe(MAX_SCALE);
  });
});

describe('zoomTo', () => {
  it('sets an absolute scale around the anchor point', () => {
    const camera = { x: -100, y: 50, scale: 0.5 };
    const anchor = { x: 200, y: 200 };
    const reset = zoomTo(camera, anchor, 1);
    expect(reset.scale).toBe(1);
    expect(toWorld(reset, anchor)).toEqual(toWorld(camera, anchor));
  });
});

describe('panBy', () => {
  it('shifts the camera offset', () => {
    expect(panBy({ x: 10, y: 20, scale: 2 }, -5, 8)).toEqual({ x: 5, y: 28, scale: 2 });
  });
});

describe('fitBounds', () => {
  it('fits and centers the content in the viewport', () => {
    const bounds = { x: 100, y: 100, width: 400, height: 200 };
    const camera = fitBounds(bounds, VIEWPORT);
    const view = viewportWorldBounds(camera, VIEWPORT);
    expect(view.x).toBeLessThanOrEqual(bounds.x);
    expect(view.y).toBeLessThanOrEqual(bounds.y);
    expect(view.x + view.width).toBeGreaterThanOrEqual(bounds.x + bounds.width);
    expect(view.y + view.height).toBeGreaterThanOrEqual(bounds.y + bounds.height);
    const centerScreen = toScreen(camera, {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    });
    expect(centerScreen.x).toBeCloseTo(VIEWPORT.width / 2);
    expect(centerScreen.y).toBeCloseTo(VIEWPORT.height / 2);
  });

  it('never zooms beyond the scale limits', () => {
    expect(fitBounds({ x: 0, y: 0, width: 2, height: 2 }, VIEWPORT).scale).toBe(MAX_SCALE);
    expect(fitBounds({ x: 0, y: 0, width: 1e6, height: 1e6 }, VIEWPORT).scale).toBe(MIN_SCALE);
  });
});

describe('centerOn', () => {
  it('puts the world point at the viewport center', () => {
    const camera = { x: 0, y: 0, scale: 2 };
    const centered = centerOn(camera, { x: 100, y: 50 }, VIEWPORT);
    expect(toScreen(centered, { x: 100, y: 50 })).toEqual({
      x: VIEWPORT.width / 2,
      y: VIEWPORT.height / 2,
    });
  });
});

describe('clampToBoard', () => {
  const BOARD = { width: 4000, height: 2400 };

  it('never zooms out beyond the board fit', () => {
    const clamped = clampToBoard({ x: 0, y: 0, scale: 0.01 }, VIEWPORT, BOARD);
    expect(clamped.scale).toBeCloseTo(boardFitScale(BOARD, VIEWPORT));
  });

  it('keeps the board edges within the viewport when zoomed in', () => {
    const clamped = clampToBoard({ x: 500, y: -99999, scale: 1 }, VIEWPORT, BOARD);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(VIEWPORT.height - BOARD.height);
  });

  it('centers the axis where the board is smaller than the viewport', () => {
    const viewport = { width: 800, height: 600 };
    const clamped = clampToBoard({ x: 0, y: 123, scale: 0.15 }, viewport, BOARD);
    expect(clamped.scale).toBeCloseTo(0.2);
    expect(clamped.y).toBeCloseTo((viewport.height - BOARD.height * 0.2) / 2);
  });

  it('ignores an unmeasured viewport', () => {
    const camera = { x: 3, y: 4, scale: 1 };
    expect(clampToBoard(camera, { width: 0, height: 0 }, BOARD)).toBe(camera);
  });
});

describe('clampPointToBoard', () => {
  it('clamps points into the board rectangle', () => {
    const board = { width: 100, height: 50 };
    expect(clampPointToBoard({ x: -10, y: 200 }, board)).toEqual({ x: 0, y: 50 });
    expect(clampPointToBoard({ x: 40, y: 20 }, board)).toEqual({ x: 40, y: 20 });
  });
});

describe('isDefaultCamera', () => {
  it('detects the unset camera', () => {
    expect(isDefaultCamera(DEFAULT_CAMERA)).toBe(true);
    expect(isDefaultCamera({ x: 0, y: 1, scale: 1 })).toBe(false);
  });
});
