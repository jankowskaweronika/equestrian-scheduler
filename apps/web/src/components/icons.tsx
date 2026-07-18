import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M15 21V9h3a1 1 0 0 1 1 1v11" />
      <path d="M8 7h4M8 11h4M8 15h4" />
    </svg>
  );
}

export function ResourcesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 6V4M16 6V4" />
    </svg>
  );
}

export function HorseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M5 21c0-4 1.5-7 4.5-9L8 8l2-1 1.5 2A7 7 0 0 1 19 16v5" />
      <path d="M8 8 6.5 5.5 4 6l1.2 2.4" />
      <circle cx="10.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TeamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.5a2.5 2.5 0 0 1 0 5" />
      <path d="M17 15.5a5 5 0 0 1 3.5 4.5" />
    </svg>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v3M16 3v3" />
      <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
