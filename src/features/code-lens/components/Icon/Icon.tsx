import { ReactNode } from 'react';

export type IconName =
  | 'search'
  | 'plus'
  | 'lines'
  | 'chevron'
  | 'pencil'
  | 'check'
  | 'trash'
  | 'Searching'
  | 'Sorting'
  | 'Linked lists'
  | 'Stacks'
  | 'Trees'
  | 'Graphs';

const STROKE_ICONS: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </>
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  lines: <path d="M2 4h12M2 8h8M2 12h10" />,
  chevron: <path d="M4 10l4-4 4 4" />,
  pencil: <path d="M11 2l3 3-8 8H3v-3z" />,
  check: <path d="M3 8.5l3 3 7-7" />,
  trash: <path d="M2.5 4.5h11M6.5 4.5V2.5h3v2M4 4.5l.7 9h6.6l.7-9M6.8 7v4M9.2 7v4" />,
  Searching: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </>
  ),
  Sorting: <path d="M3 13V9M8 13V5M13 13V2" />,
  'Linked lists': (
    <>
      <rect x="1.5" y="5.5" width="5" height="5" rx="1.5" />
      <rect x="9.5" y="5.5" width="5" height="5" rx="1.5" />
      <path d="M6.5 8h3" />
    </>
  ),
  Stacks: (
    <>
      <rect x="3" y="2.5" width="10" height="3" rx="1" />
      <rect x="3" y="6.5" width="10" height="3" rx="1" />
      <rect x="3" y="10.5" width="10" height="3" rx="1" />
    </>
  ),
  Trees: (
    <>
      <circle cx="8" cy="3" r="1.8" />
      <circle cx="4" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <path d="M7 4.5L5 10.3M9 4.5l2 5.8" />
    </>
  ),
  Graphs: (
    <>
      <circle cx="3.5" cy="4" r="1.8" />
      <circle cx="12.5" cy="4" r="1.8" />
      <circle cx="8" cy="12.5" r="1.8" />
      <path d="M5.3 4h5.4M4.5 5.6l2.6 5.2M11.5 5.6l-2.6 5.2" />
    </>
  ),
};

export function isIconName(name: string): name is IconName {
  return name in STROKE_ICONS;
}

export default function Icon({
  name,
  className = 'size-4',
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`flex-none fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8] ${className}`}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      {STROKE_ICONS[name]}
    </svg>
  );
}
