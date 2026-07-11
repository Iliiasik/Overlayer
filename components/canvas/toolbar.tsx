import {
  Brush,
  Delete,
  Eraser,
  Highlighter,
  Image,
  Link,
  MousePointer2,
  MoveUpRight,
  StickyNote,
  Table,
  Trash2,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { HexInput } from '@/components/ui/hex-input';
import { Tip } from '@/components/ui/tooltip';
import { DRAWING_COLORS, STROKE_WIDTHS } from '@/lib/annotations/palette';
import type { ToolId } from '@/lib/annotations/types';
import { cn } from '@/lib/utils';

interface ToolDefinition {
  id: ToolId;
  icon: LucideIcon;
}

const TOOLS: ToolDefinition[] = [
  { id: 'select', icon: MousePointer2 },
  { id: 'brush', icon: Brush },
  { id: 'highlight', icon: Highlighter },
  { id: 'text', icon: Type },
  { id: 'sticky', icon: StickyNote },
  { id: 'button', icon: Link },
  { id: 'arrow', icon: MoveUpRight },
  { id: 'table', icon: Table },
  { id: 'image', icon: Image },
  { id: 'eraser', icon: Eraser },
  { id: 'delete', icon: Delete },
];

const WIDTH_TOOLS: ToolId[] = ['brush', 'highlight', 'arrow'];

interface CanvasToolbarProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onClear: () => void;
}

export function CanvasToolbar({
  activeTool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onClear,
}: CanvasToolbarProps) {
  const { t } = useTranslation();
  const [styleOpen, setStyleOpen] = useState(false);
  const showWidths = WIDTH_TOOLS.includes(activeTool);

  return (
    <div className="absolute bottom-4 left-1/2 flex max-w-[calc(100%-16px)] -translate-x-1/2 items-center gap-1 rounded-xl border bg-background p-1 shadow-lg">
      {TOOLS.map(({ id, icon: Icon }) => (
        <Tip key={id} label={t(`tools.${id}`)}>
          <Button
            variant={activeTool === id ? 'default' : 'ghost'}
            size="icon"
            aria-label={t(`tools.${id}`)}
            aria-pressed={activeTool === id}
            onClick={() => onToolChange(id)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </Tip>
      ))}
      <div className="mx-1 h-6 w-px bg-border" />
      <div className="relative">
        <Tip label={t('toolbar.color')}>
          <button
            type="button"
            aria-label={t('toolbar.color')}
            aria-expanded={styleOpen}
            onClick={() => setStyleOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <span
              className={cn(
                'h-4.5 w-4.5 rounded-full border-2 transition-transform',
                styleOpen ? 'scale-110 border-foreground' : 'border-border',
              )}
              style={{ backgroundColor: color }}
            />
          </button>
        </Tip>
        {styleOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              role="presentation"
              onPointerDown={() => setStyleOpen(false)}
            />
            <div className="absolute bottom-10 right-0 z-50 flex w-max flex-col gap-2.5 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
              <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label={t('toolbar.color')}
              >
                {DRAWING_COLORS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={value}
                    aria-pressed={color === value}
                    onClick={() => onColorChange(value)}
                    className={cn(
                      'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                      color === value ? 'scale-110 border-foreground' : 'border-transparent',
                    )}
                    style={{ backgroundColor: value }}
                  />
                ))}
              </div>
              <HexInput
                value={color}
                onChange={onColorChange}
                pickerSide="top"
                aria-label={t('toolbar.hex')}
              />
              {showWidths && (
                <div
                  className="flex items-center gap-1 border-t pt-2"
                  role="group"
                  aria-label={t('toolbar.width')}
                >
                  {STROKE_WIDTHS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} px`}
                      aria-pressed={strokeWidth === value}
                      onClick={() => onStrokeWidthChange(value)}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md',
                        strokeWidth === value
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50',
                      )}
                    >
                      <span
                        className="rounded-full bg-current"
                        style={{ width: value, height: value }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Tip label={t('canvas.clear')}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('canvas.clear')}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onClear}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </Tip>
    </div>
  );
}
