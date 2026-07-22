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
import { usePages } from '@/hooks/use-annotations';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  createButtonAnnotation,
  createImageAnnotation,
  createStickyAnnotation,
  createTextAnnotation,
} from '@/lib/annotations/factory';
import { DEFAULT_ITEM_COLOR } from '@/lib/annotations/palette';
import { isRichTextEmpty } from '@/lib/annotations/rich-text';
import { isExternalUrl } from '@/lib/annotations/url';
import { CURSORS } from '@/lib/cursors';
import { loadDroppedImage, type ImageDropPayload, type ImageLoadError } from '@/lib/images';
import type { CanvasItem, Point } from '@/lib/annotations/types';
import { pageItemCount } from '@/lib/storage/annotation-repository';
import type { NotesStore } from '@/lib/storage/annotation-store';
import { ContextMenu, type ContextMenuState } from './context-menu';
import { DrawerHeader } from './drawer-header';
import { ImageDialog } from './image-dialog';
import { PageBar } from './page-bar';
import { QuickNotes, QUICK_PADDING, QUICK_WIDTH, type QuickTool } from './quick-notes';

const EDITABLE_TYPES = new Set<CanvasItem['type']>(['text', 'sticky', 'button']);

const ITEM_STYLE = { color: DEFAULT_ITEM_COLOR, strokeWidth: 0, opacity: 1 };
const CONTENT_WIDTH = QUICK_WIDTH - QUICK_PADDING * 2;

