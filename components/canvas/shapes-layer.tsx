import type { KonvaEventObject } from 'konva/lib/Node';
import { useMemo, useState } from 'react';
import { Arrow, Layer, Path, Rect, Stage } from 'react-konva';
import { clampPointToBoard, toWorld, type Camera, type Size } from '@/lib/canvas/camera';
import { brushOutline, outlineToPath } from '@/lib/annotations/svg';
import {
  createArrowAnnotation,
  createBrushAnnotation,
  createHighlightAnnotation,
} from '@/lib/annotations/factory';
import { HIGHLIGHT_OPACITY } from '@/lib/annotations/palette';
import type {
  AnnotationStyle,
  BrushAnnotation,
  CanvasItem,
  Point,
  ToolId,
} from '@/lib/annotations/types';

export type PlacementTool = 'sticky' | 'text' | 'button' | 'table' | 'image';

interface ShapesLayerProps {
  items: CanvasItem[];
  tool: ToolId;
  style: AnnotationStyle;
  camera: Camera;
  size: Size;
  board: Size;
  onAdd: (item: CanvasItem) => void;
  onRemove: (id: string) => void;
  onTranslate: (id: string, dx: number, dy: number) => void;
  onPlace: (tool: PlacementTool, point: Point) => void;
  onErase: (point: Point) => void;
  onBlankPointerDown: () => void;
  onContextMenu: (id: string, point: Point) => void;
}

