import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAnnotations } from '@/hooks/use-annotations';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { eraseFromBrush, ERASE_RADIUS } from '@/lib/annotations/erase';
import {
  createButtonAnnotation,
  createImageAnnotation,
  createStickyAnnotation,
  createTableAnnotation,
  createTextAnnotation,
  DEFAULT_TEXT_WIDTH,
} from '@/lib/annotations/factory';
import { DRAWING_COLORS, STROKE_WIDTHS } from '@/lib/annotations/palette';
import { isRichTextEmpty } from '@/lib/annotations/rich-text';
import { isExternalUrl } from '@/lib/annotations/url';
import { CURSORS } from '@/lib/cursors';
import type { CanvasItem, Point, ToolId } from '@/lib/annotations/types';
import { DEFAULT_CAMERA, type Camera } from '@/lib/canvas/camera';
import type { BoardStore } from '@/lib/storage/annotation-store';
import { Board } from './board';
import { ContextMenu, type ContextMenuState } from './context-menu';
import { DrawerHeader } from './drawer-header';
import { ImageDialog } from './image-dialog';
import { QuickNotes, QUICK_PADDING, QUICK_WIDTH, type QuickTool } from './quick-notes';
import { CanvasToolbar } from './toolbar';
import type { PlacementTool } from './shapes-layer';

const EDITABLE_TYPES = new Set<CanvasItem['type']>(['text', 'sticky', 'button', 'table']);

interface CanvasAppProps {
  store: BoardStore;
  quickStore: BoardStore;
  open: boolean;
  onClose: () => void;
}

const MIN_DRAWER_WIDTH = 320;
const MAX_DRAWER_WIDTH = 520;
const DRAWER_MARGIN = 64;
const DRAWER_TRANSITION =
  'transform 320ms cubic-bezier(0.32, 0.72, 0, 1), width 320ms cubic-bezier(0.32, 0.72, 0, 1)';

const stopEvents = {
  onKeyUp: (event: ReactKeyboardEvent) => event.stopPropagation(),
  onMouseDown: (event: ReactMouseEvent) => event.stopPropagation(),
  onClick: (event: ReactMouseEvent) => event.stopPropagation(),
  onPointerDown: (event: ReactPointerEvent) => event.stopPropagation(),
};

interface PendingImage {
  point: Point;
  target: 'canvas' | 'quick';
}

function defaultWidth(): number {
  return Math.min(
    MAX_DRAWER_WIDTH,
    Math.max(MIN_DRAWER_WIDTH, Math.round(window.innerWidth * 0.3)),
  );
}

