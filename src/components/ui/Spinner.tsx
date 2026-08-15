interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 18, className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-line border-t-accent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
