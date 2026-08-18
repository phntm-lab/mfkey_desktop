import type { ReactNode } from "react";

export type StatusTone =
  "neutral" | "info" | "success" | "warning" | "danger" | "running";

interface StatusBadgeProps {
  tone?: StatusTone;
  children: ReactNode;
}

const TONES: Record<StatusTone, string> = {
  neutral: "text-muted bg-raised",
  info: "text-info bg-info/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
  running: "text-accent bg-accent-soft",
};

export function StatusBadge({ tone = "neutral", children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {tone === "running" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      )}
      {children}
    </span>
  );
}
