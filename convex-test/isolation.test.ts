import { test } from "./helpers";

test("journal points are isolated per device (no cross-user mixing)", async (t) => {
  const deviceA = "test-device-a";
  const deviceB = "test-device-b";
  const base = Date.now();

  await t.mutation(async (ctx) => {
    await ctx.db.insert("locationHistory", {
      deviceId: deviceA,
      lat: -25.746,
      lng: 28.237,
      accuracy: 10,
      timestamp: base,
    });
    await ctx.db.insert("locationHistory", {
      deviceId: deviceA,
      lat: -25.748,
      lng: 28.24,
      accuracy: 12,
      timestamp: base + 1000,
    });
    await ctx.db.insert("locationHistory", {
      deviceId: deviceB,
      lat: 13.756,
      lng: 100.5,
      accuracy: 8,
      timestamp: base + 500,
    });
  });

  const rowsA = await t.query(async (ctx) =>
    ctx.db
      .query("locationHistory")
      .withIndex("by_deviceId_timestamp", (q) => q.eq("deviceId", deviceA))
      .order("desc")
      .take(100)
  );
  const rowsB = await t.query(async (ctx) =>
    ctx.db
      .query("locationHistory")
      .withIndex("by_deviceId_timestamp", (q) => q.eq("deviceId", deviceB))
      .order("desc")
      .take(100)
  );

  expect(rowsA.length).toBe(2);
  expect(rowsB.length).toBe(1);
  expect(rowsA.every((r) => r.deviceId === deviceA)).toBe(true);
  expect(rowsB.every((r) => r.deviceId === deviceB)).toBe(true);
  expect(rowsB[0].lat).toBe(13.756);
});

test("highlights cache is shared per location cell, keyed by rounded coords", async (t) => {
  const locKey = "-25.75,28.24";
  await t.mutation(async (ctx) => {
    await ctx.db.insert("highlightsCache", {
      locKey,
      payload: JSON.stringify({ ok: true }),
      fetchedAt: Date.now(),
    });
  });

  const hit = await t.query(async (ctx) =>
    ctx.db
      .query("highlightsCache")
      .withIndex("by_locKey", (q) => q.eq("locKey", locKey))
      .unique()
  );

  expect(hit).not.toBeNull();
  expect(JSON.parse(hit!.payload).ok).toBe(true);
});
