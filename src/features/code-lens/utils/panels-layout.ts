import {
  CellState,
  CellsPanel,
  GridPanel,
  MapPanel,
  Panel,
  SequencePanel,
  TreePanel,
} from '../types/code-lens.types';
import { CHIP_ROW, DrawingBuilder, fitFont, pointerDepth } from './drawing-builder';

const LEFT = 16;
const CELL_GAP = 6;

interface PanelContext {
  draw: DrawingBuilder;
  key(part: string): string;
  available: number;
  right: number;
  y: number;
}

function captionOf(panel: Panel) {
  if (panel.kind === 'stack') return `${panel.name}  (top on the right)`;
  if (panel.kind === 'queue') return `${panel.name}  (front on the left)`;
  return panel.name;
}

function drawEmpty(context: PanelContext) {
  context.draw.tag(context.key('empty'), LEFT, context.y + 10, 'empty', 'plain', true);
  context.y += 26;
}

function drawCells(panel: CellsPanel, context: PanelContext) {
  const { draw, key, available } = context;
  const count = panel.cells.length;
  if (!count) return drawEmpty(context);
  const isList = panel.kind === 'list';
  const minCell = isList ? 30 : 24;
  const link = isList ? 20 : CELL_GAP;
  const columns = Math.max(1, Math.min(count, Math.floor((available + link) / (minCell + link))));
  const cell = Math.max(
    minCell,
    Math.min(isList ? 50 : 54, (available - (columns - 1) * link) / columns),
  );
  const rows = Math.ceil(count / columns);
  for (let row = 0; row < rows; row++) {
    const from = row * columns;
    const to = Math.min(count, from + columns);
    const xOf = (index: number) => LEFT + (index - from) * (cell + link) + cell / 2;
    const y = context.y;
    for (let index = from; index < to; index++) {
      draw.node({
        key: key(`c${index}`),
        x: xOf(index) - cell / 2,
        y,
        width: cell,
        height: cell,
        radius: 8,
        label: panel.cells[index],
        state: panel.states[index],
        fontSize: fitFont(panel.cells[index], cell),
      });
      if (!isList) draw.tag(key(`ix${index}`), xOf(index), y + cell + 12, index, 'index');
      if (isList && index < to - 1) {
        draw.edge({
          key: key(`a${index}`),
          x1: xOf(index) + cell / 2 + 3,
          y1: y + cell / 2,
          x2: xOf(index + 1) - cell / 2 - 3,
          y2: y + cell / 2,
          variant: 'on',
          hasArrow: true,
        });
      }
    }
    const rowPointers = panel.pointers
      .filter(([, index]) => index >= from && index < to)
      .map(([name, index]) => ({ name, index }));
    const top = y + cell + (isList ? 4 : 22);
    draw.pointers(rowPointers, xOf, top, index => panel.states[index], key(''));
    const depth = pointerDepth(rowPointers);
    context.y = top + (depth ? 10 + depth * CHIP_ROW : 0) + 6;
  }
}

/** Lays out pills left to right, wrapping onto new rows when the line is full. */
function drawPills(
  context: PanelContext,
  pills: { key: string; label: string; state: CellState; width: number }[],
  gap: number,
  height: number,
  radius: number,
  fontSize: number,
) {
  let x = LEFT;
  pills.forEach(pill => {
    if (x + pill.width > context.right && x > LEFT) {
      x = LEFT;
      context.y += 40;
    }
    context.draw.node({
      key: pill.key,
      x,
      y: context.y,
      width: pill.width,
      height,
      radius,
      label: pill.label,
      state: pill.state,
      fontSize,
    });
    x += pill.width + gap;
  });
  context.y += 42;
}

function drawMap(panel: MapPanel, context: PanelContext) {
  if (!panel.entries.length) return drawEmpty(context);
  const pills = panel.entries.map(entry => {
    const label = entry.value === '' ? entry.key : `${entry.key} : ${entry.value}`;
    return {
      key: context.key(`k:${entry.key}`),
      label,
      state: entry.state,
      width: Math.min(context.available, 22 + label.length * 7.9),
    };
  });
  drawPills(context, pills, 8, 32, 8, 13);
}

function drawSequence(panel: SequencePanel, context: PanelContext) {
  if (!panel.items.length) return drawEmpty(context);
  const pills = panel.items.map((item, index) => ({
    key: context.key(`s${index}`),
    label: item,
    state: panel.states[index],
    width: Math.max(36, 20 + item.length * 8.4),
  }));
  drawPills(context, pills, 6, 32, 7, 14);
}

