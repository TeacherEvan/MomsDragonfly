import { test, testDeviceId } from "./helpers";
import { api } from "../convex/_generated/api";

test("journal points are isolated per device (real functions)", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();

  await t.mutation(api.mutations.saveLocation, { deviceId: deviceA, lat: -25.746, lng: 28.237, accuracy: 10 });
  await t.mutation(api.mutations.saveLocation, { deviceId: deviceA, lat: -25.748, lng: 28.24, accuracy: 12 });
  await t.mutation(api.mutations.saveLocation, { deviceId: deviceB, lat: 13.756, lng: 100.5, accuracy: 8 });

  const rowsA = await t.query(api.queries.historyQuery, { deviceId: deviceA, limit: 100 });
  const rowsB = await t.query(api.queries.historyQuery, { deviceId: deviceB, limit: 100 });

  expect(rowsA.length).toBe(2);
  expect(rowsB.length).toBe(1);
  expect(rowsA.every((r) => r.deviceId === deviceA)).toBe(true);
  expect(rowsB.every((r) => r.deviceId === deviceB)).toBe(true);
  expect(rowsB[0].lat).toBe(13.756);
});

test("highlights cache is shared per location cell, not per device", async (t) => {
  const locKey = "-25.75,28.24";
  await t.mutation((ctx) =>
    ctx.db.insert("highlightsCache", {
      locKey,
      payload: JSON.stringify({ locationName: "Test Cell", weather: { tempC: 21 } }),
      fetchedAt: Date.now(),
    })
  );

  const hit = await t.query((ctx) =>
    ctx.db.query("highlightsCache").withIndex("by_locKey", (q) => q.eq("locKey", locKey)).unique()
  );

  expect(hit).not.toBeNull();
  expect(JSON.parse(hit!.payload).locationName).toBe("Test Cell");
});
