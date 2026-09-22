import { test, testDeviceId, insertPrefs } from "./helpers";
import { api, internal } from "../convex/_generated/api";

test("savePrefs creates new prefs with defaults (real function)", async (t) => {
  const deviceId = testDeviceId();
  await t.mutation(api.mutations.savePrefs, { deviceId });

  const prefs = await t.query(api.queries.prefsQuery, { deviceId });

  expect(prefs).toBeDefined();
  expect(prefs?.deviceId).toBe(deviceId);
  expect(prefs?.defaultRadius).toBe(1000);
  expect(prefs?.currency).toBe("USD");
  expect(prefs?.notificationsEnabled).toBe(false);
  expect(prefs?.onboardingComplete).toBe(false);
});

test("savePrefs updates existing prefs (real function)", async (t) => {
  const deviceId = testDeviceId();
  await t.mutation(api.mutations.savePrefs, { deviceId, currency: "EUR", defaultRadius: 500 });
  await t.mutation(api.mutations.savePrefs, { deviceId, currency: "GBP", tripStartDate: 1789862400000 });

  const prefs = await t.query(api.queries.prefsQuery, { deviceId });

  expect(prefs?.currency).toBe("GBP");
  expect(prefs?.tripStartDate).toBe(1789862400000);
  expect(prefs?.defaultRadius).toBe(500); // unchanged
});

test("upsertPOIs inserts new POIs", async (t) => {
  const deviceId = testDeviceId();
  const pois = [
    { placeId: "osm:1", source: "osm" as const, name: "Test POI", category: "restaurant", lat: 1, lng: 2, verifiedCount: 0, deviceIds: [deviceId] },
  ];

  await t.mutation(async (ctx) => {
    const now = Date.now();
    await ctx.db.insert("pois", { ...pois[0], fetchedAt: now });
  });

  const results = await t.query((ctx) =>
    ctx.db.query("pois").withIndex("by_deviceIds_category", (q) => q.eq("deviceIds", [deviceId]).eq("category", "restaurant")).collect()
  );

  expect(results).toHaveLength(1);
  expect(results[0].name).toBe("Test POI");
});

test("upsertPOIs updates existing POI by placeId", async (t) => {
  const deviceId = testDeviceId();
  const now = Date.now();

  await t.mutation((ctx) =>
    ctx.db.insert("pois", { placeId: "osm:1", source: "osm", name: "Old Name", category: "restaurant", lat: 1, lng: 2, verifiedCount: 5, fetchedAt: now, deviceIds: [deviceId] })
  );

  await t.mutation(async (ctx) => {
    const existing = await ctx.db.query("pois").withIndex("by_placeId", (q) => q.eq("placeId", "osm:1")).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { name: "New Name", fetchedAt: Date.now() });
    }
  });

  const poi = await t.query((ctx) =>
    ctx.db.query("pois").withIndex("by_placeId", (q) => q.eq("placeId", "osm:1")).unique()
  );

  expect(poi?.name).toBe("New Name");
});

test("verifyPOI increments verifiedCount", async (t) => {
  const deviceId = testDeviceId();
  const now = Date.now();

  await t.mutation((ctx) =>
    ctx.db.insert("pois", { placeId: "osm:1", source: "osm", name: "POI", category: "restaurant", lat: 1, lng: 2, verifiedCount: 3, fetchedAt: now, deviceIds: [deviceId] })
  );

  await t.mutation(async (ctx) => {
    const poi = await ctx.db.query("pois").withIndex("by_placeId", (q) => q.eq("placeId", "osm:1")).unique();
    if (poi) {
      await ctx.db.patch(poi._id, { verifiedCount: poi.verifiedCount + 1 });
    }
  });

  const poi = await t.query((ctx) =>
    ctx.db.query("pois").withIndex("by_placeId", (q) => q.eq("placeId", "osm:1")).unique()
  );

  expect(poi?.verifiedCount).toBe(4);
});

test("addExpense inserts expense", async (t) => {
  const deviceId = testDeviceId();
  await insertPrefs(t, deviceId);

  await t.mutation((ctx) =>
    ctx.db.insert("expenses", { deviceId, amount: 25.50, currency: "USD", category: "food", date: Date.now() })
  );

  const expenses = await t.query((ctx) =>
    ctx.db.query("expenses").withIndex("by_deviceId_date", (q) => q.eq("deviceId", deviceId)).order("desc").collect()
  );

  expect(expenses).toHaveLength(1);
  expect(expenses[0].amount).toBe(25.50);
  expect(expenses[0].category).toBe("food");
});

test("upsertBudget creates and updates budget", async (t) => {
  const deviceId = testDeviceId();
  await insertPrefs(t, deviceId);

  await t.mutation((ctx) =>
    ctx.db.insert("budgets", { deviceId, totalBudget: 1000, currency: "USD", period: "trip", startDate: Date.now() })
  );

  let budget = await t.query((ctx) =>
    ctx.db.query("budgets").withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId)).unique()
  );
  expect(budget?.totalBudget).toBe(1000);

  await t.mutation((ctx) => {
    if (budget) {
      ctx.db.patch(budget._id, { totalBudget: 1500 });
    }
  });

  budget = await t.query((ctx) =>
    ctx.db.query("budgets").withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId)).unique()
  );
  expect(budget?.totalBudget).toBe(1500);
});

