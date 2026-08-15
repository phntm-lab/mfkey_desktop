import { create } from "zustand";
import type { ScreenId } from "../config/screens";

interface UiState {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeScreen: "attack",
  setActiveScreen: (activeScreen) => set({ activeScreen }),
}));
