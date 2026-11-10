import { CellState, Pointer } from '../types/code-lens.types';

export type NodeVariant = 'cell' | 'chip' | 'ghost';
export type EdgeVariant = 'plain' | 'on' | 'wall' | 'axis' | 'stem';
export type TagVariant = 'plain' | 'index' | 'heading' | 'value';

export interface DrawNode {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  label: string;
  state: CellState;
  variant: NodeVariant;
  fontSize: number;
  isLabelAbove?: boolean;
  /** Where a newly added node glides in from. */
  enter?: { x: number; y: number };
}

export interface DrawEdge {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  variant: EdgeVariant;
  state: CellState;
  hasArrow?: boolean;
}

export interface DrawTag {
  key: string;
  x: number;
  y: number;
  text: string;
  variant: TagVariant;
  isStartAligned?: boolean;
}

export interface Drawing {
  nodes: DrawNode[];
  edges: DrawEdge[];
  tags: DrawTag[];
  /** Height the panels scene needs; other scenes fill the stage. */
  height?: number;
}

type NodeInput = Omit<DrawNode, 'variant' | 'state'> & Partial<Pick<DrawNode, 'variant' | 'state'>>;
type EdgeInput = Omit<DrawEdge, 'variant' | 'state'> & Partial<Pick<DrawEdge, 'variant' | 'state'>>;

export const CHIP_ROW = 26;

/** Font size that fits `value` inside a cell `width` wide. */
export function fitFont(value: string | number, width: number) {
  return Math.max(10, Math.min(17, width * 0.38, (width - 8) / (String(value).length * 0.64)));
}

/** How many pointer pills stack under the busiest cell. */
export function pointerDepth(pointers: Pointer[]) {
  const countByIndex = new Map<number, number>();
  let depth = 0;
  pointers.forEach(({ index }) => {
    if (index === null) return;
    const count = (countByIndex.get(index) ?? 0) + 1;
    countByIndex.set(index, count);
    depth = Math.max(depth, count);
  });
  return depth;
}

export class DrawingBuilder {
  readonly drawing: Drawing = { nodes: [], edges: [], tags: [] };

  node(node: NodeInput) {
    this.drawing.nodes.push({ variant: 'cell', state: '', ...node });
  }

  edge(edge: EdgeInput) {
    this.drawing.edges.push({ variant: 'plain', state: '', ...edge });
  }

  tag(
    key: string,
    x: number,
    y: number,
    text: string | number,
    variant: TagVariant = 'plain',
    isStartAligned = false,
  ) {
    this.drawing.tags.push({ key, x, y, text: String(text), variant, isStartAligned });
  }

  /** Pointer pills hanging under cells, stacked when several share a cell. */
  pointers(
    pointers: Pointer[],
    xOf: (index: number) => number,
    top: number,
    stateOf: (index: number) => CellState,
    prefix = '',
  ) {
    const countByIndex = new Map<number, number>();
    pointers.forEach(({ name, index }) => {
      if (index === null) return;
      const row = (countByIndex.get(index) ?? 0) + 1;
      countByIndex.set(index, row);
      const x = xOf(index);
      const width = 16 + name.length * 7.6;
      const y = top + 10 + (row - 1) * CHIP_ROW;
      const state = stateOf(index) || '';
      this.edge({
        key: `${prefix}ps-${name}`,
        x1: x,
        y1: top,
        x2: x,
        y2: y,
        variant: 'stem',
        state,
      });
      this.node({
        key: `${prefix}pc-${name}`,
        x: x - width / 2,
        y,
        width,
        height: 20,
        radius: 6,
        label: name,
        variant: 'chip',
        state,
        fontSize: 12,
      });
    });
  }
}
