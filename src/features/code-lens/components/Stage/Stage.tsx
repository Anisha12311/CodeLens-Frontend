import { AnimatePresence, MotionConfig, Transition, motion } from 'framer-motion';
import { useMemo, useRef } from 'react';
import {
  DEFAULT_STAGE_HEIGHT,
  STAGE_PAD_BOTTOM,
  STAGE_PAD_TOP,
} from '../../constants/code-lens.constants';
import { useElementSize } from '../../hooks/useElementSize';
import { CAPS_LABEL, CARD } from '../../styles/code-lens.styles';
import { Fact, HudItem, Step } from '../../types/code-lens.types';
import { layoutScene } from '../../utils/scene-layout';
import ExprLine from '../ExprLine/ExprLine';
import StageEdge from '../StageEdge/StageEdge';
import StageHud from '../StageHud/StageHud';
import StageNode from '../StageNode/StageNode';
import StageTag from '../StageTag/StageTag';

const DEFAULT_WIDTH = 700;
const MIN_PANELS_HEIGHT = 240;
const MAX_PANELS_HEIGHT = 940;

interface StageProps {
  steps: Step[];
  step: Step;
  hud: HudItem[];
  /** Shown in place of the expression line when non-empty, so the run ends on its result. */
  answer: string;
  /** Time and space complexity, shown in a strip along the bottom of the stage. */
  complexity: Fact[];
  glideMs: number;
}

export default function Stage({ steps, step, hud, answer, complexity, glideMs }: StageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(containerRef, {
    width: DEFAULT_WIDTH,
    height: DEFAULT_STAGE_HEIGHT,
  });
  // Panels grow with their content, so size the stage once for the tallest step in the run.
  const panelsHeight = useMemo(() => {
    const tallest = Math.max(...steps.map(item => layoutScene(item.scene, width).height ?? 0));
    const total = tallest + STAGE_PAD_TOP + STAGE_PAD_BOTTOM;
    return Math.round(Math.max(MIN_PANELS_HEIGHT, Math.min(MAX_PANELS_HEIGHT, total)));
  }, [steps, width]);

  const drawing = useMemo(() => layoutScene(step.scene, width), [step.scene, width]);
  const transition: Transition = { duration: glideMs / 1000, ease: 'easeInOut' };

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div
        ref={containerRef}
        className="stage-dots relative h-[380px] sm:h-[440px]"
        style={{ height: panelsHeight }}
      >
        <MotionConfig reducedMotion="user">
          <svg
            className="block size-full"
            viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`}
            role="img"
            aria-label={step.text.replace(/`/g, '')}
          >
            <g transform={`translate(0 ${STAGE_PAD_TOP})`}>
              <AnimatePresence initial={false}>
                {drawing.edges.map(edge => (
                  <StageEdge key={`edge:${edge.key}`} edge={edge} transition={transition} />
                ))}
                {drawing.nodes.map(node => (
                  <StageNode key={`node:${node.key}`} node={node} transition={transition} />
                ))}
                {drawing.tags.map(tag => (
                  <StageTag key={`tag:${tag.key}`} tag={tag} transition={transition} />
                ))}
              </AnimatePresence>
            </g>
          </svg>
        </MotionConfig>
        <StageHud items={hud} />
        {answer ? (
          <motion.div
            className="pointer-events-none absolute bottom-3 left-1/2 z-[1] inline-flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 overflow-hidden rounded-full border border-st-done bg-done-soft px-4 py-1.5 font-mono text-[13.5px] leading-snug font-bold whitespace-nowrap text-ink shadow-[0_0_16px_var(--color-glow-done)] sm:text-base"
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span className="text-[11px] font-semibold tracking-[0.1em] text-t-done uppercase sm:text-xs">
              Answer
            </span>
            <span className="overflow-hidden text-ellipsis">{answer}</span>
          </motion.div>
        ) : step.expr ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1] max-w-[calc(100%-32px)] -translate-x-1/2 overflow-hidden rounded-full border border-line bg-panel-2/90 px-4 py-1.5 text-center font-mono text-[13.5px] leading-snug font-bold text-ellipsis whitespace-nowrap text-ink-2 sm:text-base">
            <ExprLine expression={step.expr} />
          </div>
        ) : null}
      </div>
      {complexity.length ? (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-line bg-panel-2/60 px-4 py-2">
          <span className={CAPS_LABEL}>Complexity</span>
          {complexity.map(fact => (
            <span
              key={fact.label}
              className="inline-flex h-7 max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-line bg-panel px-3 font-mono text-[12.5px] text-ellipsis whitespace-nowrap text-ink-3"
            >
              {fact.label} <b className="font-semibold text-ink">{fact.value}</b>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
