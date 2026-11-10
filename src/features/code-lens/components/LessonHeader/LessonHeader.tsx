import { Track } from '../../types/code-lens.types';

export default function LessonHeader({ track }: { track: Track }) {
  return (
    <header className="grid gap-2 px-1 pt-1.5">
      <div className="flex items-center gap-2 text-[13px] text-ink-3">
        <span>{track.group}</span>
        <span>/</span>
        <b className="font-semibold text-ink-2">{track.title}</b>
      </div>
      <h1 className="m-0 font-display text-[27px] leading-[1.1] font-bold tracking-[-0.025em] text-balance sm:text-[34px]">
        {track.title}
      </h1>
      <p className="m-0 max-w-[72ch] text-[15.5px] text-ink-2">{track.idea}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {track.facts.map(fact => (
          <span
            key={fact.label}
            // Long values (a class's call list, many intervals) wrap instead of being cut off.
            className="inline-flex min-h-7 max-w-full items-baseline gap-1.5 rounded-2xl border border-line bg-panel px-3 py-1 font-mono text-[12.5px] leading-5 text-ink-3"
          >
            <span className="flex-none">{fact.label}</span>
            <b className="min-w-0 font-semibold [overflow-wrap:anywhere] text-ink">{fact.value}</b>
          </span>
        ))}
      </div>
    </header>
  );
}
