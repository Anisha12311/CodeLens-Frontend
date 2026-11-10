import { FormEvent } from 'react';
import { GeneratorStatus } from '../../hooks/useWalkthroughGenerator';
import { BUTTON, BUTTON_PRIMARY, CAPS_LABEL, FIELD } from '../../styles/code-lens.styles';
import { ProblemDraft, WalkthroughRequest } from '../../types/code-lens.types';

interface ProblemComposerProps {
  draft: ProblemDraft;
  onDraftChange(draft: ProblemDraft): void;
  status: GeneratorStatus;
  isBusy: boolean;
  isAvailable: boolean;
  onGenerate(request: WalkthroughRequest): void;
  onStop(): void;
}

export default function ProblemComposer({
  draft,
  onDraftChange,
  status,
  isBusy,
  isAvailable,
  onGenerate,
  onStop,
}: ProblemComposerProps) {
  const { problem, example } = draft;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onGenerate({ problem, example });
  };
  return (
    <form className="grid gap-3" noValidate onSubmit={handleSubmit}>
      <label className={CAPS_LABEL} htmlFor="problem">
        Problem
      </label>
      <textarea
        id="problem"
        rows={4}
        maxLength={6000}
        className="min-h-[100px] w-full min-w-0 resize-y rounded-[14px] border border-line bg-panel-2 px-3.5 py-3 leading-normal outline-none focus:border-accent"
        placeholder="Paste a LeetCode-style question, or just type its name, for example: Valid Anagram"
        value={problem}
        onChange={event => onDraftChange({ ...draft, problem: event.target.value })}
      />
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2.5">
        <div className="grid min-w-0 flex-[1_1_260px] gap-1.5 text-sm">
          <label htmlFor="example" className="text-[13px] font-semibold text-ink-2">
            Example to trace (optional)
          </label>
          <input
            id="example"
            type="text"
            autoComplete="off"
            spellCheck={false}
            className={FIELD}
            placeholder="nums = [2, 7, 11, 15], target = 9"
            value={example}
            onChange={event => onDraftChange({ ...draft, example: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={BUTTON_PRIMARY} disabled={isBusy || !isAvailable}>
            Create animation
          </button>
          {isBusy ? (
            <button type="button" className={BUTTON} onClick={onStop}>
              Stop
            </button>
          ) : null}
        </div>
      </div>
      <p
        role="status"
        className={`m-0 min-h-[1.5em] text-sm ${status.kind === 'error' ? 'font-medium text-bad' : 'text-ink-2'}`}
        data-state={status.kind}
      >
        {isBusy ? (
          <span className="mr-2 inline-block size-2.5 animate-[status-pulse_1s_ease-in-out_infinite_alternate] rounded-full bg-accent shadow-[0_0_10px_var(--color-glow-accent)]" />
        ) : null}
        {status.text}
      </p>
    </form>
  );
}
