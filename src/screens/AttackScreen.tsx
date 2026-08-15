import { useCallback, useEffect, useState } from "react";
import { FileSearch, FileText, Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { StatusBadge, type StatusTone } from "../components/ui/StatusBadge";
import { useAttackStore, type AttackStatus } from "../store/useAttackStore";
import {
  cancelAttack,
  pickInputFile,
  startFileAttack,
} from "../lib/ipc/commands";
import { toAppError } from "../lib/errors";

const STATUS_TONE: Record<AttackStatus, StatusTone> = {
  idle: "neutral",
  loading: "info",
  running: "running",
  success: "success",
  cancelled: "warning",
  error: "danger",
};

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function useElapsed(
  startedAt: number | null,
  finishedAt: number | null,
  active: boolean,
): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (startedAt === null) return null;
  const end = finishedAt ?? (active ? now : startedAt);
  return formatDuration(end - startedAt);
}

export function AttackScreen() {
  const { t } = useTranslation();
  const status = useAttackStore((s) => s.status);
  const inputPath = useAttackStore((s) => s.inputPath);
  const cancelRequested = useAttackStore((s) => s.cancelRequested);
  const startedAt = useAttackStore((s) => s.startedAt);
  const finishedAt = useAttackStore((s) => s.finishedAt);
  const setInputPath = useAttackStore((s) => s.setInputPath);
  const setStatus = useAttackStore((s) => s.setStatus);
  const setError = useAttackStore((s) => s.setError);
  const setCancelRequested = useAttackStore((s) => s.setCancelRequested);
  const markStarted = useAttackStore((s) => s.markStarted);
  const markFinished = useAttackStore((s) => s.markFinished);
  const reset = useAttackStore((s) => s.reset);

  const isActive = status === "loading" || status === "running";
  const elapsed = useElapsed(startedAt, finishedAt, isActive);

  const handlePick = useCallback(async () => {
    try {
      const path = await pickInputFile();
      if (path) setInputPath(path);
    } catch (e) {
      setError(toAppError(e, "command").message);
    }
  }, [setInputPath, setError]);

  const handleStart = useCallback(async () => {
    if (!inputPath) return;
    reset();
    markStarted(Date.now());
    setStatus("loading");
    try {
      await startFileAttack({ path: inputPath });
    } catch (e) {
      setError(toAppError(e, "command").message);
      setStatus("error");
      markFinished(Date.now());
    }
  }, [inputPath, reset, markStarted, setStatus, setError, markFinished]);

  const handleCancel = useCallback(async () => {
    setCancelRequested(true);
    try {
      await cancelAttack();
    } catch (e) {
      setError(toAppError(e, "command").message);
    }
  }, [setCancelRequested, setError]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel
        title={t("screens.attack.panelTitle")}
        actions={
          <div className="flex items-center gap-3">
            {elapsed && (
              <span className="font-mono text-xs text-muted">{elapsed}</span>
            )}
            <StatusBadge tone={STATUS_TONE[status]}>
              {t(`screens.attack.status.${status}`)}
            </StatusBadge>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t("screens.attack.description")}</p>

          <div className="flex items-center gap-3 rounded-md border border-line bg-raised px-3 py-2">
            <FileText
              size={18}
              strokeWidth={1.75}
              className="shrink-0 text-muted"
            />
            <span
              className={`min-w-0 truncate text-sm ${
                inputPath ? "text-fg" : "text-muted"
              }`}
            >
              {inputPath ? basename(inputPath) : t("screens.attack.noFile")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handlePick}
              disabled={isActive}
            >
              <FileSearch size={16} strokeWidth={1.75} />
              {t("screens.attack.selectFile")}
            </Button>
            {isActive ? (
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={cancelRequested}
              >
                <Square size={16} strokeWidth={1.75} />
                {cancelRequested
                  ? t("screens.attack.cancelling")
                  : t("screens.attack.cancel")}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleStart}
                disabled={!inputPath}
              >
                <Play size={16} strokeWidth={1.75} />
                {t("screens.attack.start")}
              </Button>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
