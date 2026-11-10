import { LibraryStatus } from '../../hooks/useWalkthroughLibrary';
import { CAPS_LABEL } from '../../styles/code-lens.styles';
import { LibraryItem } from '../../types/code-lens.types';
import Icon from '../Icon/Icon';

const LIST =
  'grid gap-0.5 max-[1100px]:flex max-[1100px]:gap-1.5 max-[1100px]:overflow-x-auto max-[1100px]:pb-1';

function itemClass(isActive: boolean) {
  return `flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left font-medium disabled:cursor-not-allowed disabled:opacity-45 max-[1100px]:flex-none max-[1100px]:rounded-full max-[1100px]:border max-[1100px]:border-line ${isActive ? 'bg-accent-soft font-semibold text-ink' : 'text-ink-2 hover:bg-panel-2 hover:text-ink max-[1100px]:bg-panel-2'}`;
}

function Dot({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`size-1.5 flex-none rounded-full ${isActive ? 'bg-accent shadow-[0_0_8px_var(--color-glow-accent)]' : 'bg-idle'}`}
    />
  );
}

/** Highlights the opened entry, or the newest one with the same title for a fresh walkthrough. */
function activeIdOf(items: LibraryItem[], activeId: number | null, activeTitle: string | null) {
  if (activeId !== null) return activeId;
  return items.find(item => item.title === activeTitle)?.id ?? null;
}

interface SidebarProps {
  library: LibraryItem[];
  libraryStatus: LibraryStatus;
  libraryNotice: string;
  activeId: number | null;
  activeTitle: string | null;
  onSelect(item: LibraryItem): void;
  /** Only offered on items this browser created. */
  onDelete(item: LibraryItem): void;
  onNewProblem(): void;
}

export default function Sidebar(props: SidebarProps) {
  const { library, libraryStatus, libraryNotice, onSelect, onDelete, onNewProblem } = props;
  const highlightedId = activeIdOf(library, props.activeId, props.activeTitle);

  return (
    <aside
      className="grid min-w-0 content-start gap-3.5 rounded-[22px] border border-line bg-panel/90 p-4 shadow-card max-[1100px]:static min-[1101px]:sticky min-[1101px]:top-4 min-[1101px]:max-h-[calc(100dvh-32px)] min-[1101px]:overflow-y-auto"
      aria-label="Problems"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-[38px] place-items-center rounded-xl bg-[linear-gradient(140deg,var(--accent),color-mix(in_srgb,var(--accent)_55%,var(--st-active)))] text-accent-ink shadow-[0_6px_20px_-6px_var(--color-glow-accent)]">
          <Icon name="lines" className="size-5" />
        </span>
        <div>
          <b className="block font-display text-base leading-tight font-bold tracking-tight">
            CodeLens
          </b>
          <small className="text-[12.5px] text-ink-3">See inside code as it runs</small>
        </div>
      </div>

      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-2xl border border-accent/45 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_22%,var(--panel)),var(--panel))] p-3 text-left hover:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
        onClick={onNewProblem}
      >
        <span className="grid size-8 flex-none place-items-center rounded-[10px] bg-accent text-accent-ink">
          <Icon name="plus" />
        </span>
        <b className="font-bold">New problem</b>
      </button>

      <div className="grid gap-0.5 pl-1">
        <h2 className={`m-0 ${CAPS_LABEL}`}>Library</h2>
        <small className="text-[12.5px] text-ink-3">Already made, so they open instantly</small>
      </div>
      {library.length ? (
        <nav className={LIST} aria-label="Library">
          {library.map(item => {
            const isActive = item.id === highlightedId;
            return (
              <div key={item.id} className="flex min-w-0 items-center gap-1 max-[1100px]:flex-none">
                <button
                  type="button"
                  className={`${itemClass(isActive)} min-w-0 flex-1`}
                  aria-current={isActive}
                  title={item.example ? `${item.title}: ${item.example}` : item.title}
                  onClick={() => onSelect(item)}
                >
                  <Dot isActive={isActive} />
                  <span className="grid min-w-0">
                    <span className="truncate">{item.title}</span>
                    {item.example ? (
                      <small className="truncate font-mono text-[11.5px] font-normal text-ink-3 max-[1100px]:hidden">
                        {item.example}
                      </small>
                    ) : null}
                  </span>
                </button>
                {item.canDelete ? (
                  <button
                    type="button"
                    className="grid size-8 flex-none place-items-center rounded-lg text-ink-3 hover:bg-panel-2 hover:text-bad"
                    aria-label={`Delete ${item.title}`}
                    title="Delete this problem"
                    onClick={() => onDelete(item)}
                  >
                    <Icon name="trash" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </nav>
      ) : (
        <p className="m-0 pl-1 text-sm text-ink-3" data-state={libraryStatus}>
          {libraryStatus === 'loading'
            ? 'Loading…'
            : libraryStatus === 'error'
              ? 'The library could not be loaded. Is the backend running?'
              : 'Walkthroughs anyone creates will appear here.'}
        </p>
      )}
      {libraryNotice ? (
        <p className="m-0 pl-1 text-sm font-medium text-bad" role="status">
          {libraryNotice}
        </p>
      ) : null}
    </aside>
  );
}
