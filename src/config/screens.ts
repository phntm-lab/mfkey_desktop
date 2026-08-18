import { Key, Cpu, Zap, Settings, Info, type LucideIcon } from "lucide-react";

export type ScreenId = "attack" | "device" | "auto" | "settings" | "about";

export type ScreenGroup = "primary" | "secondary";

export interface ScreenMeta {
  id: ScreenId;
  group: ScreenGroup;
  Icon: LucideIcon;
}

export const SCREENS: ScreenMeta[] = [
  { id: "attack", group: "primary", Icon: Key },
  { id: "device", group: "primary", Icon: Cpu },
  { id: "auto", group: "primary", Icon: Zap },
  { id: "settings", group: "secondary", Icon: Settings },
  { id: "about", group: "secondary", Icon: Info },
];
