import { create } from "zustand";

interface DisclaimerState {
  accepted: boolean;
  accept: () => void;
  hydrate: (accepted: boolean) => void;
}

export const useDisclaimerStore = create<DisclaimerState>((set) => ({
  accepted: false,
  accept: () => set({ accepted: true }),
  hydrate: (accepted) => set({ accepted }),
}));
