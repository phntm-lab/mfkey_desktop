import type { ComponentType } from "react";
import { KeyIcon, ChipIcon, GearIcon, InfoIcon, type IconProps } from "./icons";

export type ScreenId = "attack" | "device" | "settings" | "about";

interface RailItem {
  id: ScreenId;
  label: string;
  Icon: ComponentType<IconProps>;
}

const PRIMARY_ITEMS: RailItem[] = [
  { id: "attack", label: "Attack", Icon: KeyIcon },
  { id: "device", label: "Device", Icon: ChipIcon },
];

const SECONDARY_ITEMS: RailItem[] = [
  { id: "settings", label: "Settings", Icon: GearIcon },
  { id: "about", label: "About", Icon: InfoIcon },
];

interface SideRailProps {
  active: ScreenId;
}

export function SideRail({ active }: SideRailProps) {
  return (
    <nav
      aria-label="Primary"
      className="flex w-14 shrink-0 flex-col items-center justify-between border-r border-line bg-surface py-3"
    >
      <div className="flex flex-col items-center gap-1">
        {PRIMARY_ITEMS.map((item) => (
          <RailButton key={item.id} item={item} active={active === item.id} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        {SECONDARY_ITEMS.map((item) => (
          <RailButton key={item.id} item={item} active={active === item.id} />
        ))}
      </div>
    </nav>
  );
}

function RailButton({ item, active }: { item: RailItem; active: boolean }) {
  const { Icon, label } = item;
  const state = active
    ? "text-accent bg-accent-soft"
    : "text-muted hover:text-fg hover:bg-raised";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ${state}`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute -left-3 top-2 bottom-2 w-0.5 rounded-r bg-accent"
        />
      )}
      <Icon size={18} />
    </button>
  );
}
