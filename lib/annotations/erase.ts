import type { BrushAnnotation } from './types';

export const ERASE_RADIUS = 12;

function splitPoints(points: number[], x: number, y: number, radius: number): number[][] {
  const segments: number[][] = [];
  let current: number[] = [];
  let touched = false;
  for (let i = 0; i < points.length; i += 2) {
    const inside = Math.hypot(points[i] - x, points[i + 1] - y) <= radius;
    if (inside) {
      touched = true;
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    } else {
      current.push(points[i], points[i + 1]);
    }
  }
  if (current.length > 0) segments.push(current);
  return touched ? segments : [points];
}

export function eraseFromBrush(
  annotation: BrushAnnotation,
  x: number,
  y: number,
  radius = ERASE_RADIUS,
): BrushAnnotation[] | null {
  const segments = splitPoints(annotation.points, x, y, radius);
  if (segments.length === 1 && segments[0] === annotation.points) return null;
  const now = Date.now();
  return segments
    .filter((segment) => segment.length >= 4)
    .map((segment, index) => ({
      ...annotation,
      id: index === 0 ? annotation.id : crypto.randomUUID(),
      position: { x: segment[0], y: segment[1] },
      points: segment,
      updatedAt: now,
    }));
}
