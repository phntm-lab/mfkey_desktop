interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  label?: string;
}

function clampPercent(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function ProgressBar({ value = 0, indeterminate = false, label }: ProgressBarProps) {
  const percent = clampPercent(value);
  return (
    <div className="flex flex-col gap-1.5">
      {(label || !indeterminate) && (
        <div className="flex items-center justify-between text-xs text-muted">
          {label && <span>{label}</span>}
          {!indeterminate && <span className="font-mono">{Math.round(percent)}%</span>}
        </div>
      )}
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(percent)}
      >
        {indeterminate ? (
          <div className="progress-indeterminate absolute inset-y-0 rounded-full bg-accent" />
        ) : (
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
