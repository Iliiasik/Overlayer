import { ExternalLink, Trash2 } from 'lucide-react';
import { createElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { buttonIcon, BUTTON_ICONS } from '@/lib/annotations/button-icons';
import type { ButtonAnnotation } from '@/lib/annotations/types';
import { normalizeUrl } from '@/lib/annotations/url';
import { cn } from '@/lib/utils';
import type { SheetBounds } from './sheet';
import { ItemPopover, ItemShell, type ItemProps } from './shell';
import { dragOrDeleteHandler, useItemDrag } from './use-item-drag';

const EDITOR_WIDTH = 224;

interface ButtonEditorProps {
  annotation: ButtonAnnotation;
  bounds?: SheetBounds;
  onPatch: (id: string, changes: Partial<ButtonAnnotation>) => void;
  onRemove: (id: string) => void;
  onEditingChange: (id: string | null) => void;
  onOpenLink: (url: string) => void;
}

function ButtonEditor({
  annotation,
  bounds,
  onPatch,
  onRemove,
  onEditingChange,
  onOpenLink,
}: ButtonEditorProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(annotation.label);
  const [url, setUrl] = useState(annotation.url);
  const [icon, setIcon] = useState(annotation.icon ?? 'link');
  const [invalid, setInvalid] = useState(false);

  const save = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setInvalid(true);
      return;
    }
    onPatch(annotation.id, {
      url: normalized,
      label: label.trim() || new URL(normalized).host,
      icon,
    });
    onEditingChange(null);
  };

  const cancel = () => {
    if (!annotation.url) onRemove(annotation.id);
    onEditingChange(null);
  };

  const inputClass =
    'h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <ItemPopover
      width={EDITOR_WIDTH}
      position={annotation.position}
      bounds={bounds}
      className="flex flex-col gap-1.5 p-2"
    >
      <input
        autoFocus
        value={label}
        placeholder={t('linkButton.label')}
        onChange={(event) => setLabel(event.target.value)}
        className={inputClass}
      />
      <input
        value={url}
        placeholder="https://…"
        onChange={(event) => {
          setUrl(event.target.value);
          setInvalid(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save();
          if (event.key === 'Escape') cancel();
        }}
        className={inputClass}
      />
      <div className="grid grid-cols-6 gap-0.5" role="group" aria-label={t('linkButton.icon')}>
        {Object.entries(BUTTON_ICONS).map(([name, IconOption]) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={icon === name}
            onClick={() => setIcon(name)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md',
              icon === name
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            <IconOption className="h-3 w-3" />
          </button>
        ))}
      </div>
      {invalid && <p className="text-[11px] text-destructive">{t('linkButton.invalidUrl')}</p>}
      <div className="flex items-center justify-between">
        <Button size="sm" className="h-7 px-2.5" onClick={save}>
          {t('common.save')}
        </Button>
        <div className="flex items-center gap-0.5">
          {annotation.url && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label={t('linkButton.open')}
              title={t('linkButton.open')}
              onClick={() => {
                const target = normalizeUrl(annotation.url);
                if (target) onOpenLink(target);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('common.delete')}
            title={t('common.delete')}
            onClick={() => {
              onRemove(annotation.id);
              onEditingChange(null);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </ItemPopover>
  );
}

export function ButtonItem({
  annotation,
  tool,
  scale,
  editing,
  onEditingChange,
  onPatch,
  onRemove,
  onTranslate,
  onOpenLink,
  bounds,
}: ItemProps<ButtonAnnotation>) {
  const { t } = useTranslation();

  const openTarget = () => {
    const target = normalizeUrl(annotation.url);
    if (target) onOpenLink(target);
  };

  const { offset, onPointerDown } = useItemDrag(
    scale,
    (dx, dy) => onTranslate(annotation.id, dx, dy),
    () => {
      if (!editing) openTarget();
    },
    { position: annotation.position, bounds },
  );

  const interactive = tool === 'select' || tool === 'delete';

  return (
    <ItemShell
      itemId={annotation.id}
      position={annotation.position}
      offset={offset}
      interactive={interactive}
      className="w-max"
      onPointerDown={dragOrDeleteHandler(tool, editing, annotation.id, onRemove, onPointerDown)}
    >
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium text-white shadow-md transition-transform hover:scale-105"
        style={{ backgroundColor: annotation.style.color }}
      >
        {createElement(buttonIcon(annotation.icon), { className: 'h-3.5 w-3.5' })}
        {annotation.label || t('linkButton.defaultLabel')}
      </button>
      {editing && (
        <ButtonEditor
          annotation={annotation}
          bounds={bounds}
          onPatch={onPatch}
          onRemove={onRemove}
          onEditingChange={onEditingChange}
          onOpenLink={onOpenLink}
        />
      )}
    </ItemShell>
  );
}
