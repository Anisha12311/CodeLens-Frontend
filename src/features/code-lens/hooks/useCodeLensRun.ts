import { useMemo, useState } from 'react';
import { CUSTOM_TRACK_ID, GENERIC_LEGEND } from '../constants/code-lens.constants';
import { HudItem, Run, Track, Variables, Walkthrough } from '../types/code-lens.types';

interface Selection {
  walkthrough: Walkthrough;
  version: number;
}

// The model is told to put the two most important variables first.
function hudFor(vars: Variables): HudItem[] {
  return Object.entries(vars)
    .slice(0, 2)
    .map(([name, value], index) => ({ name, value, state: index === 0 ? 'active' : 'compare' }));
}

function walkthroughTrack(walkthrough: Walkthrough): Track {
  const facts = [
    { label: 'Time', value: walkthrough.time },
    { label: 'Space', value: walkthrough.space },
    { label: 'Example', value: walkthrough.input },
    { label: 'Answer', value: walkthrough.output },
  ].filter(fact => fact.value);
  return {
    id: CUSTOM_TRACK_ID,
    group: 'Your problem',
    title: walkthrough.title,
    idea: walkthrough.approach,
    facts,
    legend: GENERIC_LEGEND,
    code: walkthrough.code,
    time: walkthrough.time,
    space: walkthrough.space,
    input: walkthrough.input,
    answer: walkthrough.output,
    hud: hudFor,
  };
}

/** The walkthrough on screen and the run the player steps through; null until one is made. */
export function useCodeLensRun() {
  const [selection, setSelection] = useState<Selection | null>(null);

  const run = useMemo<Run | null>(
    () =>
      selection
        ? {
            id: `${CUSTOM_TRACK_ID}#${selection.version}`,
            track: walkthroughTrack(selection.walkthrough),
            steps: selection.walkthrough.steps,
          }
        : null,
    [selection],
  );

  return {
    run,
    showWalkthrough(walkthrough: Walkthrough) {
      setSelection(current => ({ walkthrough, version: (current?.version ?? 0) + 1 }));
    },
    /** Takes the animation off screen, ready for a new problem. */
    clear() {
      setSelection(null);
    },
  };
}
