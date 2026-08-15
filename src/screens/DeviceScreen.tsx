import { useCallback } from "react";
import { AlertTriangle, Bluetooth, Link2, Search, Usb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { StatusBadge, type StatusTone } from "../components/ui/StatusBadge";
import {
  SegmentedControl,
  type SegmentedOption,
} from "../components/ui/SegmentedControl";
import {
  useConnectionStore,
  type ConnectionStatus,
  type FlipperDevice,
  type TransportKind,
} from "../store/useConnectionStore";
import { connectFlipper, listFlipperUsb, scanBle } from "../lib/ipc/commands";
import { toAppError } from "../lib/errors";

const STATUS_TONE: Record<ConnectionStatus, StatusTone> = {
  disconnected: "neutral",
  scanning: "info",
  connecting: "info",
  connected: "success",
  error: "danger",
};

export function DeviceScreen() {
  const { t } = useTranslation();
  const status = useConnectionStore((s) => s.status);
  const transport = useConnectionStore((s) => s.transport);
  const device = useConnectionStore((s) => s.device);
  const availableDevices = useConnectionStore((s) => s.availableDevices);
  const error = useConnectionStore((s) => s.error);
  const setStatus = useConnectionStore((s) => s.setStatus);
  const setTransport = useConnectionStore((s) => s.setTransport);
  const setDevice = useConnectionStore((s) => s.setDevice);
  const setAvailableDevices = useConnectionStore((s) => s.setAvailableDevices);
  const setError = useConnectionStore((s) => s.setError);

  const busy = status === "scanning" || status === "connecting";

  const transportOptions: readonly SegmentedOption<TransportKind>[] = [
    { value: "usb", label: t("screens.device.transport.usb") },
    { value: "ble", label: t("screens.device.transport.ble") },
  ];

  const handleTransportChange = useCallback(
    (next: TransportKind) => {
      setTransport(next);
      setAvailableDevices([]);
      setDevice(null);
      setError(null);
      setStatus("disconnected");
    },
    [setTransport, setAvailableDevices, setDevice, setError, setStatus],
  );

  const handleScan = useCallback(async () => {
    setError(null);
    setDevice(null);
    setStatus("scanning");
    try {
      const devices =
        transport === "usb" ? await listFlipperUsb() : await scanBle();
      setAvailableDevices(devices);
      setStatus("disconnected");
    } catch (e) {
      setError(toAppError(e, "command").message);
      setStatus("error");
    }
  }, [transport, setError, setDevice, setStatus, setAvailableDevices]);

  const handleSelect = useCallback(
    (selected: FlipperDevice) => {
      setDevice(selected);
      setError(null);
    },
    [setDevice, setError],
  );

  const handleConnect = useCallback(async () => {
    if (!device) return;
    try {
      await connectFlipper({ transport, deviceId: device.id });
    } catch (e) {
      setError(toAppError(e, "command").message);
      setStatus("error");
    }
  }, [device, transport, setError, setStatus]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel
        title={t("screens.device.panelTitle")}
        actions={
          <StatusBadge tone={STATUS_TONE[status]}>
            {t(`screens.device.status.${status}`)}
          </StatusBadge>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {t("screens.device.description")}
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("screens.device.transportLabel")}
            </span>
            <SegmentedControl
              value={transport}
              options={transportOptions}
              onChange={handleTransportChange}
              ariaLabel={t("screens.device.transportLabel")}
            />
          </div>

          {transport === "ble" && (
            <div className="flex items-start gap-3 text-muted">
              <Bluetooth size={18} strokeWidth={1.75} className="shrink-0" />
              <p className="text-xs">{t("screens.device.bleHint")}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleScan} disabled={busy}>
              {status === "scanning" ? (
                <Spinner size={16} />
              ) : (
                <Search size={16} strokeWidth={1.75} />
              )}
              {status === "scanning"
                ? t("screens.device.scanning")
                : t("screens.device.scan")}
            </Button>
            <Button
              variant="primary"
              onClick={handleConnect}
              disabled={!device || busy}
            >
              {status === "connecting" ? (
                <Spinner size={16} />
              ) : (
                <Link2 size={16} strokeWidth={1.75} />
              )}
              {status === "connecting"
                ? t("screens.device.connecting")
                : t("screens.device.connect")}
            </Button>
          </div>
        </div>
      </Panel>

      {status === "error" && error && (
        <Panel title={t("screens.device.errorTitle")}>
          <div className="flex items-start gap-3 text-sm text-danger">
            <AlertTriangle size={18} strokeWidth={1.75} className="shrink-0" />
            <p className="min-w-0 break-words">{error}</p>
          </div>
        </Panel>
      )}

      <Panel title={t("screens.device.devicesTitle")}>
        {availableDevices.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {availableDevices.map((d) => {
              const active = device?.id === d.id;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(d)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      active
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-raised hover:border-line-strong"
                    }`}
                  >
                    {d.transport === "usb" ? (
                      <Usb
                        size={18}
                        strokeWidth={1.75}
                        className="shrink-0 text-muted"
                      />
                    ) : (
                      <Bluetooth
                        size={18}
                        strokeWidth={1.75}
                        className="shrink-0 text-muted"
                      />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-fg">{d.name}</span>
                      <span className="truncate font-mono text-xs text-muted">
                        {d.id}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("screens.device.noDevices")}</p>
        )}
      </Panel>
    </div>
  );
}
