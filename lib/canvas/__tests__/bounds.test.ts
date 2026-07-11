import { describe, expect, it } from 'vitest';
import {
  createArrowAnnotation,
  createBrushAnnotation,
  createHighlightAnnotation,
  createStickyAnnotation,
} from '@/lib/annotations/factory';
import { contentBounds, itemBounds, pointsBounds } from '../bounds';

const STYLE = { color: '#000', strokeWidth: 3, opacity: 1 };

describe('pointsBounds', () => {
  it('computes the bounding box of a point list', () => {
    expect(pointsBounds([0, 0, 10, 20, -5, 8])).toEqual({ x: -5, y: 0, width: 15, height: 20 });
  });
});

describe('itemBounds', () => {
  it('uses geometry for shapes', () => {
    const highlight = createHighlightAnnotation({ x: 10, y: 20, width: 30, height: 40 }, STYLE);
    expect(itemBounds(highlight)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    const arrow = createArrowAnnotation({ x: 0, y: 0 }, { x: -20, y: 50 }, STYLE);
    expect(itemBounds(arrow)).toEqual({ x: -20, y: 0, width: 20, height: 50 });
  });

  it('estimates sizes for html items', () => {
    const sticky = createStickyAnnotation({ x: 5, y: 5 }, STYLE);
    const bounds = itemBounds(sticky);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });
});

describe('contentBounds', () => {
  it('returns null for an empty board', () => {
    expect(contentBounds([])).toBeNull();
  });

  it('unions the bounds of all items', () => {
    const brush = createBrushAnnotation([0, 0, 100, 100], STYLE);
    const highlight = createHighlightAnnotation({ x: -50, y: 10, width: 20, height: 20 }, STYLE);
    const bounds = contentBounds([brush, highlight]);
    expect(bounds).toEqual({ x: -50, y: 0, width: 150, height: 100 });
  });
});
