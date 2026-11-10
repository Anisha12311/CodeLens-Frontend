import { HighlightState } from '../types/code-lens.types';

export interface ExprSegment {
  text: string;
  state?: HighlightState;
}

const STATE_BY_CODE: Record<string, HighlightState> = {
  a: 'active',
  c: 'compare',
  s: 'swap',
  d: 'done',
  m: 'muted',
};

const TOKEN = /«([acsdm]):([^»]*)»/g;

/** Splits `«a:31» > «c:20»` into plain and coloured segments. */
export function parseExpr(expression: string): ExprSegment[] {
  const segments: ExprSegment[] = [];
  let last = 0;
  for (const match of expression.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ text: expression.slice(last, start) });
    segments.push({ text: match[2], state: STATE_BY_CODE[match[1]] });
    last = start + match[0].length;
  }
  if (last < expression.length) segments.push({ text: expression.slice(last) });
  return segments;
}

/** Splits narration on backticks; odd parts are code names. */
export function splitCode(text: string) {
  return text.split('`').map((part, index) => ({ text: part, isCode: index % 2 === 1 }));
}
