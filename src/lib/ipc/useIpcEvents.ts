import { useEffect, useMemo, useRef } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";
import {
  onTauriEvent,
  throttle,
  type EventName,
  type EventPayloadMap,
} from "./events";
import { useAttackStore } from "../../store/useAttackStore";
import { useConnectionStore } from "../../store/useConnectionStore";

const PROGRESS_THROTTLE_MS = 100;

export function useTauriEvent<K extends EventName>(
  name: K,
  handler: (payload: EventPayloadMap[K]) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let active = true;
    let unlisten: UnlistenFn | undefined;

    onTauriEvent(name, (payload) => handlerRef.current(payload)).then((fn) => {
      if (active) {
        unlisten = fn;
      } else {
        fn();
      }
    });

    return () => {
      active = false;
      unlisten?.();
    };
  }, [name]);
}

export function useIpcEvents(): void {
  const setProgress = useAttackStore((s) => s.setProgress);
  const addFoundKey = useAttackStore((s) => s.addFoundKey);
  const setDictOutputs = useAttackStore((s) => s.setDictOutputs);
  const setAttackError = useAttackStore((s) => s.setError);
  const setConnectionStatus = useConnectionStore((s) => s.setStatus);

  const throttledProgress = useMemo(
    () => throttle(setProgress, PROGRESS_THROTTLE_MS),
    [setProgress],
  );

  useTauriEvent("attack://progress", throttledProgress);
  useTauriEvent("attack://found-key", addFoundKey);
  useTauriEvent("attack://summary", (payload) =>
    setDictOutputs(payload.dictOutputs),
  );
  useTauriEvent("attack://error", (payload) => setAttackError(payload.message));
  useTauriEvent("device://status", (payload) =>
    setConnectionStatus(payload.status),
  );
}
