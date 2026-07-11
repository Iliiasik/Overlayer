import { describe, expect, it } from 'vitest';
import { arrowHeadPoints, brushOutline, outlineToPath } from '../svg';

describe('svg helpers', () => {
  it('builds a smooth closed path from a brush outline', () => {
    const outline = brushOutline([0, 0, 10, 0, 20, 5], 6);
    const path = outlineToPath(outline);
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(path).toContain('Q ');
    expect(path).not.toContain('L ');
  });

  it('returns an empty path for degenerate outlines', () => {
    expect(outlineToPath([])).toBe('');
    expect(outlineToPath([1, 2])).toBe('');
  });

  it('builds a triangular arrow head pointing at the target', () => {
    const points = arrowHeadPoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 4);
    const coordinates = points.split(' ').map((pair) => pair.split(',').map(Number));
    expect(coordinates).toHaveLength(3);
    expect(coordinates[0]).toEqual([100, 0]);
    expect(coordinates[1][0]).toBeCloseTo(90);
    expect(coordinates[2][0]).toBeCloseTo(90);
    expect(coordinates[1][1]).toBeCloseTo(-coordinates[2][1]);
  });

  it('survives zero-length arrows', () => {
    const points = arrowHeadPoints({ x: 5, y: 5 }, { x: 5, y: 5 }, 4);
    expect(points.split(' ')).toHaveLength(3);
  });
});
