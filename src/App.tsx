import "./App.css";
import { AppShell } from "./components/layout/AppShell";
import { useUiStore } from "./store/useUiStore";
import { SCREEN_MAP } from "./config/screens";

function App() {
  const activeScreen = useUiStore((s) => s.activeScreen);
  const meta = SCREEN_MAP[activeScreen];

  return (
    <AppShell title={meta.title}>
      <div className="p-6">
        <p className="text-sm text-muted">
          {meta.label} screen placeholder.
        </p>
      </div>
    </AppShell>
  );
}

export default App;
