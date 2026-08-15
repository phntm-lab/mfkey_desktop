import "./App.css";
import { AppShell } from "./components/layout/AppShell";
import { useUiStore } from "./store/useUiStore";
import { SCREEN_MAP } from "./config/screens";
import { SCREEN_COMPONENTS } from "./screens/registry";

function App() {
  const activeScreen = useUiStore((s) => s.activeScreen);
  const meta = SCREEN_MAP[activeScreen];
  const Screen = SCREEN_COMPONENTS[activeScreen];

  return (
    <AppShell title={meta.title}>
      <Screen />
    </AppShell>
  );
}

export default App;
