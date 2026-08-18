import { create } from "zustand";
import type { AppError } from "../lib/errors";

export type AttackStatus =
  "idle" | "loading" | "running" | "success" | "empty" | "error" | "cancelled";

export type AttackStage = "idle" | "loading" | "running" | "hardnested";

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

export interface AttackSummary {
  dictOutputs: DictOutput[];
  candidateKeys: number;
  foundKeys: number;
}

const MAX_HARDNESTED_LINES = 500;

interface AttackState {
  status: AttackStatus;
  stage: AttackStage;
  progress: AttackProgress | null;
  foundKeys: FoundKey[];
  dictOutputs: DictOutput[];
  hardnestedLines: string[];
  candidateKeys: number;
  summaryFoundCount: number;
  cancelRequested: boolean;
  error: AppError | null;
  inputPath: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  setStatus: (status: AttackStatus) => void;
  setStage: (stage: AttackStage) => void;
  setProgress: (progress: AttackProgress | null) => void;
  addFoundKey: (key: FoundKey) => void;
  setDictOutputs: (outputs: DictOutput[]) => void;
  addHardNestedLine: (line: string) => void;
  applySummary: (summary: AttackSummary) => void;
  setCancelRequested: (requested: boolean) => void;
  setError: (error: AppError | null) => void;
  setInputPath: (path: string | null) => void;
  markStarted: (at: number) => void;
  markFinished: (at: number) => void;
  reset: () => void;
}

const runInitialState = {
  status: "idle" as AttackStatus,
  stage: "idle" as AttackStage,
  progress: null,
  foundKeys: [] as FoundKey[],
  dictOutputs: [] as DictOutput[],
  hardnestedLines: [] as string[],
  candidateKeys: 0,
  summaryFoundCount: 0,
  cancelRequested: false,
  error: null,
  startedAt: null,
  finishedAt: null,
};

export const useAttackStore = create<AttackState>((set) => ({
  ...runInitialState,
  inputPath: null,
  setStatus: (status) => set({ status }),
  setStage: (stage) => set({ stage }),
  setProgress: (progress) => set({ progress }),
  addFoundKey: (key) =>
    set((state) => ({ foundKeys: [...state.foundKeys, key] })),
  setDictOutputs: (dictOutputs) => set({ dictOutputs }),
  addHardNestedLine: (line) =>
    set((state) => {
      const next = [...state.hardnestedLines, line];
      return {
        hardnestedLines:
          next.length > MAX_HARDNESTED_LINES
            ? next.slice(next.length - MAX_HARDNESTED_LINES)
            : next,
      };
    }),
  applySummary: (summary) =>
    set({
      dictOutputs: summary.dictOutputs,
      candidateKeys: summary.candidateKeys,
      summaryFoundCount: summary.foundKeys,
    }),
  setCancelRequested: (cancelRequested) => set({ cancelRequested }),
  setError: (error) => set({ error }),
  setInputPath: (inputPath) => set({ inputPath }),
  markStarted: (at) => set({ startedAt: at, finishedAt: null }),
  markFinished: (at) => set({ finishedAt: at }),
  reset: () => set(runInitialState),
}));
