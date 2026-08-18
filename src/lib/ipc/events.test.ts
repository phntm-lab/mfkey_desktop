import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { throttle } from "./events";

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the first call immediately", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled("a");

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith("a");
  });

  it("coalesces calls within the interval into a trailing call", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled("a");
    throttled("b");
    throttled("c");

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("c");
  });

  it("does not schedule a trailing call when idle", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled("a");
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);

    throttled("b");

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("b");
  });
});
