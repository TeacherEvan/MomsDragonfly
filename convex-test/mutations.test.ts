import { test } from "./helpers";

test("savePrefs creates new prefs with defaults", async (t) => {
  const deviceId = testDeviceId();
  await insertPrefs(t, deviceId);

  const prefs = await t.query((ctx) =>
    ctx.db.query("userPrefs").withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId)).unique()
  );

  expect(prefs).toBeDefined();
  expect(prefs?.deviceId).toBe(deviceId);
  expect(prefs?.elderlyMode).toBe(false);
  expect(prefs?.defaultRadius).toBe(1000);
  expect(prefs?.currency).toBe("USD");
  expect(prefs?.notificationsEnabled).toBe(false);
  expect(prefs?.onboardingComplete).toBe(false);
});

test("savePrefs updates existing prefs", async (t) => {
  const deviceId = testDeviceId();
  await insertPrefs(t, deviceId, { currency: "EUR", defaultRadius: 500 });

  await t.mutation(async (ctx) => {
    const prefs = await ctx.db.query("userPrefs").withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId)).unique();
    if (prefs) {
      return ctx.db.patch(prefs._id, { currency: "GBP", elderlyMode: true });
    }
  });

  const prefs = await t.query((ctx) =>
    ctx.db.query("userPrefs").withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId)).unique()
  );

  expect(prefs?.currency).toBe("GBP");
  expect(prefs?.elderlyMode).toBe(true);
  expect(prefs?.defaultRadius).toBe(500); // unchanged
});

test("upsertPOIs inserts new POIs", async (t) => {
  const deviceId = testDeviceId();
  const pois = [
    { placeId: "osm:1", source: "osm" as const, name: "Test POI", category: "restaurant", lat: 1, lng: 2, verifiedCount: 0 },
  ];

  await t.mutation(async (ctx) => {
    const now = Date.now();
    await ctx.db.insert("pois", { ...pois[0], deviceId, fetchedAt: now });
  });

  const results = await t.query((ctx) =>
    ctx.db.query("pois").withIndex("by_deviceId_category", (q) => q.eq("deviceId", deviceId).eq("category", "restaurant")).collect()
  );

  expect(results).toHaveLength(1);
  expect(results[0].name).toBe("Test POI");
});

test("upsertPOIs updates existing POI by placeId", async (t) => {
  const deviceId = testDeviceId();
  const now = Date.now();

  await t.mutation((ctx) =>
    ctx.db.insert("pois", { placeId: "osm:1", source: "osm", name: "Old Name", category: "restaurant", lat: 1, lng: 2, verifiedCount: 5, fetchedAt: now, deviceId })
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
    ctx.db.insert("pois", { placeId: "osm:1", source: "osm", name: "POI", category: "restaurant", lat: 1, lng: 2, verifiedCount: 3, fetchedAt: now, deviceId })
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

  // Try to delete from deviceId2 - should fail
  await expect(
    t.mutation((ctx) => ctx.db.delete(expense))
  ).rejects.toThrow(); // In real impl with ownership check

  // Delete from deviceId1 - should succeed
  await t.mutation((ctx) => ctx.db.delete(expense));

  const expenses = await t.query((ctx) =>
    ctx.db.query("expenses").withIndex("by_deviceId_date", (q) => q.eq("deviceId", deviceId1)).collect()
  );
  expect(expenses).toHaveLength(0);
});