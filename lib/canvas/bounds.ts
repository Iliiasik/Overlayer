import type { CanvasItem } from '@/lib/annotations/types';
import type { Bounds } from './camera';

const STICKY_SIZE = { width: 208, height: 96 };
const BUTTON_SIZE = { width: 140, height: 32 };
const TEXT_MIN_HEIGHT = 48;
const TABLE_CELL = { width: 97, height: 33 };

export function itemBounds(item: CanvasItem): Bounds {
  switch (item.type) {
    case 'image':
      return { ...item.position, width: item.width, height: item.height };
    case 'text':
      return { ...item.position, width: item.width, height: TEXT_MIN_HEIGHT };
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
