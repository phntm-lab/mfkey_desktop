import { FileSearch } from "lucide-react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";

export function AttackScreen() {
  return (
    <div className="p-6">
      <Panel title="Offline attack">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3 text-muted">
            <FileSearch size={20} strokeWidth={1.75} />
            <p className="text-sm">
              Select a Flipper nonce log to recover MIFARE Classic keys.
            </p>
          </div>
          <Button variant="primary" disabled>
            Select log file
          </Button>
        </div>
      </Panel>
    </div>
  );
}
