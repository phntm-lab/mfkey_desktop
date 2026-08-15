import "./App.css";
import { AppShell } from "./components/layout/AppShell";
import { useUiStore } from "./store/useUiStore";
import { SCREEN_MAP } from "./config/screens";
import { SCREEN_COMPONENTS } from "./screens/registry";
import { useIpcEvents } from "./lib/ipc/useIpcEvents";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  useIpcEvents();

  const activeScreen = useUiStore((s) => s.activeScreen);
  const meta = SCREEN_MAP[activeScreen];
  const Screen = SCREEN_COMPONENTS[activeScreen];

  return (
    <AppShell title={meta.title}>
      <ErrorBoundary key={activeScreen}>
        <Screen />
      </ErrorBoundary>
    </AppShell>
  );
}

export default App;
