import { getStroke } from 'perfect-freehand';

interface Point {
  x: number;
  y: number;
}

export function brushOutline(points: number[], strokeWidth: number): number[] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push([points[i], points[i + 1]]);
  }
  return getStroke(pairs, {
    size: strokeWidth,
    thinning: 0.55,
    smoothing: 0.5,
    streamline: 0.5,
  }).flat();
}

export function outlineToPath(outline: number[]): string {
  if (outline.length < 4) return '';
  const count = outline.length;
  const segments = [`M ${outline[0]} ${outline[1]}`];
  for (let i = 0; i < count; i += 2) {
    const nextX = outline[(i + 2) % count];
    const nextY = outline[(i + 3) % count];
    segments.push(
      `Q ${outline[i]} ${outline[i + 1]} ${(outline[i] + nextX) / 2} ${(outline[i + 1] + nextY) / 2}`,
    );
  }
  segments.push('Z');
  return segments.join(' ');
}

export function arrowHeadPoints(from: Point, to: Point, strokeWidth: number): string {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const unitX = (to.x - from.x) / length;
  const unitY = (to.y - from.y) / length;
  const size = strokeWidth * 2.5;
  const baseX = to.x - unitX * size;
  const baseY = to.y - unitY * size;
  const halfWidth = size / 2;
  const leftX = baseX - unitY * halfWidth;
  const leftY = baseY + unitX * halfWidth;
  const rightX = baseX + unitY * halfWidth;
  const rightY = baseY - unitX * halfWidth;
  return `${to.x},${to.y} ${leftX},${leftY} ${rightX},${rightY}`;
}
