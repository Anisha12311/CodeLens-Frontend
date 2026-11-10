import { motion, Transition } from 'framer-motion';
import { nodeStyle } from '../../styles/code-lens.styles';
import { DrawNode } from '../../utils/drawing-builder';

interface StageNodeProps {
  node: DrawNode;
  transition: Transition;
}

export default function StageNode({ node, transition }: StageNodeProps) {
  const style = nodeStyle(node.variant, node.state);
  const radius = Math.min(node.radius, node.width / 2, node.height / 2);
  const start = node.enter ?? { x: node.x, y: node.y };

  return (
    <motion.g
      className={`transition-[filter] duration-200 ${style.group}`}
      initial={{ x: start.x, y: start.y, opacity: 0 }}
      animate={{ x: node.x, y: node.y, opacity: 1 }}
      exit={{ opacity: 0, transition }}
      transition={transition}
      data-state={node.state || 'idle'}
    >
      <motion.rect
        className={`transition-[fill,stroke] duration-200 ${style.rect}`}
        strokeWidth={style.strokeWidth}
        initial={false}
        animate={{ width: Math.max(node.width, 0), height: Math.max(node.height, 0), rx: radius }}
        transition={transition}
      />
      <motion.text
        className={`font-mono font-bold tabular-nums ${style.text}`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={node.fontSize}
        initial={false}
        animate={{ x: node.width / 2, y: node.isLabelAbove ? -14 : node.height / 2 }}
        transition={transition}
      >
        {node.label}
      </motion.text>
    </motion.g>
  );
}
