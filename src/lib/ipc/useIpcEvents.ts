import { useCallback, useEffect, useMemo, useRef } from "react";
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
  const setStatus = useAttackStore((s) => s.setStatus);
  const setStage = useAttackStore((s) => s.setStage);
  const setProgress = useAttackStore((s) => s.setProgress);
  const addFoundKey = useAttackStore((s) => s.addFoundKey);
  const addHardNestedLine = useAttackStore((s) => s.addHardNestedLine);
  const applySummary = useAttackStore((s) => s.applySummary);
  const setCancelRequested = useAttackStore((s) => s.setCancelRequested);
  const setAttackError = useAttackStore((s) => s.setError);
  const markFinished = useAttackStore((s) => s.markFinished);
  const setConnectionStatus = useConnectionStore((s) => s.setStatus);

  const throttledProgress = useMemo(
    () => throttle(setProgress, PROGRESS_THROTTLE_MS),
    [setProgress],
  );

  const handleProgress = useCallback(
    (payload: EventPayloadMap["attack://progress"]) => {
      setStage(payload.stage);
      if (
        (payload.stage === "running" || payload.stage === "hardnested") &&
        useAttackStore.getState().status === "loading"
      ) {
        setStatus("running");
      }
      throttledProgress(payload);
    },
    [setStage, setStatus, throttledProgress],
  );

  const handleSummary = useCallback(
    (payload: EventPayloadMap["attack://summary"]) => {
      applySummary({
        dictOutputs: payload.dictOutputs,
        candidateKeys: payload.candidateKeys,
        foundKeys: payload.foundKeys,
      });
      setStatus(payload.status === "success" ? "success" : "cancelled");
      setCancelRequested(false);
      markFinished(Date.now());
    },
    [applySummary, setStatus, setCancelRequested, markFinished],
  );

  const handleError = useCallback(
    (payload: EventPayloadMap["attack://error"]) => {
      setAttackError(payload.message);
      setStatus("error");
      setCancelRequested(false);
      markFinished(Date.now());
    },
    [setAttackError, setStatus, setCancelRequested, markFinished],
  );

  useTauriEvent("attack://progress", handleProgress);
  useTauriEvent("attack://found-key", addFoundKey);
  useTauriEvent("attack://hardnested", (payload) =>
    addHardNestedLine(payload.line),
  );
  useTauriEvent("attack://summary", handleSummary);
  useTauriEvent("attack://error", handleError);
  useTauriEvent("device://status", (payload) =>
    setConnectionStatus(payload.status),
  );
}
