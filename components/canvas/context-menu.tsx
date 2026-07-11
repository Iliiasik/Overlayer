import { BringToFront, Pencil, SendToBack, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HexInput } from '@/components/ui/hex-input';
import { DRAWING_COLORS } from '@/lib/annotations/palette';
import { cn } from '@/lib/utils';

export interface ContextMenuState {
  id: string;
  x: number;
  y: number;
}

interface ContextMenuProps {
  state: ContextMenuState | null;
  color: string | null;
  editable: boolean;
  onClose: () => void;
  onEdit: () => void;
  onColorChange: (color: string) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 224;
const MENU_HEIGHT = 280;

function MenuAction({
  icon: Icon,
  label,
  destructive,
  onSelect,
}: {
  icon: typeof BringToFront;
  label: string;
  destructive?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

export function ContextMenu({
  state,
  color,
  editable,
  onClose,
  onEdit,
  onColorChange,
  onBringToFront,
  onSendToBack,
  onDelete,
}: ContextMenuProps) {
  const { t } = useTranslation();
  if (!state) return null;

  const openLeft = state.x + MENU_WIDTH + 8 > window.innerWidth;
  const openUp = state.y + MENU_HEIGHT + 8 > window.innerHeight;
  const left = openLeft
    ? Math.max(8, state.x - MENU_WIDTH)
    : Math.min(state.x, window.innerWidth - MENU_WIDTH - 8);
  const top = openUp
    ? Math.max(8, state.y - MENU_HEIGHT)
    : Math.min(state.y, window.innerHeight - MENU_HEIGHT - 8);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        role="presentation"
        onPointerDown={(event) => {
          event.stopPropagation();
          onClose();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
      <div
        role="menu"
        className="fixed z-50 flex flex-col gap-1 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
        style={{ left, top, width: MENU_WIDTH }}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        {color != null && (
          <>
            <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1.5">
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
                pickerSide={state.y > window.innerHeight / 2 ? 'top' : 'bottom'}
                aria-label={t('toolbar.hex')}
              />
            </div>
            <div className="h-px bg-border" />
          </>
        )}
        {editable && <MenuAction icon={Pencil} label={t('common.edit')} onSelect={onEdit} />}
        <MenuAction
          icon={BringToFront}
          label={t('canvas.bringToFront')}
          onSelect={onBringToFront}
        />
        <MenuAction icon={SendToBack} label={t('canvas.sendToBack')} onSelect={onSendToBack} />
        <div className="h-px bg-border" />
        <MenuAction icon={Trash2} label={t('common.delete')} destructive onSelect={onDelete} />
      </div>
    </>
  );
}
