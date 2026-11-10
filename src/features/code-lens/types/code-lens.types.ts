export type HighlightState = 'active' | 'compare' | 'swap' | 'done' | 'muted';
export type CellState = HighlightState | '';

export type VariableValue = string | number;
export type Variables = Record<string, VariableValue>;

export interface Pointer {
  name: string;
  index: number | null;
}

export interface CellsPanel {
  kind: 'array' | 'list';
  name: string;
  cells: string[];
  states: CellState[];
  pointers: [string, number][];
}

export interface MapPanel {
  kind: 'map';
  name: string;
  entries: { key: string; value: string; state: CellState }[];
}

export interface SequencePanel {
  kind: 'stack' | 'queue';
  name: string;
  items: string[];
  states: CellState[];
}

export interface GridPanel {
  kind: 'grid';
  name: string;
  rows: string[][];
  states: CellState[][];
  rowLabels: string[] | null;
  colLabels: string[] | null;
}

export interface TreePanelNode {
  id: string;
  value: string;
  depth: number;
  order: number;
  parent: string | null;
  state: CellState;
}

export interface TreePanel {
  kind: 'tree';
  name: string;
  nodes: TreePanelNode[];
}

export interface TextPanel {
  kind: 'text';
  name: string;
  value: string;
}

export type Panel = CellsPanel | MapPanel | SequencePanel | GridPanel | TreePanel | TextPanel;

export interface PanelsScene {
  type: 'panels';
  panels: Panel[];
}

export type Scene = PanelsScene;

export interface Ask {
  question: string;
  options: string[];
  answer: string;
}

export interface Step {
  /** 0-based line in the code panel. */
  line: number;
  text: string;
  vars: Variables;
  expr?: string;
  scene: Scene;
  ask?: Ask;
}

export interface HudItem {
  name: string;
  value?: VariableValue;
  state: HighlightState;
}

export interface LegendEntry {
  state: HighlightState;
  label: string;
}

export interface Fact {
  label: string;
  value: string;
}

/** Everything the player needs to show one run, whether built in or made by AI. */
export interface Track {
  id: string;
  group: string;
  title: string;
  idea: string;
  facts: Fact[];
  legend: LegendEntry[];
  code: string[];
  /** Big-O time and space, such as "O(n)"; empty when the model left them out. */
  time: string;
  space: string;
  /** The example being traced, which the student can change. */
  input: string;
  /** The final result, shown on the stage once playback reaches the last step. */
  answer: string;
  hud(vars: Variables): HudItem[];
}

export interface Run {
  /** Changes whenever the steps change, so the player and stage start over. */
  id: string;
  track: Track;
  steps: Step[];
}

export interface Walkthrough {
  title: string;
  approach: string;
  time: string;
  space: string;
  input: string;
  output: string;
  code: string[];
  steps: Step[];
}

/** One saved walkthrough in the shared library, without its steps. */
export interface LibraryItem {
  id: number;
  title: string;
  /** True only in the browser that created it. */
  canDelete: boolean;
  problem: string;
  example: string;
}

/** What the student typed: the problem and the optional example to trace. */
export interface ProblemDraft {
  problem: string;
  example: string;
}

export interface WalkthroughRequest {
  problem: string;
  example: string;
}

/** The raw JSON the model returns, before it is checked and trimmed. */
export type RawWalkthrough = Record<string, unknown>;
