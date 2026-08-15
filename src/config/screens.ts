import { Key, Cpu, Settings, Info, type LucideIcon } from "lucide-react";

export type ScreenId = "attack" | "device" | "settings" | "about";

export type ScreenGroup = "primary" | "secondary";

export interface ScreenMeta {
  id: ScreenId;
  label: string;
  title: string;
  group: ScreenGroup;
  Icon: LucideIcon;
}

export const SCREENS: ScreenMeta[] = [
  { id: "attack", label: "Attack", title: "Attack", group: "primary", Icon: Key },
  { id: "device", label: "Device", title: "Device", group: "primary", Icon: Cpu },
  { id: "settings", label: "Settings", title: "Settings", group: "secondary", Icon: Settings },
  { id: "about", label: "About", title: "About", group: "secondary", Icon: Info },
];

export const SCREEN_MAP: Record<ScreenId, ScreenMeta> = Object.fromEntries(
  SCREENS.map((screen) => [screen.id, screen]),
) as Record<ScreenId, ScreenMeta>;
