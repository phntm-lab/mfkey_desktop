import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  FileSearch,
  FileText,
  Inbox,
  Play,
  Square,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { StatusBadge, type StatusTone } from "../components/ui/StatusBadge";
import {
  useAttackStore,
  type AttackStage,
  type AttackStatus,
} from "../store/useAttackStore";
import {
  cancelAttack,
  pickInputFile,
  saveRecoveredKeys,
  startFileAttack,
} from "../lib/ipc/commands";
import { localizeError, toAppError } from "../lib/errors";

interface ExportInfo {
  tone: "success" | "danger";
  text: string;
}

const STATUS_TONE: Record<AttackStatus, StatusTone> = {
  idle: "neutral",
  loading: "info",
  running: "running",
  success: "success",
  empty: "neutral",
  cancelled: "warning",
  error: "danger",
};

function operationKey(status: AttackStatus, stage: AttackStage): string {
  if (status === "loading") return "screens.attack.stage.loading";
  if (status === "running") {
    return stage === "hardnested"
      ? "screens.attack.stage.hardnested"
      : "screens.attack.stage.running";
  }
  return `screens.attack.status.${status}`;
}

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
  const stage = useAttackStore((s) => s.stage);
  const progress = useAttackStore((s) => s.progress);
  const foundKeys = useAttackStore((s) => s.foundKeys);
  const dictOutputs = useAttackStore((s) => s.dictOutputs);
  const candidateKeys = useAttackStore((s) => s.candidateKeys);
  const hardnestedLines = useAttackStore((s) => s.hardnestedLines);
  const error = useAttackStore((s) => s.error);
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

  const [exportInfo, setExportInfo] = useState<ExportInfo | null>(null);
  const [hardnestedOpen, setHardnestedOpen] = useState(false);

  const isActive = status === "loading" || status === "running";
  const elapsed = useElapsed(startedAt, finishedAt, isActive);
  const hasResults = foundKeys.length > 0 || dictOutputs.length > 0;
  const isTerminal =
    status === "success" || status === "cancelled" || status === "error";

  const indeterminate =
    status === "loading" ||
    (status === "running" && (progress === null || progress.total === 0));
  const displayPercent = status === "success" ? 100 : (progress?.percent ?? 0);

  const handlePick = useCallback(async () => {
    try {
      const path = await pickInputFile();
      if (path) setInputPath(path);
    } catch (e) {
      setError(toAppError(e, "command"));
    }
  }, [setInputPath, setError]);

  const handleStart = useCallback(async () => {
    if (!inputPath) return;
    reset();
    setExportInfo(null);
    markStarted(Date.now());
    setStatus("loading");
    try {
      await startFileAttack({ path: inputPath });
    } catch (e) {
      setError(toAppError(e, "command"));
      setStatus("error");
      markFinished(Date.now());
    }
  }, [inputPath, reset, markStarted, setStatus, setError, markFinished]);

  const handleCancel = useCallback(async () => {
    setCancelRequested(true);
    try {
      await cancelAttack();
    } catch (e) {
      setError(toAppError(e, "command"));
    }
  }, [setCancelRequested, setError]);

  const handleExport = useCallback(async () => {
    try {
      const destination = await saveRecoveredKeys({
        keys: foundKeys.map((k) => k.key),
        dictPaths: dictOutputs.map((d) => d.path),
      });
      setExportInfo(
        destination
          ? {
              tone: "success",
              text: t("screens.attack.exportedTo", { path: destination }),
            }
          : null,
      );
    } catch (e) {
      setExportInfo({
        tone: "danger",
        text: localizeError(t, toAppError(e, "command")).message,
      });
    }
  }, [foundKeys, dictOutputs, t]);

  const displayError = error ? localizeError(t, error) : null;

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

      {status !== "idle" && status !== "empty" && (
        <Panel title={t("screens.attack.progressTitle")}>
          <div className="flex flex-col gap-3">
            <ProgressBar
              label={t(operationKey(status, stage))}
              value={displayPercent}
              indeterminate={indeterminate}
            />
            {progress && progress.total > 0 && (
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t("screens.attack.noncesLabel")}</span>
                <span className="font-mono">
                  {progress.processed} / {progress.total}
                </span>
              </div>
            )}
          </div>
        </Panel>
      )}

      {status === "error" && displayError && (
        <Panel title={t("screens.attack.errorTitle")}>
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

      {status === "empty" && (
        <Panel title={t("screens.attack.emptyTitle")}>
          <div className="flex items-start gap-3 text-sm text-muted">
            <Inbox size={18} strokeWidth={1.75} className="shrink-0" />
            <p className="min-w-0 break-words">
              {t("screens.attack.emptyBody")}
            </p>
          </div>
        </Panel>
      )}

      {(hasResults || isTerminal) && status !== "error" && (
        <Panel
          title={t("screens.attack.resultsTitle")}
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExport}
              disabled={!hasResults}
            >
              <Download size={16} strokeWidth={1.75} />
              {t("screens.attack.export")}
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-6 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-muted">
                  {t("screens.attack.foundKeysLabel")}
                </span>
                <span className="font-mono text-fg">{foundKeys.length}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-muted">
                  {t("screens.attack.candidateKeysLabel")}
                </span>
                <span className="font-mono text-fg">{candidateKeys}</span>
              </div>
            </div>

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
                        <span>
                          {t("screens.attack.keyType", { type: k.keyType })}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t("screens.attack.noKeys")}</p>
            )}

            {dictOutputs.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("screens.attack.dictionariesLabel")}
                </h3>
                {dictOutputs.map((d) => (
                  <div
                    key={d.path}
                    className="flex items-center justify-between gap-3 rounded-md border border-line bg-raised px-3 py-2 text-sm"
                  >
                    <span
                      className="min-w-0 truncate font-mono text-fg"
                      title={d.path}
                    >
                      {basename(d.path)}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      UID {d.uid} ·{" "}
                      {t("screens.attack.keysCount", { count: d.keyCount })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {exportInfo && (
              <p
                className={`text-xs ${
                  exportInfo.tone === "success" ? "text-success" : "text-danger"
                }`}
              >
                {exportInfo.text}
              </p>
            )}
          </div>
        </Panel>
      )}

      {hardnestedLines.length > 0 && (
        <Panel
          title={t("screens.attack.hardnestedTitle")}
          actions={
            <button
              type="button"
              onClick={() => setHardnestedOpen((open) => !open)}
              aria-expanded={hardnestedOpen}
              className="inline-flex items-center gap-1.5 rounded text-xs text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {hardnestedOpen ? (
                <ChevronDown size={14} strokeWidth={1.75} />
              ) : (
                <ChevronRight size={14} strokeWidth={1.75} />
              )}
              {t("screens.attack.linesCount", { count: hardnestedLines.length })}
            </button>
          }
        >
          {hardnestedOpen ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-line bg-raised p-3 font-mono text-xs leading-relaxed text-muted">
              {hardnestedLines.join("\n")}
            </pre>
          ) : (
            <p className="text-xs text-muted">
              {t("screens.attack.hardnestedHint")}
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}
