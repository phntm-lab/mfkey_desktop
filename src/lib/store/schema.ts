import type { Language } from "../../store/useSettingsStore";
import type { Theme } from "../theme";

export const PERSISTENT_STORE_FILE = "settings.json";

export interface PersistentSettings {
  language: Language;
  theme: Theme;
  disclaimerAccepted: boolean;
}

export const PERSISTENT_KEYS = [
  "language",
  "theme",
  "disclaimerAccepted",
] as const satisfies readonly (keyof PersistentSettings)[];

export const DEFAULT_PERSISTENT_SETTINGS: PersistentSettings = {
  language: "en",
  theme: "dark",
  disclaimerAccepted: false,
};
