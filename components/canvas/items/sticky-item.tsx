import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StickyAnnotation } from '@/lib/annotations/types';
import { CONTENT_INK } from './sheet';
import { ItemShell, type ItemProps } from './shell';
import { dragOrDeleteHandler, useItemDrag } from './use-item-drag';

const STICKY_TINT_ALPHA = '33';

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

  const change = (value: string) => {
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
        cursor: tool === 'select' && !editing ? 'grab' : undefined,
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
          placeholder={t('sticky.placeholder')}
          onChange={(event) => change(event.target.value)}
          onBlur={() => onEditingChange(null)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onEditingChange(null);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="min-h-16 w-full resize-none bg-transparent text-sm outline-none"
          style={{ color: CONTENT_INK }}
        />
      ) : (
        <p
          className="min-h-4 whitespace-pre-wrap break-words text-sm"
          style={{ color: CONTENT_INK }}
        >
          {annotation.text || <span className="opacity-50">{t('sticky.placeholder')}</span>}
        </p>
      )}
    </ItemShell>
  );
}
