import { useTranslation } from "react-i18next";
import { Panel } from "../components/ui/Panel";
import {
  SegmentedControl,
  type SegmentedOption,
} from "../components/ui/SegmentedControl";
import {
  LANGUAGES,
  useSettingsStore,
  type Language,
} from "../store/useSettingsStore";
import { THEMES, type Theme } from "../lib/theme";

export function SettingsScreen() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const languageOptions: SegmentedOption<Language>[] = LANGUAGES.map((value) => ({
    value,
    label: t(`screens.settings.languageOption.${value}`),
  }));
  const themeOptions: SegmentedOption<Theme>[] = THEMES.map((value) => ({
    value,
    label: t(`screens.settings.themeOption.${value}`),
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel title={t("screens.settings.languageTitle")}>
        <SegmentedControl
          ariaLabel={t("screens.settings.languageTitle")}
          value={language}
          options={languageOptions}
          onChange={setLanguage}
        />
      </Panel>
      <Panel title={t("screens.settings.appearanceTitle")}>
        <SegmentedControl
          ariaLabel={t("screens.settings.appearanceTitle")}
          value={theme}
          options={themeOptions}
          onChange={setTheme}
        />
      </Panel>
    </div>
  );
}
