import { CellState, HighlightState } from '../types/code-lens.types';
import { EdgeVariant, NodeVariant, TagVariant } from '../utils/drawing-builder';

export const CARD = 'rounded-[20px] border border-line bg-panel shadow-card min-w-0';
export const CAPS_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3';
export const BUTTON =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-2 px-4 font-semibold hover:border-line-2 disabled:cursor-not-allowed disabled:opacity-45';
export const BUTTON_PRIMARY =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-accent bg-accent px-4 font-semibold text-accent-ink shadow-[0_8px_22px_-10px_var(--color-glow-accent)] disabled:cursor-not-allowed disabled:opacity-45';
export const PILL =
  'inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3.5 font-medium text-ink-2 hover:border-line-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:font-semibold aria-pressed:text-accent-ink aria-pressed:shadow-[0_6px_18px_-8px_var(--color-glow-accent)]';
export const ROUND_BUTTON =
  'grid size-10 place-items-center rounded-full border border-line bg-panel-2 text-ink-2 hover:border-line-2 hover:text-ink';
export const FIELD =
  'h-[42px] w-full min-w-0 rounded-xl border border-line bg-panel-2 px-3 font-mono text-sm outline-none focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)]';
export const INLINE_CODE =
  'rounded-md border border-line bg-panel-2 px-1.5 py-px font-mono text-[0.88em] font-semibold';

export const TEXT_BY_STATE: Record<HighlightState, string> = {
  active: 'text-t-active',
  compare: 'text-t-compare',
  swap: 'text-t-swap',
  done: 'text-t-done',
  muted: 'text-muted-ink',
};

export const SWATCH_BY_STATE: Record<HighlightState, string> = {
  active: 'bg-st-active shadow-[0_0_8px_var(--color-glow-active)]',
  compare: 'bg-st-compare shadow-[0_0_8px_var(--color-glow-compare)]',
  swap: 'bg-st-swap shadow-[0_0_8px_var(--color-glow-swap)]',
  done: 'bg-st-done shadow-[0_0_8px_var(--color-glow-done)]',
  muted: 'bg-muted-fill border border-line-2',
};

interface NodeStyle {
  group: string;
  rect: string;
  text: string;
}

const CELL_STYLE_BY_STATE: Record<CellState, NodeStyle> = {
  '': { group: '', rect: 'fill-cell stroke-idle', text: 'fill-ink' },
  active: {
    group: '[filter:drop-shadow(0_0_9px_var(--color-glow-active))]',
    rect: 'fill-active-soft stroke-st-active',
    text: 'fill-ink',
  },
  compare: {
    group: '[filter:drop-shadow(0_0_9px_var(--color-glow-compare))]',
    rect: 'fill-compare-soft stroke-st-compare',
    text: 'fill-ink',
  },
  swap: {
    group: '[filter:drop-shadow(0_0_9px_var(--color-glow-swap))]',
    rect: 'fill-swap-soft stroke-st-swap',
    text: 'fill-ink',
  },
  done: {
    group: '[filter:drop-shadow(0_0_6px_var(--color-glow-done))]',
    rect: 'fill-done-soft stroke-st-done',
    text: 'fill-ink',
  },
  muted: { group: '', rect: 'fill-muted-fill stroke-line-2', text: 'fill-muted-ink' },
};

const CHIP_RECT_BY_STATE: Record<CellState, string> = {
  '': 'fill-panel-2 stroke-line-2',
  active: 'fill-st-active stroke-st-active',
  compare: 'fill-st-compare stroke-st-compare',
  swap: 'fill-st-swap stroke-st-swap',
  done: 'fill-st-done stroke-st-done',
  muted: 'fill-panel-2 stroke-line-2',
};

/** Classes for one stage node, from its shape and highlight state. */
export function nodeStyle(
  variant: NodeVariant,
  state: CellState,
): NodeStyle & { strokeWidth: number } {
  if (variant === 'ghost') {
    return {
      group: '',
      rect: 'fill-none stroke-idle [stroke-dasharray:4_3]',
      text: 'fill-ink-3 font-normal',
      strokeWidth: 1.5,
    };
  }
  if (variant === 'chip') {
    const isFilled = state !== '' && state !== 'muted';
    return {
      group: '',
      rect: CHIP_RECT_BY_STATE[state],
      text: isFilled ? 'fill-on-st' : 'fill-ink',
      strokeWidth: 1.5,
    };
  }
  return { ...CELL_STYLE_BY_STATE[state], strokeWidth: 2.2 };
}

const STEM_BY_STATE: Record<CellState, string> = {
  '': 'stroke-line-2',
  active: 'stroke-st-active',
  compare: 'stroke-st-compare',
  swap: 'stroke-st-swap',
  done: 'stroke-st-done',
  muted: 'stroke-line-2',
};

export const EDGE_BY_VARIANT: Record<
  Exclude<EdgeVariant, 'stem'>,
  { className: string; width: number }
> = {
  plain: { className: 'stroke-idle', width: 2 },
  on: { className: 'stroke-ink-3', width: 2.5 },
  wall: { className: 'stroke-ink-3', width: 2.5 },
  axis: { className: 'stroke-axis', width: 2 },
};

export function edgeStyle(variant: EdgeVariant, state: CellState) {
  return variant === 'stem'
    ? { className: STEM_BY_STATE[state], width: 2 }
    : EDGE_BY_VARIANT[variant];
}

export const TAG_BY_VARIANT: Record<TagVariant, string> = {
  plain: 'fill-ink-3 font-mono text-xs',
  index: 'fill-ink-3 font-mono text-[11.5px]',
  heading: 'fill-ink-2 font-sans text-[13px] font-semibold',
  value: 'fill-ink font-mono text-base font-bold',
};
