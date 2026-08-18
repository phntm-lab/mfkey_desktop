import { describe, expect, it } from "vitest";
import en from "./en.json";
import ru from "./ru.json";

type Tree = { [key: string]: string | Tree };

function collectPaths(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? collectPaths(value, path)
      : [path];
  });
}

describe("locale parity", () => {
  const enPaths = collectPaths(en as Tree).sort();
  const ruPaths = collectPaths(ru as Tree).sort();

  it("has identical key sets in en and ru", () => {
    expect(ruPaths).toEqual(enPaths);
  });

  it("has no empty string values", () => {
    const empties = [
      ...collectValues(en as Tree),
      ...collectValues(ru as Tree),
    ].filter((value) => value.trim() === "");
    expect(empties).toEqual([]);
  });
});

function collectValues(tree: Tree): string[] {
  return Object.values(tree).flatMap((value) =>
    typeof value === "object" && value !== null
      ? collectValues(value)
      : [value],
  );
}
