import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";

export function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel title={t("screens.settings.languageTitle")}>
        <p className="text-sm text-muted">
          {t("screens.settings.languagePlaceholder")}
        </p>
      </Panel>
      <Panel title={t("screens.settings.appearanceTitle")}>
        <p className="text-sm text-muted">
          {t("screens.settings.appearancePlaceholder")}
        </p>
      </Panel>
    </div>
  );
}
