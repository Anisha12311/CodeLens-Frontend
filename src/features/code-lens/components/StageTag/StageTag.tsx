import { motion, Transition } from 'framer-motion';
import { TAG_BY_VARIANT } from '../../styles/code-lens.styles';
import { DrawTag } from '../../utils/drawing-builder';

interface StageTagProps {
  tag: DrawTag;
  transition: Transition;
}

export default function StageTag({ tag, transition }: StageTagProps) {
  return (
    <motion.text
      className={TAG_BY_VARIANT[tag.variant]}
      textAnchor={tag.isStartAligned ? 'start' : 'middle'}
      dominantBaseline="central"
      initial={{ x: tag.x, y: tag.y, opacity: 0 }}
      animate={{ x: tag.x, y: tag.y, opacity: 1 }}
      exit={{ opacity: 0, transition }}
      transition={transition}
    >
      {tag.text}
    </motion.text>
  );
}
