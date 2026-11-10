import { LegendEntry } from '../types/code-lens.types';

export const CUSTOM_TRACK_ID = 'paste-problem';
export const BASE_STEP_MS = 1900;
export const MAX_GLIDE_MS = 620;
export const STAGE_PAD_TOP = 46;
export const STAGE_PAD_BOTTOM = 48;
export const DEFAULT_STAGE_HEIGHT = 440;

export const GENERIC_LEGEND: LegendEntry[] = [
  { state: 'active', label: 'Current' },
  { state: 'compare', label: 'Checking' },
  { state: 'swap', label: 'Just changed' },
  { state: 'done', label: 'Answer or finished' },
  { state: 'muted', label: 'Ruled out' },
];
