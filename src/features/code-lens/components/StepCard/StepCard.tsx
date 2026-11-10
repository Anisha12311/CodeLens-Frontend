import { AnimatePresence, motion } from 'framer-motion';
import { Feedback } from '../../hooks/usePlayer';
import { CARD } from '../../styles/code-lens.styles';
import { Ask } from '../../types/code-lens.types';
import QuizPrompt from '../QuizPrompt/QuizPrompt';
import RichText from '../RichText/RichText';

interface StepCardProps {
  index: number;
  stepCount: number;
  text: string;
  pendingAsk?: Ask;
  feedback: Feedback | null;
  score: string;
  isQuizOn: boolean;
  onQuizChange(isOn: boolean): void;
  onAnswer(choice: string): void;
}

export default function StepCard(props: StepCardProps) {
  const { index, stepCount, text, pendingAsk, feedback, score, isQuizOn } = props;

  return (
    <section
      className={`${CARD} relative grid min-h-[104px] content-start gap-2 overflow-hidden px-[18px] py-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent before:shadow-[0_0_16px_var(--color-glow-accent)]`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="inline-flex h-6 items-center rounded-full bg-accent-soft px-2.5 font-mono text-[11.5px] font-semibold tracking-[0.04em]">
          STEP {index + 1} OF {stepCount}
        </span>
        <span className="inline-flex flex-wrap items-center gap-x-3.5 gap-y-2">
          {score ? (
            <span className="font-mono text-[12.5px] font-semibold text-ink-2">{score}</span>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium whitespace-nowrap text-ink-2">
            <input
              type="checkbox"
              className="relative h-[22px] w-[38px] flex-none cursor-pointer appearance-none rounded-full bg-line-2 transition-colors before:absolute before:top-[3px] before:left-[3px] before:size-4 before:rounded-full before:bg-ink before:transition-transform checked:bg-accent checked:before:translate-x-4 checked:before:bg-accent-ink"
              checked={isQuizOn}
              onChange={event => props.onQuizChange(event.target.checked)}
            />
            Quiz me at each decision
          </label>
        </span>
      </div>
      {feedback ? (
        <p
          className={`m-0 text-sm font-bold ${feedback.isCorrect ? 'text-good' : 'text-bad'}`}
          data-state={feedback.isCorrect ? 'right' : 'wrong'}
        >
          {feedback.text}
        </p>
      ) : null}
      {pendingAsk ? (
        <QuizPrompt ask={pendingAsk} onAnswer={props.onAnswer} />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            className="m-0 max-w-[72ch] text-base leading-normal sm:text-[17.5px]"
            aria-live="polite"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <RichText text={text} />
          </motion.p>
        </AnimatePresence>
      )}
    </section>
  );
}
