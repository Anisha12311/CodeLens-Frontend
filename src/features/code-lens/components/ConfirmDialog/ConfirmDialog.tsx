import { ReactNode, useEffect, useRef } from 'react';
import { BUTTON } from '../../styles/code-lens.styles';
import Icon from '../Icon/Icon';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while the action runs. */
  busyLabel: string;
  isBusy: boolean;
  onConfirm(): void;
  onCancel(): void;
}

/** A modal asking the student to confirm a destructive action; Esc or a backdrop click cancels. */
export default function ConfirmDialog({
  isOpen,
  title,
  children,
  confirmLabel,
  busyLabel,
  isBusy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const cancel = () => {
    if (!isBusy) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[20px] border border-line bg-panel p-0 text-ink shadow-card backdrop:bg-black/55 backdrop:backdrop-blur-[2px]"
      aria-labelledby="confirm-dialog-title"
      onCancel={event => {
        // Esc: close through state so the parent stays in charge.
        event.preventDefault();
        cancel();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <div className="grid gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 flex-none place-items-center rounded-xl bg-bad/15 text-bad">
            <Icon name="trash" className="size-5" />
          </span>
          <div className="grid min-w-0 gap-1.5">
            <h2
              id="confirm-dialog-title"
              className="m-0 font-display text-lg leading-tight font-bold tracking-tight"
            >
              {title}
            </h2>
            <div className="text-[14.5px] leading-normal text-ink-2">{children}</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={BUTTON} disabled={isBusy} onClick={cancel} autoFocus>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-bad bg-bad px-4 font-semibold text-panel shadow-[0_8px_22px_-10px_var(--bad)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
