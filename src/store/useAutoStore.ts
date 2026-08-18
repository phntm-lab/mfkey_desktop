import { create } from "zustand";

export type AutoPhase =
  | "idle"
  | "connecting"
  | "listing"
  | "downloading"
  | "attacking"
  | "uploading"
  | "done"
  | "error"
  | "cancelled";

export interface AutoTransfer {
  path: string;
  transferred: number;
  total: number;
  percent: number;
}

export interface AutoSummary {
  foundKeys: number;
  uploadedDicts: number;
  keysAdded: number;
  keysUploaded: boolean;
}

const activePhases: ReadonlySet<AutoPhase> = new Set<AutoPhase>([
  "connecting",
  "listing",
  "downloading",
  "attacking",
  "uploading",
]);

interface AutoState {
  phase: AutoPhase;
  message: string | null;
  transfer: AutoTransfer | null;
  summary: AutoSummary | null;
  cancelRequested: boolean;
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  running: () => boolean;
  setPhase: (phase: AutoPhase, message?: string | null) => void;
  setTransfer: (transfer: AutoTransfer | null) => void;
  setSummary: (summary: AutoSummary | null) => void;
  setCancelRequested: (requested: boolean) => void;
  setError: (error: string | null) => void;
  markStarted: (at: number) => void;
  markFinished: (at: number) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as AutoPhase,
  message: null,
  transfer: null,
  summary: null,
  cancelRequested: false,
  error: null,
  startedAt: null,
  finishedAt: null,
};

export function isAutoActive(phase: AutoPhase): boolean {
  return activePhases.has(phase);
}

export const useAutoStore = create<AutoState>((set, get) => ({
  ...initialState,
  running: () => isAutoActive(get().phase),
  setPhase: (phase, message = null) => set({ phase, message }),
  setTransfer: (transfer) => set({ transfer }),
  setSummary: (summary) => set({ summary }),
  setCancelRequested: (cancelRequested) => set({ cancelRequested }),
  setError: (error) => set({ error }),
  markStarted: (at) => set({ startedAt: at, finishedAt: null }),
  markFinished: (at) => set({ finishedAt: at }),
  reset: () => set(initialState),
}));
