import { motion, Transition } from 'framer-motion';
import { edgeStyle } from '../../styles/code-lens.styles';
import { DrawEdge } from '../../utils/drawing-builder';

const ARROW_SIZE = 8;
const ARROW_SPREAD = 0.5;

/** One path for the line and, when wanted, its arrow head; same command count either way so it tweens. */
function pathOf({ x1, y1, x2, y2, hasArrow }: DrawEdge) {
  const line = `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  if (!hasArrow) return line;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const wing = (offset: number) =>
    `${(x2 - ARROW_SIZE * Math.cos(angle + offset)).toFixed(1)} ${(y2 - ARROW_SIZE * Math.sin(angle + offset)).toFixed(1)}`;
  return `${line} M${wing(-ARROW_SPREAD)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${wing(ARROW_SPREAD)}`;
}

interface StageEdgeProps {
  edge: DrawEdge;
  transition: Transition;
}

export default function StageEdge({ edge, transition }: StageEdgeProps) {
  const style = edgeStyle(edge.variant, edge.state);
  const path = pathOf(edge);

  return (
    <motion.path
      className={`fill-none transition-[stroke] duration-200 ${style.className}`}
      strokeWidth={style.width}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ d: path, opacity: 0 }}
      animate={{ d: path, opacity: 1 }}
      exit={{ opacity: 0, transition }}
      transition={transition}
    />
  );
}
