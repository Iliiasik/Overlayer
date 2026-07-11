import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
  type LucideIcon,
} from 'lucide-react';
import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import type { Point, TextAnnotation } from '@/lib/annotations/types';
import { cn } from '@/lib/utils';
import { clampWidthWithin, type SheetBounds } from './sheet';
import { ItemPopover, ItemShell, type ItemProps } from './shell';
import { dragOrDeleteHandler, useItemDrag } from './use-item-drag';

const POPOVER_WIDTH = 224;

const MIN_TEXT_WIDTH = 120;
const FONT_SIZES = [
  { label: 'S', value: '13px' },
  { label: 'M', value: '' },
  { label: 'L', value: '20px' },
  { label: 'XL', value: '27px' },
];

const EXTENSIONS = [
  StarterKit.configure({ heading: false, codeBlock: false, blockquote: false }),
  TextStyleKit,
  TextAlign.configure({ types: ['paragraph'] }),
];

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  bulletList: boolean;
  orderedList: boolean;
  align: string;
  fontSize: string;
}

function readFormatState(editor: Editor): FormatState {
  return {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    underline: editor.isActive('underline'),
    strike: editor.isActive('strike'),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    align: editor.isActive({ textAlign: 'center' })
      ? 'center'
      : editor.isActive({ textAlign: 'right' })
        ? 'right'
        : 'left',
    fontSize: (editor.getAttributes('textStyle').fontSize as string | undefined) ?? '',
  };
}

function FormatButton({
  icon: Icon,
  label,
  active,
  onApply,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onApply: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={onApply}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

interface FormatBarProps {
  editor: Editor;
  position: Point;
  bounds?: SheetBounds;
}

function FormatBar({ editor, position, bounds }: FormatBarProps) {
  const { t } = useTranslation();
  const state = useEditorState({
    editor,
    selector: (context) => readFormatState(context.editor),
  });

  const chain = () => editor.chain().focus();

  const stop = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <ItemPopover
      width={POPOVER_WIDTH}
      position={position}
      bounds={bounds}
      className="flex flex-col items-center gap-1"
    >
      <div className="flex items-center gap-0.5">
        <FormatButton
          icon={Bold}
          label={t('text.bold')}
          active={state.bold}
          onApply={() => chain().toggleBold().run()}
        />
        <FormatButton
          icon={Italic}
          label={t('text.italic')}
          active={state.italic}
          onApply={() => chain().toggleItalic().run()}
        />
        <FormatButton
          icon={Underline}
          label={t('text.underline')}
          active={state.underline}
          onApply={() => chain().toggleUnderline().run()}
        />
        <FormatButton
          icon={Strikethrough}
          label={t('text.strike')}
          active={state.strike}
          onApply={() => chain().toggleStrike().run()}
        />
      </div>
      <div className="flex items-center gap-0.5">
        <FormatButton
          icon={List}
          label={t('text.bulletList')}
          active={state.bulletList}
          onApply={() => chain().toggleBulletList().run()}
        />
        <FormatButton
          icon={ListOrdered}
          label={t('text.orderedList')}
          active={state.orderedList}
          onApply={() => chain().toggleOrderedList().run()}
        />
        <FormatButton
          icon={AlignLeft}
          label={t('text.alignLeft')}
          active={state.align === 'left'}
          onApply={() => chain().setTextAlign('left').run()}
        />
        <FormatButton
          icon={AlignCenter}
          label={t('text.alignCenter')}
          active={state.align === 'center'}
          onApply={() => chain().setTextAlign('center').run()}
        />
        <FormatButton
          icon={AlignRight}
          label={t('text.alignRight')}
          active={state.align === 'right'}
          onApply={() => chain().setTextAlign('right').run()}
        />
      </div>
      <div className="flex items-center gap-0.5" role="group" aria-label={t('text.size')}>
        {FONT_SIZES.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            aria-label={`${t('text.size')} ${label}`}
            aria-pressed={state.fontSize === value}
            onPointerDown={stop}
            onClick={() => {
              if (value) {
                chain().setFontSize(value).run();
              } else {
                chain().unsetFontSize().run();
              }
            }}
            className={cn(
              'flex h-7 min-w-7 items-center justify-center rounded-md px-1 text-xs font-semibold',
              state.fontSize === value
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </ItemPopover>
  );
}

function TextEditor({
  annotation,
  bounds,
  onPatch,
  onEditingChange,
}: {
  annotation: TextAnnotation;
  bounds?: SheetBounds;
  onPatch: (id: string, changes: Partial<TextAnnotation>) => void;
  onEditingChange: (id: string | null) => void;
}) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: annotation.html,
    autofocus: 'end',
    onUpdate: ({ editor: instance }) => {
      onPatch(annotation.id, { html: instance.getHTML() });
    },
  });

  if (!editor) return null;

  return (
    <>
      <FormatBar editor={editor} position={annotation.position} bounds={bounds} />
      <EditorContent
        editor={editor}
        className="rich-text px-3 py-2"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onEditingChange(null);
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </>
  );
}

export function TextItem({
  annotation,
  tool,
  scale,
  editing,
  onEditingChange,
  onPatch,
  onRemove,
  onTranslate,
  bounds,
}: ItemProps<TextAnnotation>) {
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const { offset, onPointerDown } = useItemDrag(
    scale,
    (dx, dy) => onTranslate(annotation.id, dx, dy),
    undefined,
    { position: annotation.position, bounds },
  );

  const interactive = tool === 'select' || tool === 'delete';
  const width = resizeWidth ?? annotation.width;

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = annotation.width;
    let next = startWidth;
    const onMove = (move: PointerEvent) => {
      const raw = Math.max(MIN_TEXT_WIDTH, startWidth + (move.clientX - startX) / scale);
      next = clampWidthWithin(bounds, annotation.position, raw);
      setResizeWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setResizeWidth(null);
      onPatch(annotation.id, { width: Math.round(next) });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <ItemShell
      itemId={annotation.id}
      position={annotation.position}
      offset={offset}
      interactive={interactive}
      className={cn(
        'group rounded-md transition-shadow',
        editing
          ? 'bg-[var(--sheet)]/85 shadow-md ring-2 ring-ring'
          : 'hover:ring-1 hover:ring-[var(--sheet-border)]',
      )}
      style={{
        width,
        cursor: tool === 'select' && !editing ? 'grab' : undefined,
        color: annotation.style.color,
      }}
      onPointerDown={dragOrDeleteHandler(tool, editing, annotation.id, onRemove, onPointerDown)}
    >
      {editing ? (
        <TextEditor
          annotation={annotation}
          bounds={bounds}
          onPatch={onPatch}
          onEditingChange={onEditingChange}
        />
      ) : (
        <div
          className="rich-text px-3 py-2"
          onDoubleClick={() => {
            if (tool === 'select') onEditingChange(annotation.id);
          }}
          dangerouslySetInnerHTML={{ __html: annotation.html }}
        />
      )}
      {tool === 'select' && (
        <span
          role="presentation"
          onPointerDown={startResize}
          className={cn(
            'absolute -right-1 top-1/2 h-6 w-2 -translate-y-1/2 cursor-ew-resize rounded-full border border-background bg-primary transition-opacity',
            editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        />
      )}
    </ItemShell>
  );
}
