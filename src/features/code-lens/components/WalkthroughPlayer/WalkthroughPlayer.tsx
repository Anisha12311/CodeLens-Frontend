import { usePlayer } from '../../hooks/usePlayer';
import { usePlayerShortcuts } from '../../hooks/usePlayerShortcuts';
import { Run } from '../../types/code-lens.types';
import CodePanel from '../CodePanel/CodePanel';
import Legend from '../Legend/Legend';
import PlaybackDock from '../PlaybackDock/PlaybackDock';
import Stage from '../Stage/Stage';
import StepCard from '../StepCard/StepCard';
import VariablesPanel from '../VariablesPanel/VariablesPanel';

export default function WalkthroughPlayer({ run }: { run: Run }) {
  const player = usePlayer(run);
  usePlayerShortcuts({
    onNext: player.next,
    onPrevious: player.previous,
    onTogglePlay: player.togglePlay,
  });

  return (
    <div className="grid items-start gap-[18px] min-[761px]:grid-cols-[minmax(0,1fr)_clamp(280px,36%,400px)]">
      <div className="grid min-w-0 gap-4">
        <Stage
          key={run.id}
          steps={run.steps}
          step={player.step}
          hud={run.track.hud(player.step.vars)}
          answer={player.isAtEnd ? run.track.answer : ''}
          complexity={[
            { label: 'Time', value: run.track.time },
            { label: 'Space', value: run.track.space },
          ].filter(fact => fact.value)}
          glideMs={player.glideMs}
        />
        <Legend entries={run.track.legend} />
        <PlaybackDock
          index={player.index}
          stepCount={player.stepCount}
          isPlaying={player.isPlaying}
          isAtEnd={player.isAtEnd}
          speed={player.speed}
          onTogglePlay={player.togglePlay}
          onPrevious={player.previous}
          onNext={player.next}
          onRestart={player.restart}
          onSeek={player.seek}
          onSpeed={player.setSpeed}
        />
        <StepCard
          index={player.index}
          stepCount={player.stepCount}
          text={player.step.text}
          pendingAsk={player.pendingAsk}
          feedback={player.feedback}
          score={player.score}
          isQuizOn={player.isQuizOn}
          onQuizChange={player.changeQuiz}
          onAnswer={player.answer}
        />
      </div>
      <div className="grid min-w-0 gap-4 min-[761px]:sticky min-[761px]:top-4">
        <CodePanel code={run.track.code} activeLine={player.step.line} />
        <VariablesPanel vars={player.step.vars} previousVars={player.previousVars} />
      </div>
    </div>
  );
}
