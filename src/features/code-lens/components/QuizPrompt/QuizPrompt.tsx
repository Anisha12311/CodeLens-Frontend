import { motion } from 'framer-motion';
import { Ask } from '../../types/code-lens.types';
import RichText from '../RichText/RichText';

interface QuizPromptProps {
  ask: Ask;
  onAnswer(choice: string): void;
}

export default function QuizPrompt({ ask, onAnswer }: QuizPromptProps) {
  return (
    <motion.div
      className="grid gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <p className="m-0 text-base font-semibold sm:text-[17.5px]">
        <RichText text={ask.question} />
      </p>
      <div className="flex flex-wrap gap-2">
        {ask.options.map((option, index) => (
          <button
            key={option}
            type="button"
            className="h-10 rounded-xl border border-line-2 bg-panel-2 px-4 font-semibold hover:border-accent hover:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
            // The first option takes focus so a keyboard user can answer straight away.
            autoFocus={index === 0}
            onClick={() => onAnswer(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
