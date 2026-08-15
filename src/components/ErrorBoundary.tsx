import { Component, type ReactNode } from "react";
import { toAppError, type AppError } from "../lib/errors";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: AppError | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toAppError(error, "render") };
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    const { fallback } = this.props;
    return fallback ? (
      fallback(error, this.reset)
    ) : (
      <ErrorFallback error={error} onReset={this.reset} />
    );
  }
}
