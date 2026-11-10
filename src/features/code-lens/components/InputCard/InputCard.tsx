import { ReactNode, useState } from 'react';
import { CARD } from '../../styles/code-lens.styles';
import Icon from '../Icon/Icon';

export default function InputCard({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className={CARD}>
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-[18px] py-3.5 text-left font-semibold"
        aria-expanded={isOpen}
        aria-controls="input-body"
        onClick={() => setIsOpen(open => !open)}
      >
        <span className="grid size-7 place-items-center rounded-[9px] border border-line bg-panel-2 text-ink-2">
          <Icon name="lines" />
        </span>
        <span className="flex-1">Input</span>
        <Icon
          name="chevron"
          className={`size-4 text-ink-3 transition-transform ${isOpen ? '' : 'rotate-180'}`}
        />
      </button>
      {isOpen ? (
        <div id="input-body" className="grid gap-3.5 px-[18px] pb-[18px]">
          {children}
        </div>
      ) : null}
    </section>
  );
}
