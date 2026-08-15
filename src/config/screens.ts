import type { ComponentType } from "react";
import { KeyIcon, ChipIcon, GearIcon, InfoIcon, type IconProps } from "../components/layout/icons";

export type ScreenId = "attack" | "device" | "settings" | "about";

export type ScreenGroup = "primary" | "secondary";

export interface ScreenMeta {
  id: ScreenId;
  label: string;
  title: string;
  group: ScreenGroup;
  Icon: ComponentType<IconProps>;
}

export const SCREENS: ScreenMeta[] = [
  { id: "attack", label: "Attack", title: "Attack", group: "primary", Icon: KeyIcon },
  { id: "device", label: "Device", title: "Device", group: "primary", Icon: ChipIcon },
  { id: "settings", label: "Settings", title: "Settings", group: "secondary", Icon: GearIcon },
  { id: "about", label: "About", title: "About", group: "secondary", Icon: InfoIcon },
];

export const SCREEN_MAP: Record<ScreenId, ScreenMeta> = Object.fromEntries(
  SCREENS.map((screen) => [screen.id, screen]),
) as Record<ScreenId, ScreenMeta>;
