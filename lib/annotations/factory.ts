import type {
  AnnotationStyle,
  ArrowAnnotation,
  BrushAnnotation,
  ButtonAnnotation,
  HighlightAnnotation,
  ImageAnnotation,
  Point,
  StickyAnnotation,
  TableAnnotation,
  TextAnchor,
  TextAnnotation,
  TextMarkAnnotation,
} from './types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_TABLE_ROWS = 2;
const DEFAULT_TABLE_COLUMNS = 3;
export const DEFAULT_TEXT_WIDTH = 260;

function baseFields(x: number, y: number, style: AnnotationStyle) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    position: { x, y },
    style,
    createdAt: now,
    updatedAt: now,
  };
}

export function createBrushAnnotation(points: number[], style: AnnotationStyle): BrushAnnotation {
  return {
    ...baseFields(points[0], points[1], style),
    type: 'brush',
    points,
  };
}

export function createHighlightAnnotation(rect: Rect, style: AnnotationStyle): HighlightAnnotation {
  return {
    ...baseFields(rect.x, rect.y, style),
    type: 'highlight',
    width: rect.width,
    height: rect.height,
  };
}

export function createTextMarkAnnotation(
  text: TextAnchor,
  position: Point,
  color: string,
): TextMarkAnnotation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    type: 'textmark',
    anchor: { text, position },
    style: { color, strokeWidth: 0, opacity: 1 },
    bold: false,
    italic: false,
    note: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function createTextAnnotation(point: Point, style: AnnotationStyle): TextAnnotation {
  return {
    ...baseFields(point.x, point.y, style),
    type: 'text',
    html: '',
    width: DEFAULT_TEXT_WIDTH,
  };
}

export function createStickyAnnotation(point: Point, style: AnnotationStyle): StickyAnnotation {
  return {
    ...baseFields(point.x, point.y, style),
    type: 'sticky',
    text: '',
  };
}

export function createButtonAnnotation(point: Point, style: AnnotationStyle): ButtonAnnotation {
  return {
    ...baseFields(point.x, point.y, style),
    type: 'button',
    label: '',
    url: '',
  };
}

export function createArrowAnnotation(
  from: Point,
  to: Point,
  style: AnnotationStyle,
): ArrowAnnotation {
  return {
    ...baseFields(from.x, from.y, style),
    type: 'arrow',
    to,
  };
}

export function createTableAnnotation(point: Point, style: AnnotationStyle): TableAnnotation {
  return {
    ...baseFields(point.x, point.y, style),
    type: 'table',
    cells: Array.from({ length: DEFAULT_TABLE_ROWS }, () =>
      Array.from({ length: DEFAULT_TABLE_COLUMNS }, () => ''),
    ),
  };
}

export function createImageAnnotation(
  point: Point,
  dataUrl: string,
  width: number,
  height: number,
  style: AnnotationStyle,
): ImageAnnotation {
  return {
    ...baseFields(point.x, point.y, style),
    type: 'image',
    dataUrl,
    width,
    height,
  };
}
