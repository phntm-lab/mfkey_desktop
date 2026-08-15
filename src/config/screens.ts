import { Key, Cpu, Settings, Info, type LucideIcon } from "lucide-react";

export type ScreenId = "attack" | "device" | "settings" | "about";

export type ScreenGroup = "primary" | "secondary";

export interface ScreenMeta {
  id: ScreenId;
  group: ScreenGroup;
  Icon: LucideIcon;
}

export const SCREENS: ScreenMeta[] = [
  { id: "attack", group: "primary", Icon: Key },
  { id: "device", group: "primary", Icon: Cpu },
  { id: "settings", group: "secondary", Icon: Settings },
  { id: "about", group: "secondary", Icon: Info },
];
