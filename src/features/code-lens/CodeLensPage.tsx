'use client';

import { useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import InputCard from './components/InputCard/InputCard';
import LessonHeader from './components/LessonHeader/LessonHeader';
import ProblemComposer from './components/ProblemComposer/ProblemComposer';
import Sidebar from './components/Sidebar/Sidebar';
import WalkthroughPlayer from './components/WalkthroughPlayer/WalkthroughPlayer';
import { useCodeLensRun } from './hooks/useCodeLensRun';
import { useWalkthroughGenerator } from './hooks/useWalkthroughGenerator';
import { useWalkthroughLibrary } from './hooks/useWalkthroughLibrary';
import { CARD } from './styles/code-lens.styles';
import { LibraryItem, ProblemDraft, WalkthroughRequest } from './types/code-lens.types';
import { problemKey } from './utils/problem-key';

const EMPTY_DRAFT: ProblemDraft = { problem: '', example: '' };
const ALREADY_SAVED =
  'This problem is already in the library, so the saved animation opened instead of making a new one.';

export default function CodeLensPage() {
  const { run, showWalkthrough, clear } = useCodeLensRun();
  const library = useWalkthroughLibrary();
  const [draft, setDraft] = useState<ProblemDraft>(EMPTY_DRAFT);
  // The library entry on screen; null for a fresh walkthrough, matched by title instead.
  const [activeId, setActiveId] = useState<number | null>(null);
  // Bumped by New problem so the input card remounts open, even if it was collapsed.
  const [composerKey, setComposerKey] = useState(0);
  // The problem waiting for the student to confirm its deletion.
  const [pendingDelete, setPendingDelete] = useState<LibraryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const generator = useWalkthroughGenerator({
    onReady(walkthrough, raw, request) {
      // The backend has saved it, so the shared library now includes it.
      library.reload();
      setActiveId(null);
      // Show the example actually traced, including one the AI chose when none was given.
      setDraft({ problem: request.problem, example: request.example || walkthrough.input });
      showWalkthrough(walkthrough);
    },
  });

  const openFromLibrary = async (item: LibraryItem) => {
    generator.clearStatus();
    const walkthrough = await library.open(item.id);
    if (!walkthrough) return false;
    setActiveId(item.id);
    setDraft({ problem: item.problem, example: item.example || walkthrough.input });
    showWalkthrough(walkthrough);
    return true;
  };

  // One walkthrough per problem: a name already in the library opens it, with no AI call.
  // The backend checks too, for problems not in the loaded list.
  const generateOrOpen = async (request: WalkthroughRequest) => {
    const key = problemKey(request.problem);
    const saved = key ? library.items.find(item => problemKey(item.problem) === key) : undefined;
    if (!saved) {
      generator.generate(request);
      return;
    }
    if (await openFromLibrary(saved)) generator.notify(ALREADY_SAVED);
  };

  const confirmDelete = async () => {
    const item = pendingDelete;
    if (!item) return;
    setIsDeleting(true);
    const isDeleted = await library.remove(item.id);
    setIsDeleting(false);
    // A refusal is explained in the sidebar, so the dialog closes either way.
    setPendingDelete(null);
    if (!isDeleted) return;
    const isOnScreen =
      activeId === item.id || (activeId === null && run?.track.title === item.title);
    if (isOnScreen) {
      clear();
      setActiveId(null);
    }
  };

  const startNewProblem = () => {
    // A walkthrough still being made is left to finish; its status line stays visible.
    if (!generator.isBusy) generator.clearStatus();
    clear();
    setDraft(EMPTY_DRAFT);
    setActiveId(null);
    setComposerKey(current => current + 1);
    window.requestAnimationFrame(() => {
      const field = document.getElementById('problem');
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="mx-auto grid max-w-[1560px] items-start gap-5 pt-4 pb-10 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] min-[1101px]:grid-cols-[252px_minmax(0,1fr)]">
      <Sidebar
        library={library.items}
        libraryStatus={library.status}
        libraryNotice={library.notice}
        activeId={activeId}
        activeTitle={run?.track.title ?? null}
        onSelect={openFromLibrary}
        onDelete={setPendingDelete}
        onNewProblem={startNewProblem}
      />
      <main className="grid min-w-0 gap-[18px]">
        {run ? (
          <LessonHeader track={run.track} />
        ) : (
          <header className="grid gap-2 px-1 pt-1.5">
            <h1 className="m-0 font-display text-[27px] leading-[1.1] font-bold tracking-[-0.025em] text-balance sm:text-[34px]">
              Paste a problem
            </h1>
            <p className="m-0 max-w-[72ch] text-[15.5px] text-ink-2">
              Get a solution as a step-by-step animation you can play, pause and quiz yourself on.
            </p>
          </header>
        )}
        <InputCard key={composerKey}>
          <ProblemComposer
            draft={draft}
            onDraftChange={setDraft}
            status={generator.status}
            isBusy={generator.isBusy}
            isAvailable={generator.isAvailable}
            onGenerate={generateOrOpen}
            onStop={generator.stop}
          />
        </InputCard>
        {run ? (
          <WalkthroughPlayer run={run} />
        ) : (
          <section className={`${CARD} stage-dots grid min-h-[240px] place-items-center p-6`}>
            <p className="m-0 max-w-[48ch] text-center text-ink-2">
              Your animation will appear here. Paste a problem above, or open one from the library
              in the sidebar.
            </p>
          </section>
        )}
      </main>
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete this problem?"
        confirmLabel="Delete"
        busyLabel="Deleting…"
        isBusy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        <p className="m-0">
          <b className="font-semibold text-ink">{pendingDelete?.title}</b> will be removed from the
          library for everyone. This can&apos;t be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
