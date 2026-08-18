import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
import type {
  AttackProgress,
  DictOutput,
  FoundKey,
} from "../../store/useAttackStore";
import type {
  ConnectionStatus,
  TransportKind,
} from "../../store/useConnectionStore";
import type { AutoPhase } from "../../store/useAutoStore";
import type { CommandError } from "./commands";

export type AttackCompletionStatus = "success" | "cancelled" | "empty";

export interface AttackSummaryPayload {
  foundKeys: number;
  candidateKeys: number;
  dictOutputs: DictOutput[];
  status: AttackCompletionStatus;
}

export interface HardNestedPayload {
  line: string;
}

export interface DeviceStatusPayload {
  status: ConnectionStatus;
  deviceId?: string;
  transport?: TransportKind;
  code?: string;
  message?: string;
}

export interface TransferProgressPayload {
  path: string;
  transferred: number;
  total: number;
  percent: number;
}

export interface AutoStatusPayload {
  phase: AutoPhase;
  message?: string;
}

export interface AutoSummaryPayload {
  foundKeys: number;
  uploadedDicts: number;
  keysAdded: number;
  keysUploaded: boolean;
  logsTotal: number;
  logsSkipped: number;
}

export interface EventPayloadMap {
  "attack://progress": AttackProgress;
  "attack://found-key": FoundKey;
  "attack://summary": AttackSummaryPayload;
  "attack://hardnested": HardNestedPayload;
  "attack://error": CommandError;
  "device://status": DeviceStatusPayload;
  "transfer://progress": TransferProgressPayload;
  "auto://status": AutoStatusPayload;
  "auto://summary": AutoSummaryPayload;
  "auto://error": CommandError;
}

export type EventName = keyof EventPayloadMap;

export const EVENTS = {
  attackProgress: "attack://progress",
  attackFoundKey: "attack://found-key",
  attackSummary: "attack://summary",
  attackHardNested: "attack://hardnested",
  attackError: "attack://error",
  deviceStatus: "device://status",
  transferProgress: "transfer://progress",
  autoStatus: "auto://status",
  autoSummary: "auto://summary",
  autoError: "auto://error",
} as const;

export function onTauriEvent<K extends EventName>(
  name: K,
  handler: (payload: EventPayloadMap[K]) => void,
): Promise<UnlistenFn> {
  if (!isTauri()) {
    return Promise.resolve(() => {});
  }
  return listen<EventPayloadMap[K]>(name, (event) => handler(event.payload));
}

export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs: number,
): (...args: A) => void {
  let last = 0;
  let pending: A | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const run = (args: A) => {
    last = Date.now();
    fn(...args);
  };

  return (...args: A) => {
    const remaining = intervalMs - (Date.now() - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      run(args);
      return;
    }
    pending = args;
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        if (pending) {
          run(pending);
          pending = null;
        }
      }, remaining);
    }
  };
}
