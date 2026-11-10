import {
  Ask,
  CellState,
  HighlightState,
  Panel,
  RawWalkthrough,
  Step,
  TreePanelNode,
  Variables,
  Walkthrough,
} from '../types/code-lens.types';

const STATES: HighlightState[] = ['active', 'compare', 'swap', 'done', 'muted'];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHighlightState(value: unknown): value is HighlightState {
  return STATES.includes(value as HighlightState);
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Accepts both `{state: [keys]}` and `{key: state}` highlight shapes. */
function readHighlights(highlights: unknown, keyOf: (key: unknown) => string) {
  const stateByKey = new Map<string, CellState>();
  if (!isRecord(highlights)) return stateByKey;
  Object.entries(highlights).forEach(([name, value]) => {
    if (isHighlightState(name) && Array.isArray(value)) {
      value.forEach(key => stateByKey.set(keyOf(key), name));
    } else if (isHighlightState(value)) {
      stateByKey.set(keyOf(name), value);
    }
  });
  return stateByKey;
}

function readPointers(pointers: unknown, count: number): [string, number][] {
  const pairs: [string, unknown][] = [];
  if (Array.isArray(pointers)) {
    pointers.forEach(pointer => {
      if (isRecord(pointer)) pairs.push([toText(pointer.name), pointer.index ?? pointer.i]);
    });
  } else if (isRecord(pointers)) {
    Object.entries(pointers).forEach(pair => pairs.push(pair));
  }
  return pairs
    .map(([name, index]): [string, number] => [name.slice(0, 10), Number(index)])
    .filter(([name, index]) => name && Number.isInteger(index) && index >= 0 && index < count);
}

function readCellsPanel(raw: UnknownRecord, kind: string, name: string): Panel {
  const source = Array.isArray(raw.cells)
    ? raw.cells
    : typeof raw.cells === 'string'
      ? [...raw.cells]
      : asArray(raw.items);
  const cells = source.slice(0, 24).map(value => toText(value).slice(0, 8));
  const stateByKey = readHighlights(raw.hl, key => String(Number(key)));
  return {
    kind: kind === 'list' ? 'list' : 'array',
    name,
    cells,
    states: cells.map((_, index) => stateByKey.get(String(index)) ?? ''),
    pointers: readPointers(raw.ptrs, cells.length),
  };
}

function readMapPanel(raw: UnknownRecord, name: string): Panel {
  const source = Array.isArray(raw.entries)
    ? raw.entries
    : isRecord(raw.entries)
      ? Object.entries(raw.entries)
      : [];
  const seenKeys = new Set<string>();
  const stateByKey = readHighlights(raw.hl, toText);
  const entries = source
    .slice(0, 20)
    .map(entry =>
      Array.isArray(entry)
        ? { key: toText(entry[0]).slice(0, 12), value: toText(entry[1]).slice(0, 14) }
        : { key: toText(entry).slice(0, 12), value: '' },
    )
    .filter(entry => !seenKeys.has(entry.key) && seenKeys.add(entry.key))
    .map(entry => ({ ...entry, state: stateByKey.get(entry.key) ?? ('' as CellState) }));
  return { kind: 'map', name, entries };
}

function readSequencePanel(raw: UnknownRecord, kind: string, name: string): Panel {
  const source = Array.isArray(raw.items) ? raw.items : asArray(raw.cells);
  const items = source.slice(0, 18).map(value => toText(value).slice(0, 10));
  const stateByKey = readHighlights(raw.hl, key => String(Number(key)));
  return {
    kind: kind === 'stack' ? 'stack' : 'queue',
    name,
    items,
    states: items.map((_, index) => stateByKey.get(String(index)) ?? ''),
  };
}

function readGridPanel(raw: UnknownRecord, name: string): Panel | null {
  const source = Array.isArray(raw.rows) ? raw.rows : asArray(raw.cells);
  const rows = source
    .slice(0, 12)
    .map(row =>
      (Array.isArray(row) ? row : [row]).slice(0, 12).map(value => toText(value).slice(0, 5)),
    );
  if (!rows.length) return null;
  const stateByKey = readHighlights(raw.hl, key =>
    Array.isArray(key) ? `${key[0]},${key[1]}` : toText(key),
  );
  const labels = (value: unknown, count: number) =>
    Array.isArray(value) && value.length
      ? value.slice(0, count).map(label => toText(label).slice(0, 6))
      : null;
  return {
    kind: 'grid',
    name,
    rows,
    states: rows.map((row, rowIndex) =>
      row.map((_, column) => stateByKey.get(`${rowIndex},${column}`) ?? ''),
    ),
    rowLabels: labels(raw.rowLabels, rows.length),
    colLabels: labels(raw.colLabels, Math.max(...rows.map(row => row.length))),
  };
}

function readTreePanel(raw: UnknownRecord, name: string): Panel {
  const nodes = asArray(raw.nodes)
    .slice(0, 40)
    .filter(isRecord)
    .map(node => ({
      id: toText(node.id),
      value: toText(node.v ?? node.val ?? node.value).slice(0, 5),
      left: toText(node.l ?? node.left),
      right: toText(node.r ?? node.right),
    }))
    .filter(node => node.id);
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const stateByKey = readHighlights(raw.hl, toText);
  const rootId = nodeById.has(toText(raw.root)) ? toText(raw.root) : nodes[0]?.id;
  const placed: TreePanelNode[] = [];
  const visited = new Set<string>();
  let order = 0;
  // In-order walk gives each node its column; depth and size are capped to fit the stage.
  const walk = (id: string, depth: number, parent: string | null) => {
    const node = nodeById.get(id);
    if (!node || visited.has(id) || depth > 6 || placed.length >= 31) return;
    visited.add(id);
    walk(node.left, depth + 1, id);
    placed.push({
      id,
      value: node.value,
      depth,
      parent,
      order: order++,
      state: stateByKey.get(id) ?? '',
    });
    walk(node.right, depth + 1, id);
  };
  if (rootId) walk(rootId, 0, null);
  return { kind: 'tree', name, nodes: placed };
}

function readPanel(raw: unknown): Panel | null {
  if (!isRecord(raw)) return null;
  const kind = toText(raw.kind).toLowerCase();
  const name = toText(raw.name || kind).slice(0, 24);
  if (['array', 'list', 'string'].includes(kind)) return readCellsPanel(raw, kind, name);
  if (['map', 'dict', 'set', 'hashmap'].includes(kind)) return readMapPanel(raw, name);
  if (['stack', 'queue', 'deque'].includes(kind)) return readSequencePanel(raw, kind, name);
  if (['grid', 'matrix', 'table', 'dp'].includes(kind)) return readGridPanel(raw, name);
  if (kind === 'tree') return readTreePanel(raw, name);
  if (['text', 'value', 'result'].includes(kind)) {
    return { kind: 'text', name, value: toText(raw.value ?? raw.text).slice(0, 80) };
  }
  return null;
}

function readAsk(raw: unknown): Ask | undefined {
  if (!isRecord(raw) || !Array.isArray(raw.options)) return undefined;
  const options = [
    ...new Set(raw.options.map(option => toText(option).slice(0, 60)).filter(Boolean)),
  ].slice(0, 4);
  const answer = toText(raw.answer);
  const question = toText(raw.q ?? raw.question).slice(0, 200);
  return options.length >= 2 && options.includes(answer) && question
    ? { question, options, answer }
    : undefined;
}

function readStep(raw: unknown, codeLength: number): Step | null {
  if (!isRecord(raw)) return null;
  const vars: Variables = {};
  if (isRecord(raw.vars)) {
    Object.entries(raw.vars)
      .slice(0, 12)
      .forEach(([name, value]) => (vars[name.slice(0, 20)] = toText(value).slice(0, 80)));
  }
  const panels = asArray(raw.panels)
    .slice(0, 6)
    .map(readPanel)
    .filter((panel): panel is Panel => panel !== null);
  return {
    line: Math.min(codeLength - 1, Math.max(0, Math.round(Number(raw.line) || 1) - 1)),
    text: toText(raw.text).slice(0, 500),
    vars,
    expr: toText(raw.expr).slice(0, 90),
    scene: { type: 'panels', panels },
    ask: readAsk(raw.ask),
  };
}

const compact = (text: string) => text.replace(/[\s`'"]/g, '').toLowerCase();

/** Adds a closing step with the answer when the model's last step leaves it out. */
function withAnswerStep(steps: Step[], output: string): Step[] {
  const last = steps[steps.length - 1];
  const answer = compact(output);
  if (!last || !answer) return steps;
  const { panels } = last.scene;
  const isShown =
    compact(last.text).includes(answer) ||
    panels.some(panel => panel.kind === 'text' && compact(panel.value) === answer);
  if (isShown) return steps;
  return [
    ...steps,
    {
      line: last.line,
      text: `Done. The answer is \`${output}\`.`,
      vars: last.vars,
      scene: {
        type: 'panels',
        panels: [...panels, { kind: 'text', name: 'answer', value: output }],
      },
    },
  ];
}

