import { Image, Link, Loader2, StickyNote, Type, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useElementSize } from '@/hooks/use-element-size';
import type { Camera } from '@/lib/canvas/camera';
import type { CanvasItem, Point } from '@/lib/annotations/types';
import { isEditableElement } from '@/lib/dom';
import {
  hasImagePayload,
  payloadFromDataTransfer,
  type ImageDropPayload,
  type ImageLoadError,
} from '@/lib/images';
import { cn } from '@/lib/utils';
import { ItemsLayer } from './items-layer';
import type { SheetBounds } from './items/sheet';

export type QuickTool = 'text' | 'sticky' | 'button' | 'image';

export const QUICK_WIDTH = 440;
export const QUICK_PADDING = 24;
const MIN_SHEET_HEIGHT = 1200;
const BOTTOM_HEADROOM = 600;
const CONTENT_GAP = 20;

interface QuickNotesProps {
  items: CanvasItem[];
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onAdd: (tool: QuickTool, point: Point) => void;
  onDropImage: (payload: ImageDropPayload, point: Point) => void;
  dropBusy: boolean;
  dropError: ImageLoadError | null;
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

export function QuickNotes({
  items,
  editingId,
  onEditingChange,
  onAdd,
  onDropImage,
  dropBusy,
  dropError,
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
  const [dropActive, setDropActive] = useState(false);
  const [contentBottom, setContentBottom] = useState(0);

  const scale = size.width > 0 ? size.width / QUICK_WIDTH : 1;

  const measureBottom = useCallback(() => {
    const node = containerRef.current;
    if (!node || scale <= 0) return 0;
    let bottom = 0;
    node.querySelectorAll<HTMLElement>('[data-item]').forEach((el) => {
      const item = items.find((candidate) => candidate.id === el.getAttribute('data-item'));
      if (!item) return;
      bottom = Math.max(bottom, item.position.y + el.getBoundingClientRect().height / scale);
    });
    return bottom;
  }, [items, scale]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setContentBottom(measureBottom()));
    observer.observe(node);
    node.querySelectorAll('[data-item]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [measureBottom]);

  const sheetHeight = Math.max(MIN_SHEET_HEIGHT, Math.ceil(contentBottom) + BOTTOM_HEADROOM);
  const sheetHeightRef = useRef(sheetHeight);
  useEffect(() => {
    sheetHeightRef.current = sheetHeight;
  }, [sheetHeight]);

  const maxScroll = Math.max(0, sheetHeight - size.height / scale);
  const clampedScroll = Math.min(scroll, maxScroll);

  const bounds: SheetBounds = { width: QUICK_WIDTH, height: sheetHeight, padding: QUICK_PADDING };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = node.getBoundingClientRect();
      const currentScale = rect.width / QUICK_WIDTH;
      const limit = Math.max(0, sheetHeightRef.current - rect.height / currentScale);
      setScroll((current) => Math.min(limit, Math.max(0, current + event.deltaY / currentScale)));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const add = (tool: QuickTool) => {
    const bottom = measureBottom();
    const y = bottom === 0 ? QUICK_PADDING : Math.ceil(bottom) + CONTENT_GAP;
    onAdd(tool, { x: QUICK_PADDING, y });
    setScroll(Math.max(0, y - (size.height / scale) * 0.6));
  };

  const camera: Camera = { x: 0, y: -clampedScroll * scale, scale };

  const handleDrop = (event: DragEvent) => {
    if (!hasImagePayload(event.dataTransfer)) return;
    event.preventDefault();
    setDropActive(false);
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const point: Point = {
      x: Math.min(
        QUICK_WIDTH - QUICK_PADDING,
        Math.max(QUICK_PADDING, (event.clientX - rect.left) / scale),
      ),
      y: Math.max(QUICK_PADDING, (event.clientY - rect.top) / scale + clampedScroll),
    };
    onDropImage(payloadFromDataTransfer(event.dataTransfer), point);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        className={cn(
          'relative flex-1 overflow-hidden bg-[var(--sheet)]',
          dropActive && 'ring-2 ring-inset ring-ring',
        )}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onEditingChange(null);
        }}
        onContextMenu={(event) => {
          if (!isEditableElement(event.target)) event.preventDefault();
        }}
        onDragOver={(event) => {
          if (!hasImagePayload(event.dataTransfer)) return;
          event.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={handleDrop}
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
          camera={camera}
          editingId={editingId}
          onEditingChange={onEditingChange}
          onPatch={onPatch}
          onRemove={onRemove}
          onTranslate={onTranslate}
          onOpenLink={onOpenLink}
          onContextMenu={onContextMenu}
          bounds={bounds}
        />
        {dropBusy && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            {t('image.loading')}
          </div>
        )}
        {!dropBusy && dropError && (
          <div className="absolute bottom-2 right-2 rounded-md border border-destructive/40 bg-popover px-2 py-1 text-xs text-destructive shadow-md">
            {t(`image.${dropError}`)}
          </div>
        )}
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
