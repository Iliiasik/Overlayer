import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { eraseFromBrush } from '@/lib/annotations/erase';
import { createBrushAnnotation } from '@/lib/annotations/factory';
import { annotationRepository } from '@/lib/storage/annotation-repository';

function longStroke(pointPairs: number): number[] {
  return Array.from({ length: pointPairs }, (_, i) => [i, Math.sin(i / 10) * 50]).flat();
}

describe('performance budgets', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('erases across 500 strokes of 200 points within 100ms', () => {
    const strokes = Array.from({ length: 500 }, () =>
      createBrushAnnotation(longStroke(200), { color: '#000', strokeWidth: 6, opacity: 1 }),
    );
    const started = performance.now();
    for (const stroke of strokes) {
      eraseFromBrush(stroke, 100, 0);
    }
    expect(performance.now() - started).toBeLessThan(100);
  });

  it('erasing a 10000-point stroke stays under 10ms', () => {
    const stroke = createBrushAnnotation(longStroke(10000), {
      color: '#000',
      strokeWidth: 6,
      opacity: 1,
    });
    const started = performance.now();
    eraseFromBrush(stroke, 5000, 0);
    expect(performance.now() - started).toBeLessThan(10);
  });

  it('lists 200 stored boards within 200ms', async () => {
    for (let i = 0; i < 200; i++) {
      await annotationRepository.saveBoard(
        `https://site-${i}.com/page`,
        [createBrushAnnotation(longStroke(50), { color: '#000', strokeWidth: 6, opacity: 1 })],
        { x: 0, y: 0, scale: 1 },
      );
    }
    const started = performance.now();
    const entries = await annotationRepository.listAll();
    expect(entries).toHaveLength(200);
    expect(performance.now() - started).toBeLessThan(200);
  });
});
