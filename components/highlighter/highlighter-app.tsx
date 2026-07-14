import { Bold, Highlighter, Italic, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useImperativeHandle, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { HexInput } from '@/components/ui/hex-input';
import { useAnnotations } from '@/hooks/use-annotations';
import { captureRange } from '@/lib/text-marks/anchor';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/lib/toast';
import {
  markClientRect,
  markIdAt,
  restoreAnnotation,
  unwrapAnnotation,
  updateAnnotationStyle,
  wrapAnnotation,
} from '@/lib/text-marks/marker';
import { createTextMarkAnnotation } from '@/lib/annotations/factory';
import { DRAWING_COLORS } from '@/lib/annotations/palette';
import { isolateEvents } from '@/lib/events';
import type { TextMarkAnnotation } from '@/lib/annotations/types';
import type { MarkStore } from '@/lib/storage/annotation-store';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import { HighlightsPanel } from './highlights-panel';

export interface HighlighterHandle {
  createFromSelection: () => void;
  togglePanel: () => void;
}

interface HighlighterAppProps {
  store: MarkStore;
  handleRef: Ref<HighlighterHandle>;
  onPanelChange?: (open: boolean) => void;
}

interface Point {
  x: number;
  y: number;
}

function selectionInPage(): Selection | null {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  return selection;
}

const POPUP_WIDTH = 272;

function pagePointFromRect(rect: DOMRect): Point {
  return {
    x: Math.max(
      window.scrollX + 8,
      Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - POPUP_WIDTH),
    ),
    y: rect.bottom + window.scrollY,
  };
}

