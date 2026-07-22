import { Highlighter, StickyNote } from 'lucide-react';
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAnnotations, usePages } from '@/hooks/use-annotations';
import { useSettings } from '@/hooks/use-settings';
import { pageItemCount } from '@/lib/storage/annotation-repository';
import type { MarkStore, NotesStore } from '@/lib/storage/annotation-store';

const EDGE_MARGIN = 16;
const DRAG_THRESHOLD = 4;
const BUTTON_SIZE = 32;
const BUTTON_GAP = 8;
const DOCK_TRANSITION =
  'transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)';

interface EdgeDockProps {
  markStore: MarkStore;
  notesStore: NotesStore;
  panelOpen: boolean;
  onOpenNotes: () => void;
  onOpenHighlights: () => void;
}

const BADGE_MAX = 99;

function formatBadge(count: number): string {
  return count > BADGE_MAX ? `${BADGE_MAX}+` : String(count);
}

function DockButton({
  label,
  count,
  onActivate,
  children,
}: {
  label: string;
  count: number;
  onActivate: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onActivate}
      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
    >
      {children}
      {count > 0 && (
        <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-background px-1 text-[10px] font-semibold text-foreground shadow">
          {formatBadge(count)}
        </span>
      )}
    </button>
  );
}

export function EdgeDock({
  markStore,
  notesStore,
  panelOpen,
  onOpenNotes,
  onOpenHighlights,
}: EdgeDockProps) {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const marks = useAnnotations(markStore);
  const pages = usePages(notesStore);
  const draggedRef = useRef(false);
  const [dragTop, setDragTop] = useState<number | null>(null);
  const [, bumpViewport] = useReducer((tick: number) => tick + 1, 0);

  useEffect(() => {
    window.addEventListener('resize', bumpViewport);
    return () => window.removeEventListener('resize', bumpViewport);
  }, []);

  const showNotes = settings.notesEdgeButton;
  const showMarks = settings.highlighterBadge;
  if (!showNotes && !showMarks) return null;

  const buttonCount = (showNotes ? 1 : 0) + (showMarks ? 1 : 0);
  const dockHeight = buttonCount * BUTTON_SIZE + (buttonCount - 1) * BUTTON_GAP;
  const range = Math.max(0, window.innerHeight - dockHeight - EDGE_MARGIN * 2);
  const clampTop = (value: number) =>
    EDGE_MARGIN + Math.min(range, Math.max(0, value - EDGE_MARGIN));
  const top = clampTop(dragTop ?? EDGE_MARGIN + settings.edgeOffset * range);

  const startDrag = (event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    const startY = event.clientY;
    const startTop = top;
    draggedRef.current = false;
    const onMove = (move: PointerEvent) => {
      const dy = move.clientY - startY;
      if (!draggedRef.current && Math.abs(dy) < DRAG_THRESHOLD) return;
      draggedRef.current = true;
      setDragTop(clampTop(startTop + dy));
    };
    const onUp = (up: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!draggedRef.current) return;
      const finalTop = clampTop(startTop + (up.clientY - startY));
      const offset = range > 0 ? (finalTop - EDGE_MARGIN) / range : 0.5;
      setDragTop(finalTop);
      void update({ edgeOffset: Math.min(0.95, Math.max(0.05, offset)) });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const activate = (action: () => void) => () => {
    if (!draggedRef.current) action();
    draggedRef.current = false;
  };

  const buttons = (
    <>
      {showNotes && (
        <DockButton
          label={t('canvas.title')}
          count={pageItemCount(pages)}
          onActivate={activate(onOpenNotes)}
        >
          <StickyNote className="h-3.5 w-3.5" />
        </DockButton>
      )}
      {showMarks && (
        <DockButton
          label={t('highlighter.panelTitle')}
          count={marks.length}
          onActivate={activate(onOpenHighlights)}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </DockButton>
      )}
    </>
  );

  return (
    <>
      <div
        className="fixed right-3 z-30 flex touch-none flex-col items-center gap-2"
        style={{
          top,
          opacity: panelOpen ? 0 : 1,
          pointerEvents: panelOpen ? 'none' : 'auto',
          transition: DOCK_TRANSITION,
        }}
        onPointerDown={startDrag}
      >
        {buttons}
      </div>
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        <div
          className="absolute bottom-4 left-1/2 flex flex-row items-center gap-2"
          style={{
            transform: `translateX(-50%) translateY(${panelOpen ? '0px' : 'calc(100% + 24px)'})`,
            opacity: panelOpen ? 1 : 0,
            pointerEvents: panelOpen ? 'auto' : 'none',
            transition: DOCK_TRANSITION,
          }}
        >
          {buttons}
        </div>
      </div>
    </>
  );
}
