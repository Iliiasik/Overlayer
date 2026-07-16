import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Camera } from '@/lib/canvas/camera';
import type { CanvasItem, Point } from '@/lib/annotations/types';
import { isEditableElement } from '@/lib/dom';
import { ButtonItem } from './items/button-item';
import { ImageItem } from './items/image-item';
import { StickyItem } from './items/sticky-item';
import { TextItem } from './items/text-item';
import type { SheetBounds } from './items/sheet';
import type { ItemProps } from './items/shell';

interface ItemsLayerProps {
  items: CanvasItem[];
  camera: Camera;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onPatch: (id: string, changes: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
  onTranslate: (id: string, dx: number, dy: number) => void;
  onOpenLink: (url: string) => void;
  onContextMenu: (id: string, point: Point) => void;
  bounds?: SheetBounds;
}

function renderItem(item: CanvasItem, props: Omit<ItemProps<never>, 'annotation'>) {
  switch (item.type) {
    case 'sticky':
      return <StickyItem key={item.id} annotation={item} {...props} />;
    case 'text':
      return <TextItem key={item.id} annotation={item} {...props} />;
    case 'button':
      return <ButtonItem key={item.id} annotation={item} {...props} />;
    case 'image':
      return <ImageItem key={item.id} annotation={item} {...props} />;
    default:
      return null;
  }
}

export function ItemsLayer({
  items,
  camera,
  editingId,
  onEditingChange,
  onPatch,
  onRemove,
  onTranslate,
  onOpenLink,
  onContextMenu,
  bounds,
}: ItemsLayerProps) {
  const handleContextMenu = (event: ReactMouseEvent) => {
    if (isEditableElement(event.target)) return;
    const shell = (event.target as HTMLElement).closest?.('[data-item]');
    const id = shell?.getAttribute('data-item');
    if (!id) return;
    event.preventDefault();
    event.stopPropagation();
    onContextMenu(id, { x: event.clientX, y: event.clientY });
  };

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
      }}
      onContextMenu={handleContextMenu}
    >
      {items.map((item) =>
        renderItem(item, {
          scale: camera.scale,
          editing: editingId === item.id,
          onEditingChange,
          onPatch,
          onRemove,
          onTranslate,
          onOpenLink,
          bounds,
        }),
      )}
    </div>
  );
}
