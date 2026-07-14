import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CURSORS } from '@/lib/cursors';
import type { StickyAnnotation } from '@/lib/annotations/types';
import { CONTENT_INK } from './sheet';
import { ItemShell, type ItemProps } from './shell';
import { dragOrDeleteHandler, useItemDrag } from './use-item-drag';

const STICKY_TINT_ALPHA = '33';
const STICKY_LINE_HEIGHT = 20;
const STICKY_MAX_LINES = 3;
const STICKY_MAX_HEIGHT = STICKY_LINE_HEIGHT * STICKY_MAX_LINES;
export const STICKY_MAX_LENGTH = 54;

export function clampStickyText(value: string): string {
  return value.split('\n').slice(0, STICKY_MAX_LINES).join('\n').slice(0, STICKY_MAX_LENGTH);
}

export function StickyItem({
  annotation,
  tool,
  scale,
  editing,
  onEditingChange,
  onPatch,
  onRemove,
  onTranslate,
  bounds,
}: ItemProps<StickyAnnotation>) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(annotation.text);
  const { offset, onPointerDown } = useItemDrag(
    scale,
    (dx, dy) => onTranslate(annotation.id, dx, dy),
    undefined,
    { position: annotation.position, bounds },
  );

  const interactive = tool === 'select' || tool === 'delete';

  const change = (area: HTMLTextAreaElement) => {
    const value = clampStickyText(area.value);
    if (value !== area.value) area.value = value;
    setDraft(value);
    onPatch(annotation.id, { text: value });
  };

  return (
    <ItemShell
      itemId={annotation.id}
      position={annotation.position}
      offset={offset}
      interactive={interactive}
      className="w-52 rounded-lg p-3 shadow-md"
      style={{
        backgroundColor: `${annotation.style.color}${STICKY_TINT_ALPHA}`,
        borderLeft: `3px solid ${annotation.style.color}`,
        backdropFilter: 'blur(2px)',
        cursor: tool === 'select' && !editing ? CURSORS.grab : undefined,
      }}
      onPointerDown={dragOrDeleteHandler(tool, editing, annotation.id, onRemove, onPointerDown)}
      onDoubleClick={() => {
        if (tool === 'select' && !editing) {
          setDraft(annotation.text);
          onEditingChange(annotation.id);
        }
      }}
    >
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          maxLength={STICKY_MAX_LENGTH}
          placeholder={t('sticky.placeholder')}
          onChange={(event) => change(event.currentTarget)}
          onBlur={() => onEditingChange(null)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onEditingChange(null);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="w-full resize-none bg-transparent text-sm outline-none"
          style={{ color: CONTENT_INK, height: STICKY_MAX_HEIGHT }}
        />
      ) : (
        <p
          className="line-clamp-3 min-h-4 whitespace-pre-wrap break-words text-sm"
          style={{ color: CONTENT_INK }}
        >
          {annotation.text || <span className="opacity-50">{t('sticky.placeholder')}</span>}
        </p>
      )}
    </ItemShell>
  );
}
