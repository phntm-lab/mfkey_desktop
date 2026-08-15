import "./App.css";
import { AppShell } from "./components/layout/AppShell";

function App() {
  return (
    <AppShell active="attack" title="Attack">
      <div className="p-6">
        <p className="text-sm text-muted">Application shell placeholder.</p>
      </div>
    </AppShell>
  );
}

export default App;
