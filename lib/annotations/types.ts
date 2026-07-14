export type ToolId = 'select' | 'text' | 'sticky' | 'button' | 'table' | 'image' | 'delete';

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
  TextAnnotation | StickyAnnotation | ButtonAnnotation | TableAnnotation | ImageAnnotation;

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
