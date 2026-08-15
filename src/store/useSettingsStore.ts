import { create } from "zustand";
import { DEFAULT_THEME, type Theme } from "../lib/theme";

export type Language = "en" | "ru";

export const LANGUAGES: readonly Language[] = ["en", "ru"] as const;

export const DEFAULT_LANGUAGE: Language = "en";

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: DEFAULT_LANGUAGE,
  theme: DEFAULT_THEME,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
}));
