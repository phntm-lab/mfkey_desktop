import { create } from "zustand";

export type AttackStatus =
  | "idle"
  | "loading"
  | "running"
  | "success"
  | "error"
  | "cancelled";

export type AttackStage =
  | "idle"
  | "loading"
  | "mfkey32"
  | "static_nested"
  | "static_encrypted"
  | "hardnested"
  | "summary";

export type KeyType = "A" | "B";

export interface FoundKey {
  key: string;
  uid?: string;
  keyType?: KeyType;
}

export interface DictOutput {
  uid: string;
  path: string;
  keyCount: number;
}

export interface AttackProgress {
  stage: AttackStage;
  processed: number;
  total: number;
  percent: number;
}

interface AttackState {
  status: AttackStatus;
  stage: AttackStage;
  progress: AttackProgress | null;
  foundKeys: FoundKey[];
  dictOutputs: DictOutput[];
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  setStatus: (status: AttackStatus) => void;
  setStage: (stage: AttackStage) => void;
  setProgress: (progress: AttackProgress | null) => void;
  addFoundKey: (key: FoundKey) => void;
  setDictOutputs: (outputs: DictOutput[]) => void;
  setError: (error: string | null) => void;
  markStarted: (at: number) => void;
  markFinished: (at: number) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as AttackStatus,
  stage: "idle" as AttackStage,
  progress: null,
  foundKeys: [] as FoundKey[],
  dictOutputs: [] as DictOutput[],
  error: null,
  startedAt: null,
  finishedAt: null,
};

export const useAttackStore = create<AttackState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setStage: (stage) => set({ stage }),
  setProgress: (progress) => set({ progress }),
  addFoundKey: (key) =>
    set((state) => ({ foundKeys: [...state.foundKeys, key] })),
  setDictOutputs: (dictOutputs) => set({ dictOutputs }),
  setError: (error) => set({ error }),
  markStarted: (at) => set({ startedAt: at, finishedAt: null }),
  markFinished: (at) => set({ finishedAt: at }),
  reset: () => set(initialState),
}));
