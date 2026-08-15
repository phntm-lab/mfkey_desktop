import { Usb } from "lucide-react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";

export function DeviceScreen() {
  return (
    <div className="p-6">
      <Panel
        title="Flipper connection"
        actions={<StatusBadge tone="neutral">Disconnected</StatusBadge>}
      >
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3 text-muted">
            <Usb size={20} strokeWidth={1.75} />
            <p className="text-sm">
              Connect a Flipper Zero over USB or Bluetooth LE to run live attacks.
            </p>
          </div>
          <Button variant="primary" disabled>
            Scan for devices
          </Button>
        </div>
      </Panel>
    </div>
  );
}
