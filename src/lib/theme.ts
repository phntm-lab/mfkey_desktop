export type Theme = "dark" | "light";

export const THEMES: readonly Theme[] = ["dark", "light"] as const;

export const DEFAULT_THEME: Theme = "dark";

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function getActiveTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
