import type { TFunction } from "i18next";
import type { CommandError } from "./ipc/commands";

export type AppErrorSource = "command" | "event" | "render" | "unknown";

export interface AppError {
  source: AppErrorSource;
  code: string;
  message: string;
  cause?: unknown;
}

function isCommandError(value: unknown): value is CommandError {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.code === "string" && typeof record.message === "string"
  );
}

export function toAppError(
  value: unknown,
  fallbackSource: AppErrorSource = "unknown",
): AppError {
  if (isCommandError(value)) {
    return {
      source: "command",
      code: value.code,
      message: value.message,
      cause: value,
    };
  }
  if (value instanceof Error) {
    return {
      source: fallbackSource,
      code: value.name || "error",
      message: value.message,
      cause: value,
    };
  }
  if (typeof value === "string") {
    return { source: fallbackSource, code: "error", message: value };
  }
  return {
    source: fallbackSource,
    code: "unknown",
    message: "An unexpected error occurred",
    cause: value,
  };
}

export interface DisplayError {
  message: string;
  detail: string | null;
}

export function localizeError(t: TFunction, error: AppError): DisplayError {
  const localized = t(`errors.${error.code}`, { defaultValue: "" });
  if (localized) {
    const detail =
      error.message && error.message !== localized ? error.message : null;
    return { message: localized, detail };
  }
  return { message: error.message || t("errors.unknown"), detail: null };
}
