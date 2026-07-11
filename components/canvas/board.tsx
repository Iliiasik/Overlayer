import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useElementSize } from '@/hooks/use-element-size';
import {
  BOARD_SIZE,
  clampToBoard,
  fitBounds,
  isDefaultCamera,
  panBy,
  zoomAt,
  type Camera,
} from '@/lib/canvas/camera';
import { CURSORS } from '@/lib/cursors';
import { isEditableElement, isEditableEventTarget } from '@/lib/dom';
import type { AnnotationStyle, CanvasItem, Point, ToolId } from '@/lib/annotations/types';
import { ItemsLayer } from './items-layer';
import type { SheetBounds } from './items/sheet';
import { Minimap } from './minimap';
import { ShapesLayer, type PlacementTool } from './shapes-layer';
import { ZoomControls } from './zoom-controls';

const BOARD_BOUNDS: SheetBounds = {
  width: BOARD_SIZE.width,
  height: BOARD_SIZE.height,
  padding: 0,
};

interface BoardProps {
  items: CanvasItem[];
  camera: Camera;
  onCameraChange: (updater: (camera: Camera) => Camera) => void;
  tool: ToolId;
  style: AnnotationStyle;
  active: boolean;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onAdd: (item: CanvasItem) => void;
  onPatch: (id: string, changes: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
  onTranslate: (id: string, dx: number, dy: number) => void;
  onPlace: (tool: PlacementTool, point: Point) => void;
  onErase: (point: Point) => void;
  onOpenLink: (url: string) => void;
  onContextMenu: (id: string, point: Point) => void;
}

const TOOL_CURSORS: Partial<Record<ToolId, string>> = {
  select: CURSORS.arrow,
  brush: CURSORS.pen,
  highlight: CURSORS.crosshair,
  arrow: CURSORS.crosshair,
  text: 'text',
  sticky: CURSORS.add,
  button: CURSORS.add,
  table: CURSORS.add,
  image: CURSORS.add,
  eraser: CURSORS.eraser,
  delete: CURSORS.remove,
};

const BACKDROP_COLOR = 'color-mix(in oklab, var(--muted) 70%, var(--background))';
const GRID_COLOR = 'var(--sheet-grid)';
const GRID_SIZE = 24;
const GRID_MIN_SCALE = 0.4;

export function Board({
  items,
  camera,
  onCameraChange,
  tool,
  style,
  active,
  editingId,
  onEditingChange,
  onAdd,
  onPatch,
  onRemove,
  onTranslate,
  onPlace,
  onErase,
  onOpenLink,
  onContextMenu,
}: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const initializedRef = useRef(false);
  const size = useElementSize(containerRef);
  const sizeRef = useRef(size);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const changeCamera = useCallback(
    (updater: (camera: Camera) => Camera) => {
      onCameraChange((current) => clampToBoard(updater(current), sizeRef.current, BOARD_SIZE));
    },
    [onCameraChange],
  );

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      onCameraChange((current) =>
        clampToBoard(
          isDefaultCamera(current) ? fitBounds({ x: 0, y: 0, ...BOARD_SIZE }, size, 24) : current,
          size,
          BOARD_SIZE,
        ),
      );
      return;
    }
    onCameraChange((current) => clampToBoard(current, size, BOARD_SIZE));
  }, [size, onCameraChange]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = node.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        changeCamera((current) => zoomAt(current, point, Math.exp(-event.deltaY * 0.01)));
      } else {
        const swap = event.shiftKey && event.deltaX === 0;
        const dx = swap ? event.deltaY : event.deltaX;
        const dy = swap ? 0 : event.deltaY;
        changeCamera((current) => panBy(current, -dx, -dy));
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [changeCamera]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !hoverRef.current || isEditableEventTarget(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setSpaceHeld(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      setSpaceHeld(false);
    };
  }, [active]);

  const startPan = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPanning(true);
    let lastX = event.clientX;
    let lastY = event.clientY;
    const onMove = (move: PointerEvent) => {
      changeCamera((current) => panBy(current, move.clientX - lastX, move.clientY - lastY));
      lastX = move.clientX;
      lastY = move.clientY;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setPanning(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const gridVisible = camera.scale >= GRID_MIN_SCALE;
  const cursor = panning ? 'grabbing' : spaceHeld ? 'grab' : (TOOL_CURSORS[tool] ?? 'default');

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ cursor, backgroundColor: BACKDROP_COLOR }}
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
      onPointerDownCapture={(event) => {
        if (event.button === 1) startPan(event);
      }}
      onContextMenu={(event) => {
        if (!isEditableElement(event.target)) event.preventDefault();
      }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          style={{
            width: BOARD_SIZE.width,
            height: BOARD_SIZE.height,
            backgroundColor: 'var(--sheet)',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.08), 0 12px 40px rgba(0, 0, 0, 0.14)',
            backgroundImage: gridVisible
              ? `radial-gradient(circle, ${GRID_COLOR} 1px, transparent 1px)`
              : undefined,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        />
      </div>
      <ShapesLayer
        items={items}
        tool={tool}
        style={style}
        camera={camera}
        size={size}
        board={BOARD_SIZE}
        onAdd={onAdd}
        onRemove={onRemove}
        onTranslate={onTranslate}
        onPlace={onPlace}
        onErase={onErase}
        onBlankPointerDown={() => onEditingChange(null)}
        onContextMenu={onContextMenu}
      />
      <ItemsLayer
        items={items}
        tool={tool}
        camera={camera}
        editingId={editingId}
        onEditingChange={onEditingChange}
        onPatch={onPatch}
        onRemove={onRemove}
        onTranslate={onTranslate}
        onOpenLink={onOpenLink}
        onContextMenu={onContextMenu}
        bounds={BOARD_BOUNDS}
      />
      {spaceHeld && (
        <div
          className="absolute inset-0 touch-none"
          role="presentation"
          onPointerDown={(event) => {
            if (event.button === 0) startPan(event);
          }}
        />
      )}
      <Minimap
        items={items}
        camera={camera}
        viewport={size}
        board={BOARD_SIZE}
        onCameraChange={changeCamera}
      />
      <ZoomControls
        camera={camera}
        viewport={size}
        board={BOARD_SIZE}
        onCameraChange={changeCamera}
      />
    </div>
  );
}
