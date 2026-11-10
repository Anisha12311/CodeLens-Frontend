import dynamic from 'next/dynamic';
import { CARD } from '../../styles/code-lens.styles';

// Monaco is large and browser-only, so it loads on demand after the page is interactive.
const MonacoCode = dynamic(() => import('../MonacoCode/MonacoCode'), {
  ssr: false,
  loading: () => <CodeFallback />,
});

function CodeFallback() {
  return (
    <p className="m-0 px-4 py-6 text-sm text-ink-3" data-state="loading">
      Loading the code editor…
    </p>
  );
}

interface CodePanelProps {
  code: string[];
  activeLine: number;
}

export default function CodePanel({ code, activeLine }: CodePanelProps) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="size-2.5 rounded-full bg-line-2" />
          <i className="size-2.5 rounded-full bg-line-2" />
          <i className="size-2.5 rounded-full bg-line-2" />
        </span>
        <span className="flex-1" />
        <span className="rounded-lg border border-line bg-panel-2 px-2 py-0.5 font-mono text-xs font-medium text-ink-3">
          solution.py
        </span>
      </div>
      <MonacoCode code={code} activeLine={activeLine} />
    </section>
  );
}
