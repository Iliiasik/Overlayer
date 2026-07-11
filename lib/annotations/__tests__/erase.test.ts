import { describe, expect, it } from 'vitest';
import { eraseFromBrush } from '../erase';
import type { BrushAnnotation } from '../types';

function stroke(points: number[]): BrushAnnotation {
  return {
    id: 'stroke-1',
    type: 'brush',
    points,
    position: { x: points[0], y: points[1] },
    style: { color: '#44624a', strokeWidth: 6, opacity: 1 },
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('eraseFromBrush', () => {
  it('returns null when the eraser does not touch the stroke', () => {
    const result = eraseFromBrush(stroke([0, 0, 10, 0, 20, 0]), 100, 100, 12);
    expect(result).toBeNull();
  });

  it('removes the whole stroke when every point is inside the radius', () => {
    const result = eraseFromBrush(stroke([0, 0, 2, 0, 4, 0]), 2, 0, 12);
    expect(result).toEqual([]);
  });

  it('splits a stroke into two segments when erased in the middle', () => {
    const points = Array.from({ length: 20 }, (_, i) => [i * 10, 0]).flat();
    const result = eraseFromBrush(stroke(points), 100, 0, 12);
    expect(result).toHaveLength(2);
    expect(result![0].points.at(-2)).toBeLessThan(90);
    expect(result![1].points[0]).toBeGreaterThan(110);
  });

  it('keeps the original id for the first segment', () => {
    const points = Array.from({ length: 20 }, (_, i) => [i * 10, 0]).flat();
    const result = eraseFromBrush(stroke(points), 100, 0, 12);
    expect(result![0].id).toBe('stroke-1');
    expect(result![1].id).not.toBe('stroke-1');
  });

  it('drops single-point segments that are too short to render', () => {
    const result = eraseFromBrush(stroke([0, 0, 10, 0, 20, 0]), 10, 0, 5);
    expect(result).toEqual([]);
  });

  it('keeps segments that still have at least two points', () => {
    const points = Array.from({ length: 6 }, (_, i) => [i * 10, 0]).flat();
    const result = eraseFromBrush(stroke(points), 25, 0, 6);
    expect(result!.length).toBeGreaterThan(0);
    for (const segment of result!) {
      expect(segment.points.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('updates the position to the first remaining point', () => {
    const points = Array.from({ length: 10 }, (_, i) => [i * 10, 5]).flat();
    const result = eraseFromBrush(stroke(points), 0, 5, 12);
    expect(result![0].position).toEqual({
      x: result![0].points[0],
      y: result![0].points[1],
    });
  });
});
