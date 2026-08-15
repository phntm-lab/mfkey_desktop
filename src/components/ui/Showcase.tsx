import { useState } from "react";
import { Button } from "./Button";
import { Panel } from "./Panel";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { Spinner } from "./Spinner";
import { Dialog } from "./Dialog";

export function Showcase() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Panel title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="secondary" size="sm">
            Small
          </Button>
        </div>
      </Panel>

      <Panel title="Status badges">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone="neutral">Idle</StatusBadge>
          <StatusBadge tone="info">Info</StatusBadge>
          <StatusBadge tone="running">Running</StatusBadge>
          <StatusBadge tone="success">Success</StatusBadge>
          <StatusBadge tone="warning">Warning</StatusBadge>
          <StatusBadge tone="danger">Error</StatusBadge>
        </div>
      </Panel>

      <Panel title="Progress">
        <div className="flex flex-col gap-4">
          <ProgressBar label="Determinate" value={42} />
          <ProgressBar label="Indeterminate" indeterminate />
        </div>
      </Panel>

      <Panel
        title="Spinner & Dialog"
        actions={<Button size="sm" variant="secondary" onClick={() => setDialogOpen(true)}>Open dialog</Button>}
      >
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-muted">Loading indicator</span>
        </div>
      </Panel>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Example dialog"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-muted">
          Dialog content. Close with Escape, the backdrop, or the buttons.
        </p>
      </Dialog>
    </div>
  );
}
