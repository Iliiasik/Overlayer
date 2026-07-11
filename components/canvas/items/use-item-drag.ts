import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Point, ToolId } from '@/lib/annotations/types';
import { clampWithin, type SheetBounds, type Size } from './sheet';

export interface DragState {
  dx: number;
  dy: number;
}

interface DragOptions {
  position: Point;
  bounds?: SheetBounds;
}

const DRAG_CLICK_THRESHOLD = 3;

export function useItemDrag(
  scale: number,
  onCommit: (dx: number, dy: number) => void,
  onClick?: () => void,
  drag?: DragOptions,
) {
  const [offset, setOffset] = useState<DragState | null>(null);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const size: Size = { width: rect.width / scale, height: rect.height / scale };
    const startX = event.clientX;
    const startY = event.clientY;
    let dx = 0;
    let dy = 0;
    let moved = false;
    const onMove = (move: PointerEvent) => {
      moved ||=
        Math.abs(move.clientX - startX) >= DRAG_CLICK_THRESHOLD ||
        Math.abs(move.clientY - startY) >= DRAG_CLICK_THRESHOLD;
      dx = (move.clientX - startX) / scale;
      dy = (move.clientY - startY) / scale;
      if (drag?.bounds) {
        const clamped = clampWithin(
          drag.bounds,
          { x: drag.position.x + dx, y: drag.position.y + dy },
          size,
        );
        dx = clamped.x - drag.position.x;
        dy = clamped.y - drag.position.y;
      }
      setOffset({ dx, dy });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setOffset(null);
      if (moved) {
        onCommit(dx, dy);
      } else {
        onClick?.();
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return { offset, onPointerDown };
}

export function dragOrDeleteHandler(
  tool: ToolId,
  editing: boolean,
  id: string,
  onRemove: (id: string) => void,
  onPointerDown: (event: ReactPointerEvent) => void,
) {
  return (event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    if (tool === 'delete') {
      event.stopPropagation();
      onRemove(id);
      return;
    }
    if (tool === 'select' && !editing) onPointerDown(event);
  };
}
