import type { ComponentType } from "react";
import type { ScreenId } from "../config/screens";
import { AttackScreen } from "./AttackScreen";
import { DeviceScreen } from "./DeviceScreen";
import { SettingsScreen } from "./SettingsScreen";
import { AboutScreen } from "./AboutScreen";

export const SCREEN_COMPONENTS: Record<ScreenId, ComponentType> = {
  attack: AttackScreen,
  device: DeviceScreen,
  settings: SettingsScreen,
  about: AboutScreen,
};
