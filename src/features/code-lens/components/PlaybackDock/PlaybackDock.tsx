import { CSSProperties } from 'react';
import { ROUND_BUTTON } from '../../styles/code-lens.styles';

const SPEEDS = [0.5, 1, 2];
const FILLED = 'size-[15px] fill-current';

interface PlaybackDockProps {
  index: number;
  stepCount: number;
  isPlaying: boolean;
  isAtEnd: boolean;
  speed: number;
  onTogglePlay(): void;
  onPrevious(): void;
  onNext(): void;
  onRestart(): void;
  onSeek(index: number): void;
  onSpeed(speed: number): void;
}

function PlayIcon({ isPlaying, isAtEnd }: { isPlaying: boolean; isAtEnd: boolean }) {
  if (isPlaying) return <path d="M3 2h4v12H3zM9 2h4v12H9z" />;
  if (isAtEnd) return <path d="M8 3V0L3.5 4 8 8V5a4 4 0 1 1-4 4H2a6 6 0 1 0 6-6z" />;
  return <path d="M4 2v12l9-6z" />;
}

export default function PlaybackDock(props: PlaybackDockProps) {
  const { index, stepCount, isPlaying, isAtEnd, speed } = props;
  const progress = stepCount > 1 ? (index / (stepCount - 1)) * 100 : 100;
  const playLabel = isPlaying ? 'Pause' : isAtEnd ? 'Replay' : 'Play';

  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[22px] border border-line bg-panel px-3.5 py-2.5 shadow-card sm:rounded-full">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={ROUND_BUTTON}
          aria-label="Restart"
          title="Restart"
          onClick={props.onRestart}
        >
          <svg viewBox="0 0 16 16" className={FILLED} aria-hidden="true">
            <path d="M2 2h2v12H2zM14 2v12L5 8z" />
          </svg>
        </button>
        <button
          type="button"
          className={ROUND_BUTTON}
          aria-label="Previous step"
          title="Previous step (left arrow)"
          onClick={props.onPrevious}
        >
          <svg viewBox="0 0 16 16" className={FILLED} aria-hidden="true">
            <path d="M12 2v12L3 8z" />
          </svg>
        </button>
        <button
          type="button"
          className="grid size-[52px] place-items-center rounded-full bg-accent text-accent-ink shadow-[0_10px_26px_-8px_var(--color-glow-accent),0_0_0_4px_color-mix(in_srgb,var(--accent)_16%,transparent)]"
          aria-label={playLabel}
          onClick={props.onTogglePlay}
          data-state={isPlaying ? 'playing' : isAtEnd ? 'ended' : 'paused'}
        >
          <svg viewBox="0 0 16 16" className="size-[18px] fill-current" aria-hidden="true">
            <PlayIcon isPlaying={isPlaying} isAtEnd={isAtEnd} />
          </svg>
        </button>
        <button
          type="button"
          className={ROUND_BUTTON}
          aria-label="Next step"
          title="Next step (right arrow)"
          onClick={props.onNext}
        >
          <svg viewBox="0 0 16 16" className={FILLED} aria-hidden="true">
            <path d="M4 2v12l9-6z" />
          </svg>
        </button>
      </div>
      <span className="min-w-[58px] text-center font-mono text-[13px] font-semibold text-ink-2 tabular-nums">
        {index + 1} / {stepCount}
      </span>
      <input
        className="scrub h-6 min-w-[120px] flex-[1_1_160px] cursor-pointer"
        type="range"
        min={0}
        max={Math.max(stepCount - 1, 0)}
        value={index}
        aria-label="Jump to step"
        style={{ '--progress': `${progress}%` } as CSSProperties}
        onChange={event => props.onSeek(Number(event.target.value))}
      />
      <div
        className="inline-flex gap-0.5 rounded-full border border-line bg-panel-2 p-[3px]"
        role="group"
        aria-label="Speed"
      >
        {SPEEDS.map(value => (
          <button
            key={value}
            type="button"
            className="h-[30px] rounded-full px-[11px] font-mono text-[12.5px] font-semibold text-ink-3 aria-pressed:bg-panel aria-pressed:text-ink aria-pressed:shadow-[0_1px_4px_#0000002e]"
            aria-pressed={value === speed}
            onClick={() => props.onSpeed(value)}
          >
            {value}×
          </button>
        ))}
      </div>
    </div>
  );
}
