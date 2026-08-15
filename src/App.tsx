import "./App.css";
import { AppShell } from "./components/layout/AppShell";
import { useUiStore } from "./store/useUiStore";
import { SCREEN_MAP } from "./config/screens";
import { Showcase } from "./components/ui/Showcase";

function App() {
  const activeScreen = useUiStore((s) => s.activeScreen);
  const meta = SCREEN_MAP[activeScreen];

  return (
    <AppShell title={meta.title}>
      <Showcase />
    </AppShell>
  );
}

export default App;
