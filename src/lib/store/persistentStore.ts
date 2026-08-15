import { isTauri } from "@tauri-apps/api/core";
import { load, type Store } from "@tauri-apps/plugin-store";
import {
  DEFAULT_PERSISTENT_SETTINGS,
  PERSISTENT_KEYS,
  PERSISTENT_STORE_FILE,
  type PersistentSettings,
} from "./schema";

let storePromise: Promise<Store> | null = null;

const memoryState: PersistentSettings = { ...DEFAULT_PERSISTENT_SETTINGS };

function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(PERSISTENT_STORE_FILE, { autoSave: false });
  }
  return storePromise;
}

export async function readPersistentSettings(): Promise<PersistentSettings> {
  if (!isTauri()) {
    return { ...memoryState };
  }
  const store = await getStore();
  const result: PersistentSettings = { ...DEFAULT_PERSISTENT_SETTINGS };
  for (const key of PERSISTENT_KEYS) {
    const stored = await store.get(key);
    if (stored !== undefined && stored !== null) {
      (result as unknown as Record<string, unknown>)[key] = stored;
    }
  }
  return result;
}

export async function writePersistentSetting<K extends keyof PersistentSettings>(
  key: K,
  value: PersistentSettings[K],
): Promise<void> {
  if (!isTauri()) {
    memoryState[key] = value;
    return;
  }
  const store = await getStore();
  await store.set(key, value);
  await store.save();
}
