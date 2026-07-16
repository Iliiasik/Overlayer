import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { CanvasItem, Point } from '@/lib/annotations/types';
import { cn } from '@/lib/utils';
import type { SheetBounds } from './sheet';
import type { DragState } from './use-item-drag';

export interface ItemProps<T> {
  annotation: T;
  scale: number;
  editing: boolean;
  onEditingChange: (id: string | null) => void;
  onPatch: (id: string, changes: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
  onTranslate: (id: string, dx: number, dy: number) => void;
  onOpenLink: (url: string) => void;
  bounds?: SheetBounds;
}

interface ItemPopoverProps {
  width: number;
  position: Point;
  bounds?: SheetBounds;
  className?: string;
  children: ReactNode;
}

export function ItemPopover({ width, position, bounds, className, children }: ItemPopoverProps) {
  const centered = `calc(50% - ${width / 2}px)`;
  const left = bounds
    ? `clamp(${bounds.padding - position.x}px, ${centered}, ${bounds.width - bounds.padding - width - position.x}px)`
    : centered;
  return (
    <div
      className={cn(
        'absolute top-full z-10 mt-2 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-lg',
        className,
      )}
      style={{ left, width }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

interface ItemShellProps {
  itemId: string;
  position: Point;
  offset: DragState | null;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onPointerDown?: (event: ReactPointerEvent) => void;
  onDoubleClick?: () => void;
}

export function ItemShell({
  itemId,
  position,
  offset,
  children,
  style,
  className,
  onPointerDown,
  onDoubleClick,
}: ItemShellProps) {
  return (
    <div
      data-item={itemId}
      className={cn('absolute', className)}
      style={{
        left: position.x,
        top: position.y,
        transform: offset ? `translate(${offset.dx}px, ${offset.dy}px)` : undefined,
        pointerEvents: 'auto',
        ...style,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  );
}
