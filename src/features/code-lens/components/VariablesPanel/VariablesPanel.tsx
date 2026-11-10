import { CARD } from '../../styles/code-lens.styles';
import { Variables } from '../../types/code-lens.types';

const WIDE_AFTER = 11;

interface VariablesPanelProps {
  vars: Variables;
  previousVars?: Variables;
}

export default function VariablesPanel({ vars, previousVars }: VariablesPanelProps) {
  const entries = Object.entries(vars);

  return (
    <section className={CARD}>
      <div className="border-b border-line px-4 py-3 text-[13px] font-semibold text-ink-2">
        Variables
      </div>
      <dl
        className="m-0 grid min-h-[60px] grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2 p-3.5"
        data-state={entries.length ? 'ready' : 'empty'}
      >
        {entries.map(([name, value]) => {
          const isChanged =
            previousVars !== undefined &&
            name in previousVars &&
            String(previousVars[name]) !== String(value);
          return (
            <div
              key={name}
              className={`min-w-0 rounded-xl border bg-panel-2 px-2.5 py-2 transition-[border-color,box-shadow] duration-200 ${String(value).length > WIDE_AFTER ? 'col-span-full' : ''} ${isChanged ? 'border-st-compare shadow-[inset_0_0_0_3px_var(--color-glow-compare),0_0_14px_-4px_var(--color-glow-compare)]' : 'border-line'}`}
              data-state={isChanged ? 'changed' : 'same'}
            >
              <dt className="text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
                {name}
              </dt>
              <dd
                className={`m-0 mt-0.5 font-mono text-[15px] leading-snug font-bold break-words ${isChanged ? 'text-t-compare' : ''}`}
              >
                {value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