export function CanvasApp({ store, quickStore, open, onClose }: CanvasAppProps) {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const items = useAnnotations(store);
  const quickItems = useAnnotations(quickStore);
  const [loaded, setLoaded] = useState(false);
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const [resizing, setResizing] = useState(false);
  const [tool, setTool] = useState<ToolId>('select');
  const [color, setColor] = useState<string>(DRAWING_COLORS[DRAWING_COLORS.length - 1]);
  const [strokeWidth, setStrokeWidth] = useState<number>(STROKE_WIDTHS[1]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmLink, setConfirmLink] = useState<string | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const activeStore = expanded ? store : quickStore;
  const style = { color, strokeWidth, opacity: 1 };
  const domainLabel = decodeURIComponent(store.key.replace(/^board:(file:)?/, ''));

  useEffect(() => {
    let active = true;
    void Promise.all([store.ready, quickStore.ready]).then(() => {
      if (!active) return;
      setCamera(store.getCamera());
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [store, quickStore]);

  useEffect(() => {
    if (loaded) store.setCamera(camera);
  }, [store, camera, loaded]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => event.preventDefault();
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const changeCamera = useCallback((updater: (camera: Camera) => Camera) => {
    setCamera(updater);
  }, []);

  const changeEditing = useCallback(
    (next: string | null) => {
      if (editingId && editingId !== next) {
        for (const target of [store, quickStore]) {
          const edited = target.getSnapshot().find((item) => item.id === editingId);
          if (!edited) continue;
          if (edited.type === 'text' && isRichTextEmpty(edited.html)) target.remove(editingId);
          if (edited.type === 'button' && !edited.url) target.remove(editingId);
        }
      }
      setEditingId(next);
    },
    [store, quickStore, editingId],
  );

  const toggleExpanded = useCallback(() => {
    changeEditing(null);
    setMenu(null);
    setExpanded((value) => !value);
  }, [changeEditing]);

  const createItem = useCallback(
    (target: Exclude<PlacementTool, 'image'>, point: Point, textWidth: number): CanvasItem => {
      const itemStyle = { color, strokeWidth, opacity: 1 };
      if (target === 'text') return { ...createTextAnnotation(point, itemStyle), width: textWidth };
      if (target === 'sticky') return createStickyAnnotation(point, itemStyle);
      if (target === 'button') return createButtonAnnotation(point, itemStyle);
      return createTableAnnotation(point, itemStyle);
    },
    [color, strokeWidth],
  );

  const place = useCallback(
    (target: PlacementTool, point: Point) => {
      if (target === 'image') {
        setPendingImage({ point, target: 'canvas' });
        return;
      }
      const item = createItem(target, point, DEFAULT_TEXT_WIDTH);
      store.add(item);
      changeEditing(item.id);
      setTool('select');
    },
    [store, createItem, changeEditing],
  );

  const quickAdd = useCallback(
    (target: QuickTool, point: Point) => {
      if (target === 'image') {
        setPendingImage({ point, target: 'quick' });
        return;
      }
      const item = createItem(target, point, QUICK_WIDTH - QUICK_PADDING * 2);
      quickStore.add(item);
      changeEditing(item.id);
    },
    [quickStore, createItem, changeEditing],
  );

  const erase = useCallback(
    (point: Point) => {
      const radius = ERASE_RADIUS / camera.scale;
      const replacements = new Map<string, CanvasItem[]>();
      for (const item of store.getSnapshot()) {
        if (item.type !== 'brush') continue;
        const result = eraseFromBrush(item, point.x, point.y, radius);
        if (result) replacements.set(item.id, result);
      }
      if (replacements.size > 0) store.replace(replacements);
    },
    [store, camera.scale],
  );

  const openLink = useCallback((url: string) => {
    if (isExternalUrl(url, window.location.origin)) {
      setConfirmLink(url);
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }, []);

  const openMenu = useCallback((id: string, point: Point) => {
    setMenu({ id, x: point.x, y: point.y });
  }, []);

  const menuItem = menu ? activeStore.getSnapshot().find((item) => item.id === menu.id) : undefined;

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setResizing(true);
    const startX = event.clientX;
    const startWidth = width;
    const onMove = (move: PointerEvent) => {
      const next = startWidth + (move.clientX - startX);
      setWidth(Math.min(window.innerWidth - DRAWER_MARGIN, Math.max(MIN_DRAWER_WIDTH, next)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setResizing(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <TooltipProvider delayDuration={350}>
      <section
        ref={sectionRef}
        role="dialog"
        aria-label={t('canvas.title')}
        aria-hidden={!open}
        className="cursor-cascade fixed inset-y-0 left-0 flex flex-col overflow-hidden border-r bg-background text-foreground shadow-2xl"
        style={{
          width: expanded ? '100%' : width,
          maxWidth: '100%',
          transform: open ? 'translateX(0)' : 'translateX(-103%)',
          transition: resizing ? 'none' : DRAWER_TRANSITION,
          pointerEvents: open ? 'auto' : 'none',
          cursor: CURSORS.arrow,
        }}
        {...stopEvents}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (menu) {
              setMenu(null);
            } else if (editingId) {
              changeEditing(null);
            } else if (expanded) {
              toggleExpanded();
            } else {
              onClose();
            }
          }
          event.stopPropagation();
        }}
      >
        <DrawerHeader
          domainLabel={domainLabel}
          expanded={expanded}
          itemCount={(expanded ? items : quickItems).length}
          onToggleExpanded={toggleExpanded}
          onClose={onClose}
        />
        <div className="relative flex min-h-0 flex-1 flex-col">
          {loaded && expanded && (
            <>
              <Board
                items={items}
                camera={camera}
                onCameraChange={changeCamera}
                tool={tool}
                style={style}
                active={open}
                editingId={editingId}
                onEditingChange={changeEditing}
                onAdd={store.add}
                onPatch={store.patch}
                onRemove={store.remove}
                onTranslate={store.translate}
                onPlace={place}
                onErase={erase}
                onOpenLink={openLink}
                onContextMenu={openMenu}
              />
              <CanvasToolbar
                activeTool={tool}
                onToolChange={setTool}
                color={color}
                onColorChange={setColor}
                strokeWidth={strokeWidth}
                onStrokeWidthChange={setStrokeWidth}
                onClear={() => setConfirmClear(true)}
              />
            </>
          )}
          {loaded && !expanded && (
            <QuickNotes
              items={quickItems}
              editingId={editingId}
              onEditingChange={changeEditing}
              onAdd={quickAdd}
              onPatch={quickStore.patch}
              onRemove={quickStore.remove}
              onTranslate={quickStore.translate}
              onOpenLink={openLink}
              onContextMenu={openMenu}
            />
          )}
        </div>
        {!expanded && (
          <div
            role="presentation"
            onPointerDown={startResize}
            className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize transition-colors hover:bg-primary/30 active:bg-primary/50"
          />
        )}
        <ImageDialog
          open={pendingImage != null}
          onClose={() => setPendingImage(null)}
          onInsert={(dataUrl, imageWidth, imageHeight) => {
            if (!pendingImage) return;
            const target = pendingImage.target === 'quick' ? quickStore : store;
            const maxWidth = pendingImage.target === 'quick' ? QUICK_WIDTH - 48 : imageWidth;
            const renderScale = Math.min(1, maxWidth / imageWidth);
            target.add(
              createImageAnnotation(
                pendingImage.point,
                dataUrl,
                Math.round(imageWidth * renderScale),
                Math.round(imageHeight * renderScale),
                { color, strokeWidth, opacity: 1 },
              ),
            );
            setPendingImage(null);
            setTool('select');
          }}
        />
        <ConfirmDialog
          open={confirmClear}
          title={t('canvas.clearTitle')}
          description={t('canvas.clearText')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            setConfirmClear(false);
            changeEditing(null);
            store.clear();
          }}
        />
        <ConfirmDialog
          open={confirmLink != null}
          title={t('linkButton.confirmExternalTitle')}
          description={t('linkButton.confirmExternalText', {
            host: confirmLink ? new URL(confirmLink).host : '',
          })}
          confirmLabel={t('common.confirm')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setConfirmLink(null)}
          onConfirm={() => {
            if (confirmLink) window.open(confirmLink, '_blank', 'noopener');
            setConfirmLink(null);
          }}
        />
      </section>
      <ContextMenu
        state={menu}
        color={menuItem?.style.color ?? null}
        editable={menuItem ? EDITABLE_TYPES.has(menuItem.type) : false}
        onClose={() => setMenu(null)}
        onEdit={() => {
          if (menu) changeEditing(menu.id);
          setMenu(null);
        }}
        onColorChange={(value) => {
          if (menuItem)
            activeStore.patch(menuItem.id, { style: { ...menuItem.style, color: value } });
        }}
        onBringToFront={() => {
          if (menu) activeStore.reorder(menu.id, 'front');
          setMenu(null);
        }}
        onSendToBack={() => {
          if (menu) activeStore.reorder(menu.id, 'back');
          setMenu(null);
        }}
        onDelete={() => {
          if (menu) activeStore.remove(menu.id);
          setMenu(null);
        }}
      />
    </TooltipProvider>
  );
}
