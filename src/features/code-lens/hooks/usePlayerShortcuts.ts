import { useEffect, useRef } from 'react';

interface ShortcutHandlers {
  onNext(): void;
  onPrevious(): void;
  onTogglePlay(): void;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement)
    return target.type !== 'checkbox' && target.type !== 'range';
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

/** Left and right arrows step, Space plays and pauses, except while typing. */
export function usePlayerShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        isTypingTarget(event.target) ||
        (event.target instanceof HTMLElement && event.target.closest('.monaco-editor'))
      )
        return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handlersRef.current.onNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlersRef.current.onPrevious();
      } else if (event.key === ' ' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        handlersRef.current.onTogglePlay();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
