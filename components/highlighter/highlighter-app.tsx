import { Bold, Highlighter, Italic, Loader2, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { HexInput } from '@/components/ui/hex-input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnnotations } from '@/hooks/use-annotations';
import { captureRange } from '@/lib/text-marks/anchor';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/lib/toast';
import {
  isMarkPresent,
  markClientRect,
  markIdAt,
  restoreAnnotation,
  unwrapAnnotation,
  updateAnnotationStyle,
  wrapAnnotation,
} from '@/lib/text-marks/marker';
import { createMarkSearch, focusMark, type MarkSearch } from '@/lib/text-marks/scroll-finder';
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
  promptJump: (mark: TextMarkAnnotation) => void;
}

type JumpPhase = 'prompt' | 'searching' | 'notFound';

interface JumpState {
  mark: TextMarkAnnotation;
  phase: JumpPhase;
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
  if (selection.toString().trim() === '') return null;
  return selection;
}

const POPUP_WIDTH = 272;
const NOTE_MAX_LENGTH = 200;
const NOTE_CARD_WIDTH = 256;
const NOTE_CARD_CLOSE_MS = 120;

function NoteField({
  note,
  placeholder,
  onChange,
}: {
  note: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const resize = (area: HTMLTextAreaElement) => {
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight}px`;
  };

  useEffect(() => {
    if (areaRef.current) resize(areaRef.current);
  }, []);

  return (
    <ScrollArea className="max-h-24 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      <textarea
        ref={areaRef}
        defaultValue={note}
        maxLength={NOTE_MAX_LENGTH}
        rows={2}
        placeholder={placeholder}
        onChange={(event) => {
          resize(event.currentTarget);
          onChange(event.currentTarget.value);
        }}
        className="block w-full resize-none overflow-hidden break-words bg-transparent px-2.5 py-1.5 text-sm outline-none"
      />
    </ScrollArea>
  );
}

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
  const [jump, setJump] = useState<JumpState | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [noteCard, setNoteCard] = useState<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const noteCardHovered = useRef(false);
  const noteCardTimer = useRef<number | undefined>(undefined);

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

  const searchRef = useRef<MarkSearch | null>(null);

  const finishJumpSearch = useCallback(async (mark: TextMarkAnnotation, found: boolean) => {
    if (found) {
      await focusMark(mark);
      searchRef.current = null;
    }
    setJump(found ? null : { mark, phase: 'notFound' });
    setFailedIds((current) => {
      const next = new Set(current);
      if (found) {
        next.delete(mark.id);
      } else {
        next.add(mark.id);
      }
      return next;
    });
  }, []);

  const startJumpSearch = useCallback(
    (mark: TextMarkAnnotation) => {
      setJump({ mark, phase: 'searching' });
      void (async () => {
        if (isMarkPresent(mark.id)) {
          await finishJumpSearch(mark, await focusMark(mark));
          return;
        }
        const search = createMarkSearch(mark);
        searchRef.current = search;
        await finishJumpSearch(mark, await search.start());
      })();
    },
    [finishJumpSearch],
  );

  const continueJumpSearch = useCallback(
    (mark: TextMarkAnnotation) => {
      const search = searchRef.current;
      if (!search) {
        startJumpSearch(mark);
        return;
      }
      setJump({ mark, phase: 'searching' });
      void search.resume().then((found) => finishJumpSearch(mark, found));
    },
    [startJumpSearch, finishJumpSearch],
  );

  const cancelJumpSearch = useCallback(() => {
    searchRef.current?.cancel();
    searchRef.current = null;
    setJump(null);
  }, []);

  useImperativeHandle(
    handleRef,
    () => ({
      createFromSelection,
      togglePanel: () => setPanelOpen((open) => !open),
      promptJump: (mark: TextMarkAnnotation) => setJump({ mark, phase: 'prompt' }),
    }),
    [createFromSelection],
  );

  useEffect(() => {
    onPanelChange?.(panelOpen);
  }, [panelOpen, onPanelChange]);

  useEffect(() => {
    if (!settings.selectionButton) return;
    const showForSelection = () => {
      const selection = selectionInPage();
      if (!selection) {
        setSelectionPoint(null);
        return;
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelectionPoint(null);
        return;
      }
      setSelectionPoint({
        x: rect.right + window.scrollX + 6,
        y: rect.bottom + window.scrollY + 6,
      });
    };
    const onMouseUp = (event: MouseEvent) => {
      if (markIdAt(event.target)) return;
      window.setTimeout(showForSelection);
    };
    const onSelectionChange = () => {
      if (!selectionInPage()) setSelectionPoint(null);
    };
    let staleTimer: number | undefined;
    const staleObserver = new MutationObserver(() => {
      window.clearTimeout(staleTimer);
      staleTimer = window.setTimeout(() => {
        setSelectionPoint((current) => {
          if (!current) return current;
          const selection = selectionInPage();
          if (!selection) return null;
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          return rect.width === 0 && rect.height === 0 ? null : current;
        });
      }, 250);
    });
    staleObserver.observe(document.body, { childList: true, subtree: true });
    const initialTimer = window.setTimeout(showForSelection);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearTimeout(staleTimer);
      staleObserver.disconnect();
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

  const scheduleNoteCardClose = useCallback(() => {
    window.clearTimeout(noteCardTimer.current);
    noteCardTimer.current = window.setTimeout(() => {
      if (!noteCardHovered.current) setNoteCard(null);
    }, NOTE_CARD_CLOSE_MS);
  }, []);

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
      window.clearTimeout(noteCardTimer.current);
      setNoteCard({
        text: mark.note,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      });
    };
    const onOut = (event: MouseEvent) => {
      if (markIdAt(event.target)) scheduleNoteCardClose();
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => {
      window.clearTimeout(noteCardTimer.current);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, [store, scheduleNoteCardClose]);

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
            <NoteField
              key={popupMark.id}
              note={popupMark.note}
              placeholder={t('highlighter.notePlaceholder')}
              onChange={(value) => patchMark(popupMark, { note: value })}
            />
          </div>
        </>
      )}
      <HighlightsPanel
        open={panelOpen}
        marks={marks}
        failedIds={failedIds}
        onClose={() => setPanelOpen(false)}
        onDelete={removeMark}
        onJump={startJumpSearch}
      />
      {jump?.phase === 'prompt' && (
        <div
          className="fixed bottom-6 left-1/2 z-30 flex w-80 max-w-[calc(100vw-24px)] -translate-x-1/2 flex-col gap-2.5 rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl"
          style={{ pointerEvents: 'auto' }}
          {...isolateEvents}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: jump.mark.style.color }}
            />
            <p className="line-clamp-2 min-w-0 flex-1 break-words text-sm">
              {jump.mark.anchor.text?.quote}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground"
              aria-label={t('common.cancel')}
              onClick={() => setJump(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button size="sm" onClick={() => startJumpSearch(jump.mark)}>
            {t('highlighter.jumpGo')}
          </Button>
        </div>
      )}
      {jump?.phase === 'searching' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/25"
          style={{ pointerEvents: 'auto' }}
          {...isolateEvents}
        >
          <div className="flex items-center gap-3 rounded-xl border bg-popover px-5 py-4 text-popover-foreground shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">{t('highlighter.jumpSearching')}</span>
          </div>
        </div>
      )}
      {jump?.phase === 'notFound' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/25"
          style={{ pointerEvents: 'auto' }}
          {...isolateEvents}
        >
          <div className="flex w-80 max-w-[calc(100vw-24px)] flex-col gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl">
            <p className="text-sm">{t('highlighter.jumpNotFound')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={cancelJumpSearch}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={() => continueJumpSearch(jump.mark)}>
                {t('highlighter.jumpContinue')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {noteCard && (
        <Popover open modal={false}>
          <PopoverAnchor asChild>
            <div
              className="pointer-events-none absolute"
              style={{
                left: noteCard.x,
                top: noteCard.y,
                width: noteCard.width,
                height: noteCard.height,
              }}
            />
          </PopoverAnchor>
          <PopoverContent
            side="top"
            align="start"
            className="p-0"
            style={{ width: NOTE_CARD_WIDTH, pointerEvents: 'auto' }}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onPointerEnter={() => {
              noteCardHovered.current = true;
              window.clearTimeout(noteCardTimer.current);
            }}
            onPointerLeave={() => {
              noteCardHovered.current = false;
              scheduleNoteCardClose();
            }}
          >
            <ScrollArea className="max-h-40 rounded-lg">
              <p
                className="whitespace-pre-wrap break-words px-3 py-2 text-sm"
                style={{ width: NOTE_CARD_WIDTH - 2 }}
              >
                {noteCard.text}
              </p>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
      <Toaster />
    </div>
  );
}
