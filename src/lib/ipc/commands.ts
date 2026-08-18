import { invoke } from "@tauri-apps/api/core";
import type {
  FlipperDevice,
  TransportKind,
} from "../../store/useConnectionStore";

export interface CommandError {
  code: string;
  message: string;
}

export interface FileAttackRequest {
  path: string;
}

export interface AutoRequest {
  transport: TransportKind;
  deviceId: string;
  deleteLogsAfter: boolean;
}

export interface ConnectRequest {
  transport: TransportKind;
  deviceId: string;
}

export interface SaveKeysRequest {
  keys: string[];
  dictPaths: string[];
}

export const COMMANDS = {
  startFileAttack: "start_file_attack",
  cancelAttack: "cancel_attack",
  pickInputFile: "pick_input_file",
  saveRecoveredKeys: "save_recovered_keys",
  listFlipperUsb: "list_flipper_usb",
  scanBle: "scan_ble",
  connectFlipper: "connect_flipper",
  startAuto: "start_auto",
  cancelAuto: "cancel_auto",
} as const;

export function startFileAttack(request: FileAttackRequest): Promise<void> {
  return invoke(COMMANDS.startFileAttack, { request });
}

export function cancelAttack(): Promise<void> {
  return invoke(COMMANDS.cancelAttack);
}

export function pickInputFile(): Promise<string | null> {
  return invoke(COMMANDS.pickInputFile);
}

export function saveRecoveredKeys(
  request: SaveKeysRequest,
): Promise<string | null> {
  return invoke(COMMANDS.saveRecoveredKeys, { request });
}

export function listFlipperUsb(): Promise<FlipperDevice[]> {
  return invoke(COMMANDS.listFlipperUsb);
}

export function scanBle(): Promise<FlipperDevice[]> {
  return invoke(COMMANDS.scanBle);
}

export function connectFlipper(request: ConnectRequest): Promise<void> {
  return invoke(COMMANDS.connectFlipper, { request });
}

export function startAuto(request: AutoRequest): Promise<void> {
  return invoke(COMMANDS.startAuto, { request });
}

export function cancelAuto(): Promise<void> {
  return invoke(COMMANDS.cancelAuto);
}
