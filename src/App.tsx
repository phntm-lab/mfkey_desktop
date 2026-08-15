import "./App.css";
import { useTranslation } from "react-i18next";
import { AppShell } from "./components/layout/AppShell";
import { useUiStore } from "./store/useUiStore";
import { SCREEN_COMPONENTS } from "./screens/registry";
import { useIpcEvents } from "./lib/ipc/useIpcEvents";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  useIpcEvents();

  const { t } = useTranslation();
  const activeScreen = useUiStore((s) => s.activeScreen);
  const Screen = SCREEN_COMPONENTS[activeScreen];

  return (
    <AppShell title={t(`screens.${activeScreen}.title`)}>
      <ErrorBoundary key={activeScreen}>
        <Screen />
      </ErrorBoundary>
    </AppShell>
  );
}

export default App;