/** Checks and trims model output into a playable walkthrough, or throws a user-facing Error. */
export function normalizeWalkthrough(raw: RawWalkthrough): Walkthrough {
  if (!isRecord(raw)) throw new Error('The answer did not contain a walkthrough. Try again.');
  if (raw.error) throw new Error(toText(raw.error));
  const codeSource = Array.isArray(raw.code) ? raw.code : toText(raw.code).split('\n');
  const code = codeSource
    .map(line => toText(line).replace(/\t/g, '    ').slice(0, 120))
    .slice(0, 40);
  if (!code.join('').trim()) throw new Error('The answer had no code. Try again.');
  const steps = asArray(raw.steps)
    .slice(0, 90)
    .map(step => readStep(step, code.length))
    .filter((step): step is Step => step !== null && Boolean(step.text));
  if (steps.length < 2) throw new Error('The walkthrough came back with too few steps. Try again.');
  // The header chips wrap, so long examples and answers are kept whole up to the backend's limit.
  const output = toText(raw.output).slice(0, 200);
  return {
    title: toText(raw.title).slice(0, 80) || 'Walkthrough',
    approach: toText(raw.approach).slice(0, 400),
    time: toText(raw.time).slice(0, 24),
    space: toText(raw.space).slice(0, 24),
    input: toText(raw.input).slice(0, 400),
    output,
    code,
    steps: withAnswerStep(steps, output),
  };
}
