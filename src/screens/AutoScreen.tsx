import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bluetooth,
  Play,
  Square,
  Usb,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { StatusBadge, type StatusTone } from "../components/ui/StatusBadge";
import { useConnectionStore } from "../store/useConnectionStore";
import {
  useAutoStore,
  isAutoActive,
  type AutoPhase,
} from "../store/useAutoStore";
import { cancelAuto, startAuto } from "../lib/ipc/commands";
import { localizeError, toAppError } from "../lib/errors";

const PHASE_TONE: Record<AutoPhase, StatusTone> = {
  idle: "neutral",
  connecting: "info",
  listing: "info",
  downloading: "info",
  attacking: "running",
  uploading: "info",
  done: "success",
  error: "danger",
  cancelled: "warning",
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

export function AutoScreen() {
  const { t } = useTranslation();
  const device = useConnectionStore((s) => s.device);

  const phase = useAutoStore((s) => s.phase);
  const message = useAutoStore((s) => s.message);
  const transfer = useAutoStore((s) => s.transfer);
  const attackProgress = useAutoStore((s) => s.attackProgress);
  const foundKeys = useAutoStore((s) => s.foundKeys);
  const summary = useAutoStore((s) => s.summary);
  const error = useAutoStore((s) => s.error);
  const cancelRequested = useAutoStore((s) => s.cancelRequested);
  const startedAt = useAutoStore((s) => s.startedAt);
  const finishedAt = useAutoStore((s) => s.finishedAt);
  const setPhase = useAutoStore((s) => s.setPhase);
  const setError = useAutoStore((s) => s.setError);
  const setCancelRequested = useAutoStore((s) => s.setCancelRequested);
  const markStarted = useAutoStore((s) => s.markStarted);
  const markFinished = useAutoStore((s) => s.markFinished);
  const reset = useAutoStore((s) => s.reset);

  const [deleteLogsAfter, setDeleteLogsAfter] = useState(false);

  const active = isAutoActive(phase);
  const elapsed = useElapsed(startedAt, finishedAt, active);
  const isTerminal =
    phase === "done" || phase === "cancelled" || phase === "error";

  const handleStart = useCallback(async () => {
    if (!device) return;
    reset();
    markStarted(Date.now());
    setPhase("connecting");
    try {
      await startAuto({
        transport: device.transport,
        deviceId: device.id,
        deleteLogsAfter,
      });
    } catch (e) {
      setError(toAppError(e, "command"));
      setPhase("error");
      markFinished(Date.now());
    }
  }, [device, deleteLogsAfter, reset, markStarted, setPhase, setError, markFinished]);

  const handleCancel = useCallback(async () => {
    setCancelRequested(true);
    try {
      await cancelAuto();
    } catch (e) {
      setError(toAppError(e, "command"));
    }
  }, [setCancelRequested, setError]);

  const displayError = error ? localizeError(t, error) : null;

  const progressIndeterminate =
    phase === "connecting" ||
    phase === "listing" ||
    (phase === "downloading" && !transfer) ||
    (phase === "uploading" && !transfer) ||
    (phase === "attacking" &&
      (attackProgress === null || attackProgress.total === 0));

  const progressPercent =
    phase === "done"
      ? 100
      : phase === "attacking"
        ? (attackProgress?.percent ?? 0)
        : (transfer?.percent ?? 0);

  const phaseLabel =
    phase === "done" && message === "no_logs"
      ? t("screens.auto.noLogs")
      : t(`screens.auto.phase.${phase}`);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel
        title={t("screens.auto.panelTitle")}
        actions={
          <div className="flex items-center gap-3">
            {elapsed && (
              <span className="font-mono text-xs text-muted">{elapsed}</span>
            )}
            <StatusBadge tone={PHASE_TONE[phase]}>{phaseLabel}</StatusBadge>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t("screens.auto.description")}</p>

          {device ? (
            <div className="flex items-center gap-3 rounded-md border border-line bg-raised px-3 py-2">
              {device.transport === "usb" ? (
                <Usb size={18} strokeWidth={1.75} className="shrink-0 text-muted" />
              ) : (
                <Bluetooth
                  size={18}
                  strokeWidth={1.75}
                  className="shrink-0 text-muted"
                />
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-fg">{device.name}</span>
                <span className="truncate font-mono text-xs text-muted">
                  {device.id}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-line bg-raised px-3 py-2 text-muted">
              <AlertTriangle size={18} strokeWidth={1.75} className="shrink-0" />
              <p className="text-xs">{t("screens.auto.noDevice")}</p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={deleteLogsAfter}
              onChange={(e) => setDeleteLogsAfter(e.target.checked)}
              disabled={active}
              className="h-4 w-4 accent-accent"
            />
            {t("screens.auto.deleteLogs")}
          </label>

          <div className="flex items-center gap-2">
            {active ? (
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={cancelRequested}
              >
                <Square size={16} strokeWidth={1.75} />
                {cancelRequested
                  ? t("screens.auto.cancelling")
                  : t("screens.auto.cancel")}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleStart} disabled={!device}>
                <Play size={16} strokeWidth={1.75} />
                {t("screens.auto.start")}
              </Button>
            )}
          </div>
        </div>
      </Panel>

      {phase !== "idle" && (
        <Panel title={t("screens.auto.progressTitle")}>
          <div className="flex flex-col gap-3">
            <ProgressBar
              label={phaseLabel}
              value={progressPercent}
              indeterminate={progressIndeterminate}
            />
            {transfer &&
              (phase === "downloading" || phase === "uploading") && (
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="min-w-0 truncate font-mono">
                    {basename(transfer.path)}
                  </span>
                  <span className="font-mono">
                    {Math.round(transfer.percent)}%
                  </span>
                </div>
              )}
          </div>
        </Panel>
      )}

      {phase === "error" && displayError && (
        <Panel title={t("screens.auto.errorTitle")}>
          <div className="flex items-start gap-3 text-sm text-danger">
            <AlertTriangle size={18} strokeWidth={1.75} className="shrink-0" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="break-words">{displayError.message}</p>
              {displayError.detail && (
                <p className="break-words font-mono text-xs text-muted">
                  {displayError.detail}
                </p>
              )}
            </div>
          </div>
        </Panel>
      )}

      {(summary || foundKeys.length > 0 || isTerminal) && phase !== "error" && (
        <Panel title={t("screens.auto.resultsTitle")}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-muted">
                  {t("screens.auto.foundKeysLabel")}
                </span>
                <span className="font-mono text-fg">
                  {summary?.foundKeys ?? foundKeys.length}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted">
                  {t("screens.auto.uploadedDictsLabel")}
                </span>
                <span className="font-mono text-fg">
                  {summary?.uploadedDicts ?? 0}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted">
                  {t("screens.auto.keysAddedLabel")}
                </span>
                <span className="font-mono text-fg">
                  {summary?.keysAdded ?? 0}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted">
                  {t("screens.auto.logsProcessedLabel")}
                </span>
                <span className="font-mono text-fg">
                  {summary?.logsTotal ?? 0}
                </span>
              </div>
            </div>

            {summary && summary.logsSkipped > 0 && (
              <p className="text-xs text-muted">
                {t("screens.auto.logsSkipped", { count: summary.logsSkipped })}
              </p>
            )}

            {summary && (
              <p className="flex items-center gap-2 text-xs text-muted">
                <Zap size={14} strokeWidth={1.75} className="shrink-0" />
                {summary.keysUploaded
                  ? t("screens.auto.dictUploaded")
                  : t("screens.auto.dictUnchanged")}
              </p>
            )}

            {foundKeys.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {foundKeys.map((k, index) => (
                  <li
                    key={`${k.key}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-line bg-raised px-3 py-2"
                  >
                    <span className="font-mono text-sm text-fg">{k.key}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                      {k.uid && <span>UID {k.uid}</span>}
                      {k.keyType && (
                        <span>{t("screens.auto.keyType", { type: k.keyType })}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t("screens.auto.noKeys")}</p>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
