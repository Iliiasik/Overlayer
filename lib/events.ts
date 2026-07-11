import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';

export const isolateEvents = {
  onKeyDown: (event: ReactKeyboardEvent) => event.stopPropagation(),
  onKeyUp: (event: ReactKeyboardEvent) => event.stopPropagation(),
  onMouseDown: (event: ReactMouseEvent) => event.stopPropagation(),
  onMouseUp: (event: ReactMouseEvent) => event.stopPropagation(),
  onClick: (event: ReactMouseEvent) => event.stopPropagation(),
  onPointerDown: (event: ReactPointerEvent) => event.stopPropagation(),
};
