import type { Point } from '@/lib/annotations/types';

export const CONTENT_INK = 'var(--sheet-ink)';

export interface Size {
  width: number;
  height: number;
}

export interface SheetBounds {
  width: number;
  height: number;
  padding: number;
}

export function clampWithin(bounds: SheetBounds, pos: Point, size: Size): Point {
  const maxX = Math.max(bounds.padding, bounds.width - size.width - bounds.padding);
  const maxY = Math.max(bounds.padding, bounds.height - size.height - bounds.padding);
  return {
    x: Math.min(maxX, Math.max(bounds.padding, pos.x)),
    y: Math.min(maxY, Math.max(bounds.padding, pos.y)),
  };
}

export function clampWidthWithin(
  bounds: SheetBounds | undefined,
  pos: Point,
  width: number,
): number {
  if (!bounds) return width;
  return Math.max(0, Math.min(width, bounds.width - bounds.padding - pos.x));
}
