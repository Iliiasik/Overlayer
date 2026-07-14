import { describe, expect, it } from 'vitest';
import {
  createImageAnnotation,
  createStickyAnnotation,
  createTextAnnotation,
} from '@/lib/annotations/factory';
import { itemBounds } from '../bounds';

const STYLE = { color: '#000', strokeWidth: 0, opacity: 1 };

describe('itemBounds', () => {
  it('uses stored dimensions for images', () => {
    const image = createImageAnnotation({ x: 10, y: 20 }, 'data:,', 30, 40, STYLE);
    expect(itemBounds(image)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });

  it('uses the text width and a minimum height for text', () => {
    const text = { ...createTextAnnotation({ x: 5, y: 6 }, STYLE), width: 200 };
    const bounds = itemBounds(text);
    expect(bounds.x).toBe(5);
    expect(bounds.width).toBe(200);
    expect(bounds.height).toBeGreaterThan(0);
  });

  it('gives a fixed footprint for sticky notes', () => {
    const sticky = createStickyAnnotation({ x: 0, y: 0 }, STYLE);
    const bounds = itemBounds(sticky);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });
});
