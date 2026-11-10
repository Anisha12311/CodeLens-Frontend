import { SWATCH_BY_STATE } from '../../styles/code-lens.styles';
import { LegendEntry } from '../../types/code-lens.types';

export default function Legend({ entries }: { entries: LegendEntry[] }) {
  return (
    <div className="-mt-1 flex flex-wrap gap-1.5 text-[13px] text-ink-2">
      {entries.map(entry => (
        <span
          key={entry.state}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-panel px-3"
        >
          <i className={`size-2.5 rounded-full ${SWATCH_BY_STATE[entry.state]}`} />
          {entry.label}
        </span>
      ))}
    </div>
  );
}