interface DraftRect {
  originX: number;
  originY: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraftArrow {
  from: Point;
  to: Point;
}

const MIN_HIGHLIGHT_SIZE = 4;
const MIN_ARROW_LENGTH = 8;
const PLACEMENT_TOOLS = new Set<ToolId>(['sticky', 'text', 'button', 'table', 'image']);

function normalizeRect(draft: DraftRect): DraftRect {
  return {
    ...draft,
    x: Math.min(draft.originX, draft.x),
    y: Math.min(draft.originY, draft.y),
    width: Math.abs(draft.x - draft.originX),
    height: Math.abs(draft.y - draft.originY),
  };
}

export function ShapesLayer({
  items,
  tool,
  style,
  camera,
  size,
  board,
  onAdd,
  onRemove,
  onTranslate,
  onPlace,
  onErase,
  onBlankPointerDown,
  onContextMenu,
}: ShapesLayerProps) {
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const [draftRect, setDraftRect] = useState<DraftRect | null>(null);
  const [draftArrow, setDraftArrow] = useState<DraftArrow | null>(null);

  const interactive = tool === 'select' || tool === 'delete';

  const worldPointer = (event: KonvaEventObject<PointerEvent>): Point | null => {
    const pointer = event.target.getStage()?.getPointerPosition();
    return pointer ? clampPointToBoard(toWorld(camera, pointer), board) : null;
  };

  const coalescedWorldPoints = (event: KonvaEventObject<PointerEvent>): number[] => {
    const stage = event.target.getStage();
    if (!stage) return [];
    const rect = stage.container().getBoundingClientRect();
    const raw = event.evt.getCoalescedEvents?.() ?? [];
    const events = raw.length > 0 ? raw : [event.evt];
    const points: number[] = [];
    for (const move of events) {
      const world = clampPointToBoard(
        toWorld(camera, { x: move.clientX - rect.left, y: move.clientY - rect.top }),
        board,
      );
      points.push(world.x, world.y);
    }
    return points;
  };

  const handlePointerDown = (event: KonvaEventObject<PointerEvent>) => {
    if (event.evt.button !== 0) return;
    const point = worldPointer(event);
    if (!point) return;
    if (event.target === event.target.getStage()) onBlankPointerDown();
    if (tool === 'brush') setDraftPoints([point.x, point.y]);
    if (tool === 'highlight') {
      setDraftRect({ originX: point.x, originY: point.y, ...point, width: 0, height: 0 });
    }
    if (tool === 'arrow') setDraftArrow({ from: point, to: point });
    if (PLACEMENT_TOOLS.has(tool)) onPlace(tool as PlacementTool, point);
    if (tool === 'eraser') onErase(point);
  };

  const handlePointerMove = (event: KonvaEventObject<PointerEvent>) => {
    if (tool === 'brush' && draftPoints) {
      const additions = coalescedWorldPoints(event);
      if (additions.length > 0) setDraftPoints([...draftPoints, ...additions]);
      return;
    }
    const point = worldPointer(event);
    if (!point) return;
    if (tool === 'highlight' && draftRect) {
      setDraftRect(normalizeRect({ ...draftRect, x: point.x, y: point.y }));
    }
    if (tool === 'arrow' && draftArrow) setDraftArrow({ ...draftArrow, to: point });
    if (tool === 'eraser' && event.evt.buttons === 1) onErase(point);
  };

  const handlePointerUp = () => {
    if (draftPoints && draftPoints.length >= 2) {
      onAdd(createBrushAnnotation(draftPoints, { ...style }));
    }
    if (
      draftRect &&
      draftRect.width >= MIN_HIGHLIGHT_SIZE &&
      draftRect.height >= MIN_HIGHLIGHT_SIZE
    ) {
      onAdd(createHighlightAnnotation(draftRect, { ...style, opacity: HIGHLIGHT_OPACITY }));
    }
    if (draftArrow) {
      const length = Math.hypot(
        draftArrow.to.x - draftArrow.from.x,
        draftArrow.to.y - draftArrow.from.y,
      );
      if (length >= MIN_ARROW_LENGTH) {
        onAdd(createArrowAnnotation(draftArrow.from, draftArrow.to, { ...style }));
      }
    }
    setDraftPoints(null);
    setDraftRect(null);
    setDraftArrow(null);
  };

  const shapeHandlers = (id: string, origin: Point) => ({
    onPointerDown: (event: KonvaEventObject<PointerEvent>) => {
      if (tool === 'delete' && event.evt.button === 0) onRemove(id);
    },
    onPointerMove: (event: KonvaEventObject<PointerEvent>) => {
      if (tool === 'delete' && event.evt.buttons === 1) onRemove(id);
    },
    onContextMenu: (event: KonvaEventObject<PointerEvent>) => {
      event.evt.preventDefault();
      event.cancelBubble = true;
      onContextMenu(id, { x: event.evt.clientX, y: event.evt.clientY });
    },
    onDragEnd: (event: KonvaEventObject<DragEvent>) => {
      const node = event.target;
      const { x, y } = node.position();
      node.position(origin);
      onTranslate(id, x - origin.x, y - origin.y);
    },
  });

  const brushShapes = useMemo(
    () =>
      items
        .filter((item): item is BrushAnnotation => item.type === 'brush')
        .map((item) => ({
          item,
          path: outlineToPath(brushOutline(item.points, item.style.strokeWidth)),
        })),
    [items],
  );

  return (
    <Stage
      width={size.width}
      height={size.height}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <Layer x={camera.x} y={camera.y} scaleX={camera.scale} scaleY={camera.scale}>
        {items.map((item) => {
          if (item.type === 'highlight') {
            return (
              <Rect
                key={item.id}
                x={item.position.x}
                y={item.position.y}
                width={item.width}
                height={item.height}
                fill={item.style.color}
                opacity={item.style.opacity}
                cornerRadius={2}
                draggable={tool === 'select'}
                listening={interactive}
                {...shapeHandlers(item.id, item.position)}
              />
            );
          }
          if (item.type === 'arrow') {
            return (
              <Arrow
                key={item.id}
                points={[item.position.x, item.position.y, item.to.x, item.to.y]}
                stroke={item.style.color}
                fill={item.style.color}
                strokeWidth={item.style.strokeWidth}
                opacity={item.style.opacity}
                pointerLength={item.style.strokeWidth * 2.5}
                pointerWidth={item.style.strokeWidth * 2.5}
                lineCap="round"
                hitStrokeWidth={12}
                draggable={tool === 'select'}
                listening={interactive}
                {...shapeHandlers(item.id, { x: 0, y: 0 })}
              />
            );
          }
          return null;
        })}
        {brushShapes.map(({ item, path }) => (
          <Path
            key={item.id}
            data={path}
            fill={item.style.color}
            opacity={item.style.opacity}
            draggable={tool === 'select'}
            listening={interactive}
            {...shapeHandlers(item.id, { x: 0, y: 0 })}
          />
        ))}
        {draftPoints && (
          <Path
            data={outlineToPath(brushOutline(draftPoints, style.strokeWidth))}
            fill={style.color}
            opacity={style.opacity}
            listening={false}
          />
        )}
        {draftRect && (
          <Rect
            x={draftRect.x}
            y={draftRect.y}
            width={draftRect.width}
            height={draftRect.height}
            fill={style.color}
            opacity={HIGHLIGHT_OPACITY}
            cornerRadius={2}
            listening={false}
          />
        )}
        {draftArrow && (
          <Arrow
            points={[draftArrow.from.x, draftArrow.from.y, draftArrow.to.x, draftArrow.to.y]}
            stroke={style.color}
            fill={style.color}
            strokeWidth={style.strokeWidth}
            pointerLength={style.strokeWidth * 2.5}
            pointerWidth={style.strokeWidth * 2.5}
            lineCap="round"
            listening={false}
          />
        )}
      </Layer>
    </Stage>
  );
}
