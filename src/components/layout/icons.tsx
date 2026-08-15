import type { ReactNode } from "react";

export interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number, className: string | undefined, children: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function KeyIcon({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.85 12.15 20 3" />
      <path d="M18 5l2 2" />
      <path d="M15 8l2 2" />
    </>,
  );
}

export function ChipIcon({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3" />
      <path d="M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
    </>,
  );
}

export function GearIcon({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>,
  );
}

export function CloseIcon({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>,
  );
}

export function InfoIcon({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>,
  );
}
