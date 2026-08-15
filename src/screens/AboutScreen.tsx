import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";

export function AboutScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel title={t("screens.about.appTitle")}>
        <p className="text-sm text-muted">{t("screens.about.appDescription")}</p>
      </Panel>
      <Panel title={t("disclaimer.title")}>
        <div className="flex items-start gap-3 text-muted">
          <ShieldAlert size={20} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          <p className="text-sm">{t("disclaimer.body")}</p>
        </div>
      </Panel>
    </div>
  );
}
