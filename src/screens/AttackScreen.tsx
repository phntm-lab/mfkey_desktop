import { FileSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";

export function AttackScreen() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <Panel title={t("screens.attack.panelTitle")}>
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3 text-muted">
            <FileSearch size={20} strokeWidth={1.75} />
            <p className="text-sm">{t("screens.attack.description")}</p>
          </div>
          <Button variant="primary" disabled>
            {t("screens.attack.selectFile")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
