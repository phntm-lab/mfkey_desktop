import i18n from "../i18n";
import { applyTheme } from "../theme";
import { useApplicationStore } from "../../store/useApplicationStore";
import { useDisclaimerStore } from "../../store/useDisclaimerStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { readPersistentSettings, writePersistentSetting } from "./persistentStore";

let bootstrapped = false;

async function hydrateStores(): Promise<void> {
  const settings = await readPersistentSettings();
  useSettingsStore.getState().hydrate({
    language: settings.language,
    theme: settings.theme,
  });
  useDisclaimerStore.getState().hydrate(settings.disclaimerAccepted);
  applyTheme(settings.theme);
  void i18n.changeLanguage(settings.language);
}

function subscribePersistence(): void {
  useSettingsStore.subscribe((state, prev) => {
    if (state.language !== prev.language) {
      void writePersistentSetting("language", state.language);
    }
    if (state.theme !== prev.theme) {
      void writePersistentSetting("theme", state.theme);
    }
  });
  useDisclaimerStore.subscribe((state, prev) => {
    if (state.accepted !== prev.accepted) {
      void writePersistentSetting("disclaimerAccepted", state.accepted);
    }
  });
}

function subscribeThemeSync(): void {
  useSettingsStore.subscribe((state, prev) => {
    if (state.theme !== prev.theme) {
      applyTheme(state.theme);
    }
  });
}

function subscribeLanguageSync(): void {
  useSettingsStore.subscribe((state, prev) => {
    if (state.language !== prev.language) {
      void i18n.changeLanguage(state.language);
    }
  });
}

export async function bootstrapPersistence(): Promise<void> {
  if (bootstrapped) {
    return;
  }
  bootstrapped = true;
  await hydrateStores();
  subscribePersistence();
  subscribeThemeSync();
  subscribeLanguageSync();
  useApplicationStore.getState().setReady(true);
}
