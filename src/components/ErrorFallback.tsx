import { AlertTriangle } from "lucide-react";
import type { AppError } from "../lib/errors";
import { Button } from "./ui/Button";

interface ErrorFallbackProps {
  error: AppError;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex h-full min-h-full w-full items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mb-1 text-base font-medium text-fg">
          Something went wrong
        </h2>
        <p className="mb-1 text-sm text-muted">{error.message}</p>
        <p className="mb-5 font-mono text-xs text-subtle">{error.code}</p>
        <Button variant="secondary" onClick={onReset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
