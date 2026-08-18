import { beforeEach, describe, expect, it } from "vitest";
import { useAttackStore } from "./useAttackStore";

const store = () => useAttackStore.getState();

beforeEach(() => {
  useAttackStore.setState({ inputPath: null });
  store().reset();
});

describe("useAttackStore", () => {
  it("appends found keys in order", () => {
    store().addFoundKey({ key: "AA" });
    store().addFoundKey({ key: "BB", uid: "01020304", keyType: "A" });

    expect(store().foundKeys).toEqual([
      { key: "AA" },
      { key: "BB", uid: "01020304", keyType: "A" },
    ]);
  });

  it("keeps only the last 500 hardnested lines", () => {
    for (let i = 0; i < 520; i += 1) {
      store().addHardNestedLine(`line ${i}`);
    }

    const lines = store().hardnestedLines;
    expect(lines).toHaveLength(500);
    expect(lines[0]).toBe("line 20");
    expect(lines[lines.length - 1]).toBe("line 519");
  });

  it("applies a summary into the dedicated fields", () => {
    store().applySummary({
      dictOutputs: [{ uid: "01020304", path: "/tmp/dict.nfc", keyCount: 3 }],
      candidateKeys: 12,
      foundKeys: 2,
    });

    expect(store().candidateKeys).toBe(12);
    expect(store().summaryFoundCount).toBe(2);
    expect(store().dictOutputs).toHaveLength(1);
  });

  it("preserves inputPath across reset but clears run state", () => {
    store().setInputPath("/tmp/capture.log");
    store().addFoundKey({ key: "AA" });
    store().setStatus("running");

    store().reset();

    expect(store().inputPath).toBe("/tmp/capture.log");
    expect(store().foundKeys).toEqual([]);
    expect(store().status).toBe("idle");
  });
});
