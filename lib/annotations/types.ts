export type ToolId =
  | 'select'
  | 'brush'
  | 'highlight'
  | 'text'
  | 'sticky'
  | 'button'
  | 'arrow'
  | 'table'
  | 'image'
  | 'eraser'
  | 'delete';

export interface Point {
  x: number;
  y: number;
}

export interface TextAnchor {
  quote: string;
  prefix: string;
  suffix: string;
}

export interface MarkAnchor {
  text?: TextAnchor;
  position: Point;
}

export interface AnnotationStyle {
  color: string;
  strokeWidth: number;
  opacity: number;
}

interface ItemBase {
  id: string;
  position: Point;
  style: AnnotationStyle;
  createdAt: number;
  updatedAt: number;
}

export interface BrushAnnotation extends ItemBase {
  type: 'brush';
  points: number[];
}

export interface HighlightAnnotation extends ItemBase {
  type: 'highlight';
  width: number;
  height: number;
}

export interface TextAnnotation extends ItemBase {
  type: 'text';
  html: string;
  width: number;
}

export interface StickyAnnotation extends ItemBase {
  type: 'sticky';
  text: string;
}

export interface ButtonAnnotation extends ItemBase {
  type: 'button';
  label: string;
  url: string;
  icon?: string;
}

export interface ArrowAnnotation extends ItemBase {
  type: 'arrow';
  to: Point;
}

export interface TableAnnotation extends ItemBase {
  type: 'table';
  cells: string[][];
}

export interface ImageAnnotation extends ItemBase {
  type: 'image';
  dataUrl: string;
  width: number;
  height: number;
}

export type CanvasItem =
  | BrushAnnotation
  | HighlightAnnotation
  | TextAnnotation
  | StickyAnnotation
  | ButtonAnnotation
  | ArrowAnnotation
  | TableAnnotation
  | ImageAnnotation;

export interface TextMarkAnnotation {
  id: string;
  type: 'textmark';
  anchor: MarkAnchor;
  style: AnnotationStyle;
  bold: boolean;
  italic: boolean;
  note: string;
  createdAt: number;
  updatedAt: number;
}
