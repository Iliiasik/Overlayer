import type { CanvasItem } from '@/lib/annotations/types';
import type { Bounds } from './camera';

const STICKY_SIZE = { width: 208, height: 96 };
const BUTTON_SIZE = { width: 140, height: 32 };
const TEXT_MIN_HEIGHT = 48;
const TABLE_CELL = { width: 97, height: 33 };

export function pointsBounds(points: number[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function itemBounds(item: CanvasItem): Bounds {
  switch (item.type) {
    case 'brush':
      return pointsBounds(item.points);
    case 'highlight':
    case 'image':
      return { ...item.position, width: item.width, height: item.height };
    case 'text':
      return { ...item.position, width: item.width, height: TEXT_MIN_HEIGHT };
    case 'arrow':
      return pointsBounds([item.position.x, item.position.y, item.to.x, item.to.y]);
    case 'sticky':
      return { ...item.position, ...STICKY_SIZE };
    case 'button':
      return { ...item.position, ...BUTTON_SIZE };
    case 'table': {
      const rows = item.cells.length;
      const columns = item.cells[0]?.length ?? 0;
      return {
        ...item.position,
        width: columns * TABLE_CELL.width,
        height: rows * TABLE_CELL.height,
      };
    }
  }
}

export function contentBounds(items: CanvasItem[]): Bounds | null {
  if (items.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const item of items) {
    const bounds = itemBounds(item);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
