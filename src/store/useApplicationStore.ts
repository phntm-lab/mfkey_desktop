import { create } from "zustand";

export type AppMode = "offline" | "auto";

export const DEFAULT_APP_MODE: AppMode = "offline";

interface ApplicationState {
  mode: AppMode;
  ready: boolean;
  setMode: (mode: AppMode) => void;
  setReady: (ready: boolean) => void;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  mode: DEFAULT_APP_MODE,
  ready: false,
  setMode: (mode) => set({ mode }),
  setReady: (ready) => set({ ready }),
}));
