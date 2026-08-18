import { create } from "zustand";
import type { AppError } from "../lib/errors";

export type TransportKind = "usb" | "ble";

export type ConnectionStatus =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "error";

export interface FlipperDevice {
  id: string;
  name: string;
  transport: TransportKind;
}

export const DEFAULT_TRANSPORT: TransportKind = "usb";

interface ConnectionState {
  status: ConnectionStatus;
  transport: TransportKind;
  device: FlipperDevice | null;
  availableDevices: FlipperDevice[];
  error: AppError | null;
  setStatus: (status: ConnectionStatus) => void;
  setTransport: (transport: TransportKind) => void;
  setDevice: (device: FlipperDevice | null) => void;
  setAvailableDevices: (devices: FlipperDevice[]) => void;
  setError: (error: AppError | null) => void;
  reset: () => void;
}

const initialState = {
  status: "disconnected" as ConnectionStatus,
  transport: DEFAULT_TRANSPORT,
  device: null,
  availableDevices: [] as FlipperDevice[],
  error: null,
};

export const useConnectionStore = create<ConnectionState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setTransport: (transport) => set({ transport }),
  setDevice: (device) => set({ device }),
  setAvailableDevices: (availableDevices) => set({ availableDevices }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