interface CanvasAppProps {
  store: NotesStore;
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

function defaultWidth(): number {
  return Math.min(
    MAX_DRAWER_WIDTH,
    Math.max(MIN_DRAWER_WIDTH, Math.round(window.innerWidth * 0.3)),
  );
}

export function CanvasApp({ store, open, onClose }: CanvasAppProps) {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const pages = usePages(store);
  const [width, setWidth] = useState(defaultWidth);
  const [resizing, setResizing] = useState(false);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<Point | null>(null);
  const [dropBusy, setDropBusy] = useState(false);
  const [dropError, setDropError] = useState<ImageLoadError | null>(null);
  const dropErrorTimer = useRef<number | undefined>(undefined);
  const [confirmLink, setConfirmLink] = useState<string | null>(null);
  const [confirmPageDelete, setConfirmPageDelete] = useState(false);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const activeIndex = Math.max(
    0,
    pages.findIndex((page) => page.id === activePageId),
  );
  const activePage = pages[activeIndex];
  const pageId = activePage.id;
  const items = activePage.items;

  const domainLabel = decodeURIComponent(store.key.replace(/^quick:(file:)?/, ''));

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => event.preventDefault();
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const changeEditing = useCallback(
    (next: string | null) => {
      if (editingId && editingId !== next) {
        const current = store.getPages().find((page) => page.id === pageId);
        const edited = current?.items.find((item) => item.id === editingId);
        if (edited?.type === 'text' && isRichTextEmpty(edited.html)) {
          store.removeItem(pageId, editingId);
        }
        if (edited?.type === 'button' && !edited.url) store.removeItem(pageId, editingId);
      }
      setEditingId(next);
    },
    [store, pageId, editingId],
  );

  const switchPage = useCallback(
    (index: number) => {
      const target = pages[Math.min(pages.length - 1, Math.max(0, index))];
      if (!target || target.id === pageId) return;
      changeEditing(null);
      setMenu(null);
      setActivePageId(target.id);
    },
    [pages, pageId, changeEditing],
  );

  const addPage = useCallback(() => {
    changeEditing(null);
    setMenu(null);
    setActivePageId(store.addPage());
  }, [store, changeEditing]);

  const deleteActivePage = useCallback(() => {
    changeEditing(null);
    setMenu(null);
    const neighbor = pages[activeIndex - 1] ?? pages[activeIndex + 1];
    store.removePage(pageId);
    setActivePageId(neighbor?.id ?? null);
  }, [store, pages, activeIndex, pageId, changeEditing]);

  const quickAdd = useCallback(
    (tool: QuickTool, point: Point) => {
      if (tool === 'image') {
        setPendingImage(point);
        return;
      }
      const item =
        tool === 'text'
          ? { ...createTextAnnotation(point, ITEM_STYLE), width: CONTENT_WIDTH }
          : tool === 'sticky'
            ? createStickyAnnotation(point, ITEM_STYLE)
            : createButtonAnnotation(point, ITEM_STYLE);
      store.addItem(pageId, item);
      changeEditing(item.id);
    },
    [store, pageId, changeEditing],
  );

  useEffect(() => () => window.clearTimeout(dropErrorTimer.current), []);

  const dropImage = useCallback(
    (payload: ImageDropPayload, point: Point) => {
      setDropBusy(true);
      setDropError(null);
      window.clearTimeout(dropErrorTimer.current);
      void loadDroppedImage(payload).then((result) => {
        setDropBusy(false);
        if (!result.ok) {
          setDropError(result.reason);
          dropErrorTimer.current = window.setTimeout(() => setDropError(null), 4000);
          return;
        }
        const { image } = result;
        const renderScale = Math.min(1, CONTENT_WIDTH / image.width);
        const width = Math.round(image.width * renderScale);
        const height = Math.round(image.height * renderScale);
        const position: Point = {
          x: Math.min(QUICK_WIDTH - QUICK_PADDING - width, Math.max(QUICK_PADDING, point.x)),
          y: Math.max(QUICK_PADDING, point.y),
        };
        store.addItem(
          pageId,
          createImageAnnotation(position, image.dataUrl, width, height, ITEM_STYLE),
        );
      });
    },
    [store, pageId],
  );

  const patchItem = useCallback(
    (id: string, changes: Partial<CanvasItem>) => store.patchItem(pageId, id, changes),
    [store, pageId],
  );
  const removeItem = useCallback((id: string) => store.removeItem(pageId, id), [store, pageId]);
  const translateItem = useCallback(
    (id: string, dx: number, dy: number) => store.translateItem(pageId, id, dx, dy),
    [store, pageId],
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

  const menuItem = menu ? items.find((item) => item.id === menu.id) : undefined;

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
    <>
      <section
        ref={sectionRef}
        role="dialog"
        aria-label={t('canvas.title')}
        aria-hidden={!open}
        className="cursor-cascade fixed inset-y-0 left-0 flex flex-col overflow-hidden border-r text-foreground shadow-2xl"
        style={{
          width,
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
            } else {
              onClose();
            }
          }
          event.stopPropagation();
        }}
      >
        <DrawerHeader
          domainLabel={domainLabel}
          itemCount={pageItemCount(pages)}
          onClose={onClose}
        />
        <PageBar
          title={activePage.title}
          index={activeIndex}
          count={pages.length}
          onTitleChange={(title) => store.renamePage(pageId, title)}
          onNavigate={switchPage}
          onAdd={addPage}
          onDelete={() => {
            if (items.length > 0) {
              setConfirmPageDelete(true);
            } else {
              deleteActivePage();
            }
          }}
        />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <QuickNotes
            key={pageId}
            items={items}
            editingId={editingId}
            onEditingChange={changeEditing}
            onAdd={quickAdd}
            onDropImage={dropImage}
            dropBusy={dropBusy}
            dropError={dropError}
            onPatch={patchItem}
            onRemove={removeItem}
            onTranslate={translateItem}
            onOpenLink={openLink}
            onContextMenu={openMenu}
          />
        </div>
        <div
          role="presentation"
          onPointerDown={startResize}
          className="absolute inset-y-0 right-0 w-1.5 transition-colors hover:bg-primary/30 active:bg-primary/50"
          style={{ cursor: CURSORS.resizeH }}
        />
        <ImageDialog
          open={pendingImage != null}
          onClose={() => setPendingImage(null)}
          onInsert={(dataUrl, imageWidth, imageHeight) => {
            if (!pendingImage) return;
            const renderScale = Math.min(1, CONTENT_WIDTH / imageWidth);
            store.addItem(
              pageId,
              createImageAnnotation(
                pendingImage,
                dataUrl,
                Math.round(imageWidth * renderScale),
                Math.round(imageHeight * renderScale),
                ITEM_STYLE,
              ),
            );
            setPendingImage(null);
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
        <ConfirmDialog
          open={confirmPageDelete}
          title={t('canvas.deletePageTitle')}
          description={t('canvas.deletePageText', { count: items.length })}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setConfirmPageDelete(false)}
          onConfirm={() => {
            setConfirmPageDelete(false);
            deleteActivePage();
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
          if (menuItem) patchItem(menuItem.id, { style: { ...menuItem.style, color: value } });
        }}
        onBringToFront={() => {
          if (menu) store.reorderItem(pageId, menu.id, 'front');
          setMenu(null);
        }}
        onSendToBack={() => {
          if (menu) store.reorderItem(pageId, menu.id, 'back');
          setMenu(null);
        }}
        onDelete={() => {
          if (menu) removeItem(menu.id);
          setMenu(null);
        }}
      />
    </>
  );
}
