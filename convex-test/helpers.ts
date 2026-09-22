import { convexTest, type TestConvex } from "convex-test";
import schema from "../convex/schema";
import { test as vitestTest } from "vitest";

// Vitest/Vite resolves this glob at transform time. Passing the module map
// explicitly avoids convex-test's fallback (`import.meta.glob` is not
// available inside externalized node_modules dependencies).
const modules = import.meta.glob("../convex/**/*.*s");

export type Test = TestConvex<typeof schema>;

/**
 * Test wrapper that gives each test a fresh convex-test instance:
 *
 *   test("name", async (t) => { await t.mutation(...) })
 *
 * Tests import the REAL schema from ../convex/schema — never fork a copy.
 * A stale copy silently hides schema drift (removed/renamed fields), which
 * is exactly how a broken `savePrefs` insert slipped past this harness once.
 */
export function test(name: string, fn: (t: Test) => Promise<void>): void {
  vitestTest(name, async () => {
    await fn(convexTest(schema, modules));
  });
}

// Helper to create a test deviceId
export function testDeviceId(): string {
  return `test-device-${Math.random().toString(36).slice(2)}`;
}

// Helper to insert a userPrefs doc
export async function insertPrefs(t: Test, deviceId: string, overrides = {}) {
  return t.mutation((ctx) => {
    return ctx.db.insert("userPrefs", {
      deviceId,
      defaultRadius: 1000,
      currency: "USD",
      notificationsEnabled: false,
      onboardingComplete: false,
      ...overrides,
    });
  });
}

// Helper to insert POIs
export async function insertPois(t: Test, deviceId: string, pois: Array<{
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
        deviceIds: [deviceId],
        verifiedCount: p.verifiedCount ?? 0,
        fetchedAt: now,
      })
    ));
  });
}