import { v } from "convex/values";

export const DEVICE_ID_VALIDATOR = v.string();

export function validateDeviceId(deviceId: string): void {
  if (
    !deviceId ||
    typeof deviceId !== "string" ||
    deviceId === "ssr" ||
    deviceId === "unknown" ||
    deviceId.length > 64
  ) {
    throw new Error("Invalid deviceId");
  }
}