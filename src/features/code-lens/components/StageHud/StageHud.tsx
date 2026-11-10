import { TEXT_BY_STATE } from '../../styles/code-lens.styles';
import { HudItem } from '../../types/code-lens.types';

const SIDES = ['left-2.5 sm:left-4', 'right-2.5 sm:right-4'];

function hasValue(item?: HudItem): item is HudItem {
  return Boolean(item) && item?.value !== undefined && item.value !== '' && item.value !== '-';
}

/** The two most important variables, shown large in the stage corners. */
export default function StageHud({ items }: { items: HudItem[] }) {
  return (
    <>
      {items.slice(0, 2).map((item, index) =>
        hasValue(item) ? (
          <div
            key={item.name}
            className={`pointer-events-none absolute top-2.5 z-[1] inline-flex h-[26px] max-w-[46%] items-center gap-1.5 overflow-hidden rounded-full border border-line bg-panel-2/85 px-3 font-mono text-xs font-bold whitespace-nowrap text-ink-2 sm:top-3.5 sm:h-[30px] sm:text-[13.5px] ${SIDES[index]}`}
          >
            {item.name} = <span className={TEXT_BY_STATE[item.state]}>{item.value}</span>
          </div>
        ) : null,
      )}
    </>
  );
}