export function HighlighterApp({ store, handleRef, onPanelChange }: HighlighterAppProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const annotations = useAnnotations(store);
  const [color, setColor] = useState<string>(DRAWING_COLORS[2]);
  const [selectionPoint, setSelectionPoint] = useState<Point | null>(null);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [popupPoint, setPopupPoint] = useState<Point | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const marks = annotations.filter((a): a is TextMarkAnnotation => a.type === 'textmark');
  const popupMark = marks.find((mark) => mark.id === popupId) ?? null;

  const openPopupForMark = useCallback((id: string) => {
    const rect = markClientRect(id);
    if (!rect) return;
    setPopupId(id);
    setPopupPoint(pagePointFromRect(rect));
  }, []);

  const createFromSelection = useCallback(() => {
    const selection = selectionInPage();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    const anchor = captureRange(range);
    if (!anchor) return;
    const rect = range.getBoundingClientRect();
    const annotation = createTextMarkAnnotation(
      anchor,
      { x: rect.left + window.scrollX, y: rect.top + window.scrollY },
      color,
    );
    if (!wrapAnnotation(annotation, range)) return;
    store.add(annotation);
    selection.removeAllRanges();
    setSelectionPoint(null);
    setPopupId(annotation.id);
    setPopupPoint(pagePointFromRect(rect));
  }, [store, color]);

  useImperativeHandle(
    handleRef,
    () => ({ createFromSelection, togglePanel: () => setPanelOpen((open) => !open) }),
    [createFromSelection],
  );

  useEffect(() => {
    onPanelChange?.(panelOpen);
  }, [panelOpen, onPanelChange]);

  useEffect(() => {
    if (!settings.selectionButton) return;
    const onMouseUp = (event: MouseEvent) => {
      if (markIdAt(event.target)) return;
      window.setTimeout(() => {
        const selection = selectionInPage();
        if (!selection) {
          setSelectionPoint(null);
          return;
        }
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        setSelectionPoint({
          x: rect.right + window.scrollX + 6,
          y: rect.bottom + window.scrollY + 6,
        });
      });
    };
    const onSelectionChange = () => {
      if (!selectionInPage()) setSelectionPoint(null);
    };
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [settings.selectionButton]);

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      const id = markIdAt(event.target);
      if (!id) return;
      event.preventDefault();
      openPopupForMark(id);
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [openPopupForMark]);

  useEffect(() => {
    const onOver = (event: MouseEvent) => {
      const id = markIdAt(event.target);
      if (!id) return;
      const mark = store
        .getSnapshot()
        .find((a): a is TextMarkAnnotation => a.type === 'textmark' && a.id === id);
      if (!mark?.note) return;
      const rect = markClientRect(id);
      if (!rect) return;
      setTooltip({
        text: mark.note,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY - 8,
      });
    };
    const onOut = (event: MouseEvent) => {
      if (markIdAt(event.target)) setTooltip(null);
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, [store]);

  const patchMark = (mark: TextMarkAnnotation, changes: Partial<TextMarkAnnotation>) => {
    const next = { ...mark, ...changes };
    updateAnnotationStyle(next);
    store.patch(mark.id, changes);
    if (changes.style && changes.style.color !== mark.style.color) setColor(changes.style.color);
  };

  const removeMark = (mark: TextMarkAnnotation) => {
    unwrapAnnotation(mark.id);
    store.remove(mark.id);
    setPopupId(null);
    toast(t('highlighter.deleted'), {
      description: mark.anchor.text?.quote.slice(0, 60),
      action: {
        label: t('common.undo'),
        onClick: () => {
          store.add(mark);
          restoreAnnotation(mark);
        },
      },
    });
  };

  return (
    <div className="absolute left-0 top-0" style={{ pointerEvents: 'none' }}>
      {selectionPoint && (
        <button
          type="button"
          aria-label={t('highlighter.highlight')}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            createFromSelection();
          }}
          className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
          style={{ left: selectionPoint.x, top: selectionPoint.y, pointerEvents: 'auto' }}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </button>
      )}
      {popupMark && popupPoint && (
        <>
          <div
            className="fixed inset-0"
            role="presentation"
            style={{ pointerEvents: 'auto' }}
            onPointerDown={() => setPopupId(null)}
          />
          <div
            className="absolute z-10 flex w-64 max-w-[calc(100vw-16px)] flex-col gap-2.5 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"
            style={{ left: popupPoint.x, top: popupPoint.y + 8, pointerEvents: 'auto' }}
            {...isolateEvents}
          >
            <div className="flex items-center gap-1.5">
              {DRAWING_COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={value}
                  aria-pressed={popupMark.style.color === value}
                  onClick={() =>
                    patchMark(popupMark, { style: { ...popupMark.style, color: value } })
                  }
                  className={cn(
                    'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                    popupMark.style.color === value ? 'border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <HexInput
                value={popupMark.style.color}
                onChange={(value) =>
                  patchMark(popupMark, { style: { ...popupMark.style, color: value } })
                }
                aria-label={t('toolbar.hex')}
              />
              <Button
                variant={popupMark.bold ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                aria-label={t('highlighter.bold')}
                aria-pressed={popupMark.bold}
                onClick={() => patchMark(popupMark, { bold: !popupMark.bold })}
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={popupMark.italic ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                aria-label={t('highlighter.italic')}
                aria-pressed={popupMark.italic}
                onClick={() => patchMark(popupMark, { italic: !popupMark.italic })}
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={t('common.delete')}
                onClick={() => removeMark(popupMark)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <textarea
              key={popupMark.id}
              defaultValue={popupMark.note}
              maxLength={400}
              placeholder={t('highlighter.notePlaceholder')}
              rows={2}
              onChange={(event) => patchMark(popupMark, { note: event.currentTarget.value })}
              className="w-full resize-none rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </>
      )}
      {panelOpen && (
        <HighlightsPanel
          marks={marks}
          onClose={() => setPanelOpen(false)}
          onSelect={openPopupForMark}
          onDelete={removeMark}
        />
      )}
      {tooltip && (
        <div
          className="absolute z-20 max-w-64 -translate-y-full whitespace-pre-wrap rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
      <Toaster />
    </div>
  );
}
