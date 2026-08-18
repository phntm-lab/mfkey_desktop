import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import { localizeError, toAppError, type AppError } from "./errors";

const table: Record<string, string> = {
  "errors.io": "Input/output failure",
  "errors.unknown": "Unknown error",
};

const t = ((key: string, opts?: { defaultValue?: string }) => {
  if (key in table) {
    return table[key];
  }
  return opts?.defaultValue ?? key;
}) as unknown as TFunction;

const makeError = (code: string, message: string): AppError => ({
  source: "command",
  code,
  message,
});

describe("localizeError", () => {
  it("localizes a known code and keeps the raw message as detail", () => {
    const result = localizeError(t, makeError("io", "read failed at byte 0"));

    expect(result.message).toBe("Input/output failure");
    expect(result.detail).toBe("read failed at byte 0");
  });

  it("drops the detail when the raw message equals the localized text", () => {
    const result = localizeError(t, makeError("io", "Input/output failure"));

    expect(result.message).toBe("Input/output failure");
    expect(result.detail).toBeNull();
  });

  it("falls back to the raw message when the code is unknown", () => {
    const result = localizeError(t, makeError("nope", "raw text"));

    expect(result.message).toBe("raw text");
    expect(result.detail).toBeNull();
  });

  it("falls back to the generic label when there is no message", () => {
    const result = localizeError(t, makeError("nope", ""));

    expect(result.message).toBe("Unknown error");
    expect(result.detail).toBeNull();
  });
});

describe("toAppError", () => {
  it("recognizes a backend CommandError shape", () => {
    const result = toAppError({ code: "parse", message: "bad line" });

    expect(result.source).toBe("command");
    expect(result.code).toBe("parse");
    expect(result.message).toBe("bad line");
  });

  it("maps a native Error using the fallback source", () => {
    const result = toAppError(new Error("boom"), "render");

    expect(result.source).toBe("render");
    expect(result.message).toBe("boom");
  });

  it("wraps a plain string", () => {
    const result = toAppError("just text", "event");

    expect(result.source).toBe("event");
    expect(result.code).toBe("error");
    expect(result.message).toBe("just text");
  });

  it("produces a generic error for unrecognized values", () => {
    const result = toAppError(42);

    expect(result.source).toBe("unknown");
    expect(result.code).toBe("unknown");
  });
});
