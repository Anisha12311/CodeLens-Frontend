import { useEffect, useState } from 'react';
import { BASE_STEP_MS, MAX_GLIDE_MS } from '../constants/code-lens.constants';
import { Run, Step } from '../types/code-lens.types';

export interface Feedback {
  isCorrect: boolean;
  text: string;
}

interface PlayerState {
  runId: string;
  index: number;
  isPlaying: boolean;
  /** The step whose question is on screen; the step itself is shown once it is answered. */
  pendingIndex: number | null;
  answered: number[];
  correctCount: number;
  answeredCount: number;
  feedback: Feedback | null;
}

function initialState(runId: string): PlayerState {
  return {
    runId,
    index: 0,
    isPlaying: false,
    pendingIndex: null,
    answered: [],
    correctCount: 0,
    answeredCount: 0,
    feedback: null,
  };
}

function advance(state: PlayerState, steps: Step[], isQuizOn: boolean): PlayerState {
  const last = steps.length - 1;
  if (state.pendingIndex !== null) return state;
  if (state.index >= last) return { ...state, isPlaying: false };
  const nextIndex = state.index + 1;
  if (isQuizOn && steps[nextIndex].ask && !state.answered.includes(nextIndex)) {
    return { ...state, pendingIndex: nextIndex, feedback: null };
  }
  return {
    ...state,
    index: nextIndex,
    feedback: null,
    isPlaying: state.isPlaying && nextIndex < last,
  };
}

/** Playback, stepping and quiz state for one run; starts over whenever the run changes. */
export function usePlayer(run: Run) {
  const { steps } = run;
  const [speed, setSpeed] = useState(1);
  const [isQuizOn, setIsQuizOn] = useState(false);
  const [storedState, setState] = useState(() => initialState(run.id));
  // Resetting during render (not in an effect) means a new run never shows the old step.
  if (storedState.runId !== run.id) setState(initialState(run.id));
  const state = storedState.runId === run.id ? storedState : initialState(run.id);
  const stepMs = BASE_STEP_MS / speed;
  const lastIndex = steps.length - 1;

  useEffect(() => {
    if (!state.isPlaying || state.pendingIndex !== null) return;
    const timer = window.setTimeout(
      () => setState(current => advance(current, steps, isQuizOn)),
      stepMs,
    );
    return () => window.clearTimeout(timer);
  }, [state.isPlaying, state.pendingIndex, state.index, steps, isQuizOn, stepMs]);

  const pauseAnd = (update: (current: PlayerState) => PlayerState) =>
    setState(current => update({ ...current, isPlaying: false }));
  const goTo = (index: number) =>
    pauseAnd(current => ({
      ...current,
      index: Math.max(0, Math.min(lastIndex, index)),
      pendingIndex: null,
      feedback: null,
    }));

  const togglePlay = () =>
    setState(current => {
      if (current.isPlaying) return { ...current, isPlaying: false };
      if (current.index >= lastIndex) return { ...initialState(current.runId), isPlaying: true };
      return advance({ ...current, isPlaying: true }, steps, isQuizOn);
    });

  const answer = (choice: string) =>
    setState(current => {
      const pendingIndex = current.pendingIndex;
      const ask = pendingIndex === null ? undefined : steps[pendingIndex].ask;
      if (pendingIndex === null || !ask) return current;
      const isCorrect = choice === ask.answer;
      return {
        ...current,
        index: pendingIndex,
        pendingIndex: null,
        answered: [...current.answered, pendingIndex],
        answeredCount: current.answeredCount + 1,
        correctCount: current.correctCount + (isCorrect ? 1 : 0),
        isPlaying: current.isPlaying && pendingIndex < lastIndex,
        feedback: {
          isCorrect,
          text: isCorrect
            ? 'Correct.'
            : `Not quite. The answer is: ${ask.answer.replace(/`/g, '')}.`,
        },
      };
    });

  const changeQuiz = (isOn: boolean) => {
    setIsQuizOn(isOn);
    // Turning the quiz off mid-question just reveals the step it was asking about.
    if (!isOn) {
      setState(current =>
        current.pendingIndex === null
          ? current
          : { ...current, index: current.pendingIndex, pendingIndex: null },
      );
    }
  };

  return {
    step: steps[state.index],
    index: state.index,
    stepCount: steps.length,
    isPlaying: state.isPlaying,
    isAtEnd: state.index >= lastIndex,
    pendingAsk: state.pendingIndex === null ? undefined : steps[state.pendingIndex].ask,
    previousVars: state.index > 0 ? steps[state.index - 1].vars : undefined,
    feedback: state.feedback,
    score: state.answeredCount ? `${state.correctCount} of ${state.answeredCount} right` : '',
    speed,
    isQuizOn,
    glideMs: Math.min(MAX_GLIDE_MS, stepMs * 0.5),
    setSpeed,
    changeQuiz,
    togglePlay,
    answer,
    next: () => pauseAnd(current => advance(current, steps, isQuizOn)),
    previous: () => goTo(state.index - 1),
    seek: goTo,
    restart: () => setState(initialState(run.id)),
  };
}
