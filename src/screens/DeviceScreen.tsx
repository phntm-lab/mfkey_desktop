import { Usb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";

export function DeviceScreen() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <Panel
        title={t("screens.device.panelTitle")}
        actions={
          <StatusBadge tone="neutral">
            {t("screens.device.statusDisconnected")}
          </StatusBadge>
        }
      >
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3 text-muted">
            <Usb size={20} strokeWidth={1.75} />
            <p className="text-sm">{t("screens.device.description")}</p>
          </div>
          <Button variant="primary" disabled>
            {t("screens.device.scan")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
