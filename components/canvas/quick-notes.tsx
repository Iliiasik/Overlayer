import { Image, Link, StickyNote, Type, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useElementSize } from '@/hooks/use-element-size';
import { itemBounds } from '@/lib/canvas/bounds';
import type { Camera } from '@/lib/canvas/camera';
import type { CanvasItem, Point } from '@/lib/annotations/types';
import { isEditableElement } from '@/lib/dom';
import { ItemsLayer } from './items-layer';
import type { SheetBounds } from './items/sheet';

export type QuickTool = 'text' | 'sticky' | 'button' | 'image';

export const QUICK_WIDTH = 440;
export const QUICK_HEIGHT = 2400;
export const QUICK_PADDING = 24;
const CONTENT_GAP = 20;

const SHEET_BOUNDS: SheetBounds = {
  width: QUICK_WIDTH,
  height: QUICK_HEIGHT,
  padding: QUICK_PADDING,
};

interface QuickNotesProps {
  items: CanvasItem[];
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onAdd: (tool: QuickTool, point: Point) => void;
  onPatch: (id: string, changes: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
  onTranslate: (id: string, dx: number, dy: number) => void;
  onOpenLink: (url: string) => void;
  onContextMenu: (id: string, point: Point) => void;
}

const QUICK_TOOLS: { id: QuickTool; icon: LucideIcon }[] = [
  { id: 'text', icon: Type },
  { id: 'sticky', icon: StickyNote },
  { id: 'button', icon: Link },
  { id: 'image', icon: Image },
];

function nextQuickPoint(items: CanvasItem[]): Point {
  let bottom = 0;
  for (const item of items) {
    const bounds = itemBounds(item);
    bottom = Math.max(bottom, bounds.y + bounds.height);
  }
  const y = bottom === 0 ? QUICK_PADDING : bottom + CONTENT_GAP;
  return { x: QUICK_PADDING, y: Math.min(y, QUICK_HEIGHT - 120) };
}

export function QuickNotes({
  items,
  editingId,
  onEditingChange,
  onAdd,
  onPatch,
  onRemove,
  onTranslate,
  onOpenLink,
  onContextMenu,
}: QuickNotesProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(containerRef);
  const [scroll, setScroll] = useState(0);

  const scale = size.width > 0 ? size.width / QUICK_WIDTH : 1;
  const maxScroll = Math.max(0, QUICK_HEIGHT - size.height / scale);
  const clampedScroll = Math.min(scroll, maxScroll);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = node.getBoundingClientRect();
      const currentScale = rect.width / QUICK_WIDTH;
      const limit = Math.max(0, QUICK_HEIGHT - rect.height / currentScale);
      setScroll((current) => Math.min(limit, Math.max(0, current + event.deltaY / currentScale)));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const add = (tool: QuickTool) => {
    const point = nextQuickPoint(items);
    onAdd(tool, point);
    setScroll(Math.min(maxScroll, Math.max(0, point.y - (size.height / scale) * 0.6)));
  };

  const camera: Camera = { x: 0, y: -clampedScroll * scale, scale };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-[var(--sheet)]"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onEditingChange(null);
        }}
        onContextMenu={(event) => {
          if (!isEditableElement(event.target)) event.preventDefault();
        }}
      >
        {items.length === 0 && (
          <p
            className="pointer-events-none absolute inset-x-8 top-16 text-center text-sm"
            style={{ color: 'var(--sheet-muted)' }}
          >
            {t('canvas.quickEmpty')}
          </p>
        )}
        <ItemsLayer
          items={items}
          tool="select"
          camera={camera}
          editingId={editingId}
          onEditingChange={onEditingChange}
          onPatch={onPatch}
          onRemove={onRemove}
          onTranslate={onTranslate}
          onOpenLink={onOpenLink}
          onContextMenu={onContextMenu}
          bounds={SHEET_BOUNDS}
        />
      </div>
      <div className="glass-panel flex shrink-0 items-center justify-center gap-1 border-t p-1.5">
        {QUICK_TOOLS.map(({ id, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={t(`tools.${id}`)}
            onClick={() => add(id)}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
    </div>
  );
}
