import { defineConvexTest } from "convex-test";
import schema from "./schema";
import { ConvexError } from "convex/values";

export const test = defineConvexTest(schema);

// Helper to create a test deviceId
export function testDeviceId(): string {
  return `test-device-${Math.random().toString(36).slice(2)}`;
}

// Helper to insert a userPrefs doc
export async function insertPrefs(t: typeof test, deviceId: string, overrides = {}) {
  return t.mutation((ctx) => {
    return ctx.db.insert("userPrefs", {
      deviceId,
      elderlyMode: false,
      defaultRadius: 1000,
      currency: "USD",
      notificationsEnabled: false,
      onboardingComplete: false,
      ...overrides,
    });
  });
}

// Helper to insert POIs
export async function insertPois(t: typeof test, deviceId: string, pois: Array<{
  placeId: string;
  source: "google" | "osm" | "brave";
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  phone?: string;
  openNow?: boolean;
  verifiedCount?: number;
}>) {
  return t.mutation((ctx) => {
    const now = Date.now();
    return Promise.all(pois.map((p) =>
      ctx.db.insert("pois", {
        ...p,
        deviceId,
        verifiedCount: p.verifiedCount ?? 0,
        fetchedAt: now,
      })
    ));
  });
}