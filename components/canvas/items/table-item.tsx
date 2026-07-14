import { GripVertical, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CURSORS } from '@/lib/cursors';
import type { TableAnnotation } from '@/lib/annotations/types';
import { CONTENT_INK } from './sheet';
import { ItemShell, type ItemProps } from './shell';
import { useItemDrag } from './use-item-drag';

function updateCell(cells: string[][], row: number, column: number, value: string): string[][] {
  return cells.map((cellsRow, rowIndex) =>
    rowIndex === row
      ? cellsRow.map((cell, columnIndex) => (columnIndex === column ? value : cell))
      : cellsRow,
  );
}

export function TableItem({
  annotation,
  tool,
  scale,
  editing,
  onEditingChange,
  onPatch,
  onRemove,
  onTranslate,
  bounds,
}: ItemProps<TableAnnotation>) {
  const { t } = useTranslation();
  const [cells, setCells] = useState(annotation.cells);
  const { offset, onPointerDown } = useItemDrag(
    scale,
    (dx, dy) => onTranslate(annotation.id, dx, dy),
    () => {
      if (tool === 'select' && !editing) {
        setCells(annotation.cells);
        onEditingChange(annotation.id);
      }
    },
    { position: annotation.position, bounds },
  );

  const interactive = tool === 'select' || tool === 'delete';
  const columns = cells[0]?.length ?? 0;

  const commit = (next: string[][]) => {
    setCells(next);
    onPatch(annotation.id, { cells: next });
  };

  const addRow = () => commit([...cells, Array.from({ length: columns }, () => '')]);
  const removeRow = () => cells.length > 1 && commit(cells.slice(0, -1));
  const addColumn = () => commit(cells.map((row) => [...row, '']));
  const removeColumn = () => columns > 1 && commit(cells.map((row) => row.slice(0, -1)));

  return (
    <ItemShell
      itemId={annotation.id}
      position={annotation.position}
      offset={offset}
      interactive={interactive}
      style={{ cursor: tool === 'select' && !editing ? CURSORS.grab : undefined }}
      onPointerDown={(event) => {
        if (tool === 'delete') {
          event.stopPropagation();
          onRemove(annotation.id);
          return;
        }
        if (tool === 'select') onPointerDown(event);
      }}
    >
      <div className="flex w-max flex-col items-center gap-2">
        <div
          className="w-fit overflow-hidden rounded-lg border bg-[var(--sheet)]/95 shadow-md"
          style={{ borderTop: `3px solid ${annotation.style.color}` }}
        >
          <table className="border-collapse">
            <tbody>
              {cells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, columnIndex) => (
                    <td key={columnIndex} className="border border-border p-0">
                      {editing ? (
                        <input
                          value={cell}
                          onChange={(event) =>
                            setCells(updateCell(cells, rowIndex, columnIndex, event.target.value))
                          }
                          onBlur={() => commit(cells)}
                          onPointerDown={(event) => event.stopPropagation()}
                          className="h-8 w-24 bg-transparent px-2 text-sm outline-none focus-visible:bg-accent/40"
                          style={{ color: CONTENT_INK }}
                        />
                      ) : (
                        <div
                          className="h-8 w-24 truncate px-2 py-1.5 text-sm"
                          style={{ color: CONTENT_INK }}
                        >
                          {cell}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing && (
          <div
            className="flex w-fit items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={t('canvas.dragTable')}
              title={t('canvas.dragTable')}
              onPointerDown={onPointerDown}
              className="flex h-8 w-5 touch-none items-center justify-center text-muted-foreground"
              style={{ cursor: CURSORS.grab }}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Button size="sm" variant="ghost" onClick={addRow} title={t('table.addRow')}>
              <Plus className="h-3.5 w-3.5" />
              {t('table.row')}
            </Button>
            <Button size="sm" variant="ghost" onClick={removeRow} title={t('table.removeRow')}>
              <Minus className="h-3.5 w-3.5" />
              {t('table.row')}
            </Button>
            <Button size="sm" variant="ghost" onClick={addColumn} title={t('table.addColumn')}>
              <Plus className="h-3.5 w-3.5" />
              {t('table.column')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={removeColumn}
              title={t('table.removeColumn')}
            >
              <Minus className="h-3.5 w-3.5" />
              {t('table.column')}
            </Button>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <Button size="sm" onClick={() => onEditingChange(null)}>
              {t('common.save')}
            </Button>
          </div>
        )}
      </div>
    </ItemShell>
  );
}