function drawGrid(panel: GridPanel, context: PanelContext) {
  const { draw, key, available } = context;
  const columns = Math.max(...panel.rows.map(row => row.length));
  const labelWidth = panel.rowLabels
    ? 12 + Math.max(...panel.rowLabels.map(label => label.length)) * 7.2
    : 0;
  const cell = Math.max(20, Math.min(46, (available - labelWidth - (columns - 1) * 4) / columns));
  const startX = LEFT + labelWidth;
  if (panel.colLabels) {
    panel.colLabels.forEach((label, column) =>
      draw.tag(
        key(`cl${column}`),
        startX + column * (cell + 4) + cell / 2,
        context.y + 6,
        label,
        'index',
      ),
    );
    context.y += 18;
  }
  const top = context.y;
  panel.rows.forEach((row, rowIndex) => {
    const rowLabel = panel.rowLabels?.[rowIndex];
    if (rowLabel !== undefined) {
      draw.tag(
        key(`rl${rowIndex}`),
        startX - 8,
        top + rowIndex * (cell + 4) + cell / 2,
        rowLabel,
        'index',
      );
    }
    row.forEach((value, column) =>
      draw.node({
        key: key(`g${rowIndex},${column}`),
        x: startX + column * (cell + 4),
        y: top + rowIndex * (cell + 4),
        width: cell,
        height: cell,
        radius: 6,
        label: value,
        state: panel.states[rowIndex][column],
        fontSize: fitFont(value, cell),
      }),
    );
  });
  context.y += panel.rows.length * (cell + 4) + 6;
}

function drawTree(panel: TreePanel, context: PanelContext) {
  const { draw, key, available } = context;
  if (!panel.nodes.length) return drawEmpty(context);
  const slot = Math.min(66, available / panel.nodes.length);
  const radius = Math.max(13, Math.min(22, slot * 0.42));
  const rowGap = Math.max(46, radius * 2 + 18);
  const top = context.y;
  const pointById = new Map(
    panel.nodes.map(node => [
      node.id,
      [LEFT + slot * (node.order + 0.5), top + radius + node.depth * rowGap],
    ]),
  );
  panel.nodes.forEach(node => {
    const [x, y] = pointById.get(node.id) as number[];
    const parentPoint = node.parent ? pointById.get(node.parent) : undefined;
    if (parentPoint) {
      const [parentX, parentY] = parentPoint;
      const dx = x - parentX;
      const dy = y - parentY;
      const length = Math.hypot(dx, dy);
      draw.edge({
        key: key(`e${node.id}`),
        x1: parentX + (dx / length) * radius,
        y1: parentY + (dy / length) * radius,
        x2: x - (dx / length) * radius,
        y2: y - (dy / length) * radius,
        variant: 'on',
      });
    }
    draw.node({
      key: key(`n${node.id}`),
      x: x - radius,
      y: y - radius,
      width: 2 * radius,
      height: 2 * radius,
      radius,
      label: node.value,
      state: node.state,
      fontSize: fitFont(node.value, 2 * radius),
    });
  });
  context.y += 2 * radius + Math.max(...panel.nodes.map(node => node.depth)) * rowGap + 8;
}

/** Stacks every panel top to bottom and records the total height on the drawing. */
export function layoutPanels(panels: Panel[], width: number, draw: DrawingBuilder) {
  if (!panels.length) {
    draw.tag('none', width / 2, 30, 'Nothing to draw at this step');
    draw.drawing.height = 60;
    return;
  }
  const usedNames = new Set<string>();
  const context: PanelContext = {
    draw,
    key: part => part,
    available: width - 32,
    right: width - LEFT,
    y: 2,
  };
  panels.forEach((panel, panelIndex) => {
    // Two panels with one name would share keys and animate into each other.
    const id = usedNames.has(panel.name) ? `${panel.name}#${panelIndex}` : panel.name;
    usedNames.add(panel.name);
    context.key = part => `${id}|${part}`;
    draw.tag(context.key('label'), LEFT, context.y + 8, captionOf(panel), 'heading', true);
    context.y += 26;
    switch (panel.kind) {
      case 'array':
      case 'list':
        drawCells(panel, context);
        break;
      case 'map':
        drawMap(panel, context);
        break;
      case 'stack':
      case 'queue':
        drawSequence(panel, context);
        break;
      case 'grid':
        drawGrid(panel, context);
        break;
      case 'tree':
        drawTree(panel, context);
        break;
      case 'text':
        draw.tag(context.key('v'), LEFT, context.y + 8, panel.value || '-', 'value', true);
        context.y += 26;
        break;
    }
    context.y += 14;
  });
  draw.drawing.height = context.y;
}