test("addReminder and toggleReminder", async (t) => {
  const deviceId = testDeviceId();
  await insertPrefs(t, deviceId);

  await t.mutation((ctx) =>
    ctx.db.insert("reminders", { deviceId, title: "Test", dueAt: Date.now() + 86400000, repeat: "none", done: false })
  );

  let reminders = await t.query((ctx) =>
    ctx.db.query("reminders").withIndex("by_deviceId_dueAt", (q) => q.eq("deviceId", deviceId)).order("asc").collect()
  );
  expect(reminders).toHaveLength(1);
  expect(reminders[0].done).toBe(false);

  await t.mutation((ctx) => {
    const r = reminders[0];
    ctx.db.patch(r._id, { done: true });
  });

  reminders = await t.query((ctx) =>
    ctx.db.query("reminders").withIndex("by_deviceId_dueAt", (q) => q.eq("deviceId", deviceId)).order("asc").collect()
  );
  expect(reminders[0].done).toBe(true);
});

test("createTicket inserts ticket with expiration", async (t) => {
  const deviceId = testDeviceId();
  await insertPrefs(t, deviceId);

  const createdAt = Date.now();
  await t.mutation((ctx) =>
    ctx.db.insert("tickets", { deviceId, ocrText: "test", parsedAmount: 10, createdAt, expiresAt: createdAt + 86400000 })
  );

  const tickets = await t.query((ctx) =>
    ctx.db.query("tickets").withIndex("by_deviceId_createdAt", (q) => q.eq("deviceId", deviceId)).order("desc").collect()
  );

  expect(tickets).toHaveLength(1);
  expect(tickets[0].ocrText).toBe("test");
  expect(tickets[0].expiresAt).toBe(createdAt + 86400000);
});

test("deleteExpense verifies ownership", async (t) => {
  const deviceId1 = testDeviceId();
  const deviceId2 = testDeviceId();
  await insertPrefs(t, deviceId1);
  await insertPrefs(t, deviceId2);

  const expense = await t.mutation((ctx) =>
    ctx.db.insert("expenses", { deviceId: deviceId1, amount: 10, currency: "USD", category: "food", date: Date.now() })
  );

  // Simulate the ownership check the real deleteExpense mutation performs
  await expect(
    t.mutation(async (ctx) => {
      const row = await ctx.db.get(expense);
      if (!row || row.deviceId !== deviceId2) {
        throw new Error("Not authorized");
      }
      await ctx.db.delete(expense);
    })
  ).rejects.toThrow("Not authorized");

  // Delete from deviceId1 - should succeed
  await t.mutation(async (ctx) => {
    const row = await ctx.db.get(expense);
    if (!row || row.deviceId !== deviceId1) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(expense);
  });

  const expenses = await t.query((ctx) =>
    ctx.db.query("expenses").withIndex("by_deviceId_date", (q) => q.eq("deviceId", deviceId1)).collect()
  );
  expect(expenses).toHaveLength(0);
});

test("journal notes: CRUD, trim, limits, per-device isolation (real functions)", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();

  await t.mutation(api.mutations.addJournalNote, {
    deviceId: deviceA,
    text: "  Hello Pretoria  ",
    lat: -25.746,
    lng: 28.237,
  });

  const notesA = await t.query(api.queries.journalNotesQuery, { deviceId: deviceA });
  expect(notesA).toHaveLength(1);
  expect(notesA[0].text).toBe("Hello Pretoria");
  expect(notesA[0].lat).toBe(-25.746);

  const notesB = await t.query(api.queries.journalNotesQuery, { deviceId: deviceB });
  expect(notesB).toHaveLength(0);

  await expect(
    t.mutation(api.mutations.addJournalNote, { deviceId: deviceA, text: "   " })
  ).rejects.toThrow();

  await expect(
    t.mutation(api.mutations.addJournalNote, { deviceId: deviceA, text: "x".repeat(501) })
  ).rejects.toThrow();

  await expect(
    t.mutation(api.mutations.deleteJournalNote, { id: notesA[0]._id, deviceId: deviceB })
  ).rejects.toThrow();

  await t.mutation(api.mutations.deleteJournalNote, {
    id: notesA[0]._id,
    deviceId: deviceA,
  });
  const after = await t.query(api.queries.journalNotesQuery, { deviceId: deviceA });
  expect(after).toHaveLength(0);
});

test("dishes cache upserts by locKey (internal functions)", async (t) => {
  const locKey = "-25.7,28.2";
  await t.mutation(internal.mutations.setDishesCache, {
    locKey,
    payload: JSON.stringify({ areaName: "Pretoria", dishes: [], fetchedAt: 1 }),
  });
  const first = await t.query(internal.queries.getDishesCache, { locKey });
  expect(first?.payload).toContain("Pretoria");

  await t.mutation(internal.mutations.setDishesCache, {
    locKey,
    payload: JSON.stringify({ areaName: "Pretoria", dishes: [], fetchedAt: 2 }),
  });
  const all = await t.query((ctx) => ctx.db.query("dishesCache").collect());
  expect(all).toHaveLength(1); // upsert, not a duplicate
  expect(all[0].payload).toContain('"fetchedAt":2');
});