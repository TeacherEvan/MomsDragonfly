import { v } from "convex/values";

export const DEVICE_ID_VALIDATOR = v.string();

export function validateDeviceId(deviceId: string): void {
  if (!deviceId || deviceId === "ssr" || deviceId === "unknown") {
    throw new Error("Invalid deviceId");
  }
}