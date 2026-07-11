import type { Point } from '@/lib/annotations/types';

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, scale: 1 };
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 1.2;
const FIT_PADDING = 64;

export const BOARD_SIZE: Size = { width: 4000, height: 2400 };

export function isDefaultCamera(camera: Camera): boolean {
  return camera.x === 0 && camera.y === 0 && camera.scale === 1;
}

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function toWorld(camera: Camera, screen: Point): Point {
  return { x: (screen.x - camera.x) / camera.scale, y: (screen.y - camera.y) / camera.scale };
}

export function toScreen(camera: Camera, world: Point): Point {
  return { x: world.x * camera.scale + camera.x, y: world.y * camera.scale + camera.y };
}

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, x: camera.x + dx, y: camera.y + dy };
}

export function zoomTo(camera: Camera, screen: Point, scale: number): Camera {
  const next = clampScale(scale);
  const world = toWorld(camera, screen);
  return {
    x: screen.x - world.x * next,
    y: screen.y - world.y * next,
    scale: next,
  };
}

export function zoomAt(camera: Camera, screen: Point, factor: number): Camera {
  return zoomTo(camera, screen, camera.scale * factor);
}

export function centerOn(camera: Camera, world: Point, viewport: Size): Camera {
  return {
    ...camera,
    x: viewport.width / 2 - world.x * camera.scale,
    y: viewport.height / 2 - world.y * camera.scale,
  };
}

export function fitBounds(bounds: Bounds, viewport: Size, padding = FIT_PADDING): Camera {
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const scale = clampScale(
    Math.min(
      availableWidth / Math.max(1, bounds.width),
      availableHeight / Math.max(1, bounds.height),
    ),
  );
  return {
    x: (viewport.width - bounds.width * scale) / 2 - bounds.x * scale,
    y: (viewport.height - bounds.height * scale) / 2 - bounds.y * scale,
    scale,
  };
}

export function boardFitScale(board: Size, viewport: Size): number {
  return Math.min(
    MAX_SCALE,
    Math.min(viewport.width / board.width, viewport.height / board.height),
  );
}

function clampAxis(offset: number, viewportSize: number, contentSize: number): number {
  if (contentSize <= viewportSize) return (viewportSize - contentSize) / 2;
  return Math.min(0, Math.max(viewportSize - contentSize, offset));
}

export function clampToBoard(camera: Camera, viewport: Size, board: Size): Camera {
  if (viewport.width === 0 || viewport.height === 0) return camera;
  const scale = Math.min(MAX_SCALE, Math.max(boardFitScale(board, viewport), camera.scale));
  const anchor = { x: viewport.width / 2, y: viewport.height / 2 };
  const world = toWorld(camera, anchor);
  const scaled =
    scale === camera.scale
      ? camera
      : { x: anchor.x - world.x * scale, y: anchor.y - world.y * scale, scale };
  return {
    scale,
    x: clampAxis(scaled.x, viewport.width, board.width * scale),
    y: clampAxis(scaled.y, viewport.height, board.height * scale),
  };
}

export function clampPointToBoard(point: Point, board: Size, margin = 0): Point {
  return {
    x: Math.min(board.width - margin, Math.max(margin, point.x)),
    y: Math.min(board.height - margin, Math.max(margin, point.y)),
  };
}

export function viewportWorldBounds(camera: Camera, viewport: Size): Bounds {
  const origin = toWorld(camera, { x: 0, y: 0 });
  return {
    x: origin.x,
    y: origin.y,
    width: viewport.width / camera.scale,
    height: viewport.height / camera.scale,
  };
}
