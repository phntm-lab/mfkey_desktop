import { ShieldAlert } from "lucide-react";
import { Panel } from "../components/ui/Panel";

export function AboutScreen() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel title="MFKey Desktop">
        <p className="text-sm text-muted">
          A cross-platform desktop tool for recovering MIFARE Classic keys from
          Flipper Zero nonce logs.
        </p>
      </Panel>
      <Panel title="Disclaimer">
        <div className="flex items-start gap-3 text-muted">
          <ShieldAlert size={20} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          <p className="text-sm">
            For security research and testing on cards you own or are authorized
            to analyze. The disclaimer flow will appear here.
          </p>
        </div>
      </Panel>
    </div>
  );
}
