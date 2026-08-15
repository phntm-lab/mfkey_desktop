import { Panel } from "../components/ui/Panel";

export function SettingsScreen() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel title="Language">
        <p className="text-sm text-muted">Language selection will appear here.</p>
      </Panel>
      <Panel title="Appearance">
        <p className="text-sm text-muted">Theme selection will appear here.</p>
      </Panel>
    </div>
  );
}
