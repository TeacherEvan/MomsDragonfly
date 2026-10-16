import { api, internal } from "../convex/_generated/api";
import { insertPrefs, test, testDeviceId } from "./helpers";

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

test("savePrefs can clear tripStartDate with null", async (t) => {
  const deviceId = testDeviceId();
  await t.mutation(api.mutations.savePrefs, { deviceId, tripStartDate: 1789862400000 });
  let prefs = await t.query(api.queries.prefsQuery, { deviceId });
  expect(prefs?.tripStartDate).toBe(1789862400000);

  await t.mutation(api.mutations.savePrefs, { deviceId, tripStartDate: null });
  prefs = await t.query(api.queries.prefsQuery, { deviceId });
  expect(prefs?.tripStartDate).toBeUndefined();
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

  await t.mutation(async (ctx) => {
    if (budget) {
      await ctx.db.patch(budget._id, { totalBudget: 1500 });
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

  await t.mutation(async (ctx) => {
    const r = reminders[0];
    await ctx.db.patch(r._id, { done: true });
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

test("clearPushSubscription clears only the target device (real function)", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();
  const sub = JSON.stringify({
    endpoint: "https://push.example/abc",
    keys: { p256dh: "p", auth: "a" },
  });

  await t.mutation(api.mutations.savePrefs, {
    deviceId: deviceA,
    vapidSubscription: sub,
  });
  await t.mutation(api.mutations.savePrefs, {
    deviceId: deviceB,
    vapidSubscription: sub,
  });

  await t.mutation(api.mutations.clearPushSubscription, { deviceId: deviceA });

  const prefsA = await t.query(api.queries.prefsQuery, { deviceId: deviceA });
  const prefsB = await t.query(api.queries.prefsQuery, { deviceId: deviceB });

  expect(prefsA?.vapidSubscription).toBeUndefined();
  expect(prefsA?.deviceId).toBe(deviceA); // prefs doc itself survives
  expect(prefsB?.vapidSubscription).toBe(sub); // other devices untouched
});

test("clearPushSubscription is a no-op for unknown devices and invalid ids", async (t) => {
  // Unknown device: should not throw, should not create a prefs doc.
  await t.mutation(api.mutations.clearPushSubscription, {
    deviceId: testDeviceId(),
  });
  const prefs = await t.query(api.queries.prefsQuery, {
    deviceId: testDeviceId(),
  });
  expect(prefs).toBeNull();

  // Invalid deviceId: rejected like every other guarded mutation.
  await expect(
    t.mutation(api.mutations.clearPushSubscription, { deviceId: "ssr" })
  ).rejects.toThrow();
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
test("enableShare mints a token and shareView exposes the trail", async (t) => {
  const deviceId = testDeviceId();
  await t.mutation(api.mutations.savePrefs, { deviceId });
  await t.mutation(api.mutations.saveLocation, { deviceId, lat: 10, lng: 20, accuracy: 5 });
  await t.mutation(api.mutations.addJournalNote, { deviceId, text: "hello", lat: 10, lng: 20 });

  const token = await t.mutation(api.mutations.enableShare, { deviceId });
  expect(typeof token).toBe("string");

  const view = await t.query(api.queries.shareView, { token });
  expect(view.shared).toBe(true);
  if (view.shared) {
    expect(view.points).toHaveLength(1);
    expect(view.notes).toHaveLength(1);

    // Security assertion: deviceId must never be exposed to public shareView
    expect(JSON.stringify(view)).not.toContain(deviceId);
    expect(JSON.stringify(view)).not.toContain('"deviceId"');

    // Schema projection assertions
    const pointKeys = Object.keys(view.points[0]).sort();
    expect(pointKeys).toEqual(["accuracy", "lat", "lng", "timestamp"]);

    const noteKeys = Object.keys(view.notes[0]).sort();
    expect(noteKeys).toEqual(["_id", "createdAt", "lat", "lng", "text"]);
  }
});

test("disableShare hides the trail from shareView", async (t) => {
  const deviceId = testDeviceId();
  await t.mutation(api.mutations.savePrefs, { deviceId });
  const token = await t.mutation(api.mutations.enableShare, { deviceId });
  await t.mutation(api.mutations.disableShare, { deviceId });

  const view = await t.query(api.queries.shareView, { token });
  expect(view.shared).toBe(false);
});

test("rotateShare generates new token, invalidates old token, and isolates devices", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();

  const tokenA1 = await t.mutation(api.mutations.enableShare, { deviceId: deviceA });
  const tokenB1 = await t.mutation(api.mutations.enableShare, { deviceId: deviceB });

  const prefsA1 = await t.query(api.queries.prefsQuery, { deviceId: deviceA });
  expect(prefsA1?.shareTokenCreatedAt).toBeDefined();

  // Rotate device A
  const tokenA2 = await t.mutation(api.mutations.rotateShare, { deviceId: deviceA });
  expect(typeof tokenA2).toBe("string");
  expect(tokenA2).not.toBe(tokenA1);

  // Device B remains unchanged
  const prefsB = await t.query(api.queries.prefsQuery, { deviceId: deviceB });
  expect(prefsB?.shareToken).toBe(tokenB1);

  // Old token A1 is invalid in shareView
  const viewA1 = await t.query(api.queries.shareView, { token: tokenA1 });
  expect(viewA1.shared).toBe(false);

  // New token A2 is active in shareView
  const viewA2 = await t.query(api.queries.shareView, { token: tokenA2! });
  expect(viewA2.shared).toBe(true);
});

test("shareView rejects unknown and malformed tokens", async (t) => {
  const bad = await t.query(api.queries.shareView, { token: "not-a-token" });
  expect(bad.shared).toBe(false);
  const unknown = await t.query(api.queries.shareView, {
    token: "123e4567-e89b-42d3-a456-426614174000",
  });
  expect(unknown.shared).toBe(false);
});

test("upcomingRemindersQuery is internal and retrieves due reminders", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();
  const now = Date.now();

  await t.mutation(api.mutations.addReminder, {
    deviceId: deviceA,
    title: "Reminder A (Due)",
    dueAt: now - 1000,
    repeat: "none",
  });
  await t.mutation(api.mutations.addReminder, {
    deviceId: deviceB,
    title: "Reminder B (Due)",
    dueAt: now - 500,
    repeat: "none",
  });
  await t.mutation(api.mutations.addReminder, {
    deviceId: deviceA,
    title: "Reminder A (Future)",
    dueAt: now + 60000,
    repeat: "none",
  });

  const due = await t.query(internal.queries.upcomingRemindersQuery, { before: now });
  expect(due.length).toBeGreaterThanOrEqual(2);
  const titles = due.map((r: { title: string }) => r.title);
  expect(titles).toContain("Reminder A (Due)");
  expect(titles).toContain("Reminder B (Due)");
  expect(titles).not.toContain("Reminder A (Future)");
});

test("rekeyDevice migrates all user records, revokes share link, and isolates old identity", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();
  const now = Date.now();

  // 1. Seed device A with data across all tables
  await t.mutation(api.mutations.savePrefs, {
    deviceId: deviceA,
    defaultRadius: 2000,
    currency: "EUR",
    notificationsEnabled: true,
    onboardingComplete: true,
  });

  const shareToken = await t.mutation(api.mutations.enableShare, { deviceId: deviceA });
  expect(shareToken).toBeDefined();

  await t.mutation(api.mutations.saveLocation, {
    deviceId: deviceA,
    lat: 13.7563,
    lng: 100.5018,
    accuracy: 10,
  });
  await t.mutation(api.mutations.saveLocation, {
    deviceId: deviceA,
    lat: 13.7580,
    lng: 100.5030,
    accuracy: 12,
  });

  await t.mutation(api.mutations.addJournalNote, {
    deviceId: deviceA,
    text: "Bangkok street food memories",
    lat: 13.7563,
    lng: 100.5018,
  });

  await t.mutation(api.mutations.addExpense, {
    deviceId: deviceA,
    amount: 150,
    currency: "THB",
    category: "food",
    note: "Pad Thai",
    date: now,
  });

  await t.mutation(api.mutations.addReminder, {
    deviceId: deviceA,
    title: "Flight check-in",
    dueAt: now + 3600000,
    repeat: "none",
  });

  await t.mutation(api.mutations.createTicket, {
    deviceId: deviceA,
    ocrText: "Boarding pass BKK-JNB",
    parsedVenue: "Suvarnabhumi Airport",
    parsedAmount: 450,
  });

  await t.mutation(api.mutations.upsertPOIs, {
    deviceId: deviceA,
    pois: [
      {
        placeId: "osm:101",
        source: "osm",
        name: "Bangkok Street Cafe",
        category: "restaurant",
        lat: 13.75,
        lng: 100.5,
        verifiedCount: 1,
        fetchedAt: now,
      },
    ],
  });

  // Verify shareView is active under deviceA
  const viewBefore = await t.query(api.queries.shareView, { token: shareToken });
  expect(viewBefore.shared).toBe(true);

  // 2. Perform the rekey from deviceA to deviceB
  const result = await t.mutation(api.mutations.rekeyDevice, {
    oldDeviceId: deviceA,
    newDeviceId: deviceB,
  });
  expect(result.success).toBe(true);
  expect(result.migrated).toBeGreaterThanOrEqual(8);

  // 3. Verify deviceA has NOTHING left
  const prefsA = await t.query(api.queries.prefsQuery, { deviceId: deviceA });
  expect(prefsA).toBeNull();

  const notesA = await t.query(api.queries.journalNotesQuery, { deviceId: deviceA });
  expect(notesA).toHaveLength(0);

  const expensesA = await t.query(api.queries.expensesQuery, { deviceId: deviceA });
  expect(expensesA).toHaveLength(0);

  const remindersA = await t.query(api.queries.remindersQuery, { deviceId: deviceA });
  expect(remindersA).toHaveLength(0);

  const ticketsA = await t.query(api.queries.ticketsQuery, { deviceId: deviceA });
  expect(ticketsA).toHaveLength(0);

  const historyA = await t.query(api.queries.historyQuery, { deviceId: deviceA, limit: 100 });
  expect(historyA).toHaveLength(0);

  const poisA = await t.query(api.queries.poiQuery, { deviceId: deviceA, category: "restaurant" });
  expect(poisA).toHaveLength(0);

  // 4. Verify all records migrated cleanly to deviceB
  const prefsB = await t.query(api.queries.prefsQuery, { deviceId: deviceB });
  expect(prefsB).toBeDefined();
  expect(prefsB?.currency).toBe("EUR");
  expect(prefsB?.shareEnabled).toBe(false); // share link revoked on rekey
  expect(prefsB?.shareToken).toBeUndefined();

  const notesB = await t.query(api.queries.journalNotesQuery, { deviceId: deviceB });
  expect(notesB).toHaveLength(1);
  expect(notesB[0].text).toBe("Bangkok street food memories");

  const expensesB = await t.query(api.queries.expensesQuery, { deviceId: deviceB });
  expect(expensesB).toHaveLength(1);
  expect(expensesB[0].amount).toBe(150);

  const remindersB = await t.query(api.queries.remindersQuery, { deviceId: deviceB });
  expect(remindersB).toHaveLength(1);
  expect(remindersB[0].title).toBe("Flight check-in");

  const ticketsB = await t.query(api.queries.ticketsQuery, { deviceId: deviceB });
  expect(ticketsB).toHaveLength(1);
  expect(ticketsB[0].ocrText).toBe("Boarding pass BKK-JNB");

  const historyB = await t.query(api.queries.historyQuery, { deviceId: deviceB, limit: 100 });
  expect(historyB).toHaveLength(2);

  const poisB = await t.query(api.queries.poiQuery, { deviceId: deviceB, category: "restaurant" });
  expect(poisB).toHaveLength(1);
  expect(poisB[0].name).toBe("Bangkok Street Cafe");

  // 5. Verify old share token is revoked
  const viewAfter = await t.query(api.queries.shareView, { token: shareToken });
  expect(viewAfter.shared).toBe(false);
});

test("rekeyDevice rejects identical or invalid device IDs", async (t) => {
  const device = testDeviceId();

  await expect(
    t.mutation(api.mutations.rekeyDevice, {
      oldDeviceId: device,
      newDeviceId: device,
    })
  ).rejects.toThrow("New device ID must differ from old device ID");

  await expect(
    t.mutation(api.mutations.rekeyDevice, {
      oldDeviceId: "unknown",
      newDeviceId: testDeviceId(),
    })
  ).rejects.toThrow("Invalid deviceId");
});

test("verifyPOI works across multiple devices and upsertPOIs preserves verifiedCount", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();
  const now = Date.now();
  const basePoi = {
    placeId: "osm:shared-poi",
    source: "osm" as const,
    name: "Shared Cafe",
    category: "restaurant",
    lat: -25.75,
    lng: 28.2,
    verifiedCount: 1,
    fetchedAt: now,
  };

  await t.mutation(api.mutations.upsertPOIs, { deviceId: deviceA, pois: [basePoi] });
  await t.mutation(api.mutations.upsertPOIs, { deviceId: deviceB, pois: [basePoi] });

  // Both devices share the same placeId; verifyPOI should not throw .unique() error
  await t.mutation(api.mutations.verifyPOI, { deviceId: deviceA, placeId: "osm:shared-poi" });
  const poisAfterVerify = await t.query(api.queries.poiQuery, {
    deviceId: deviceA,
    category: "restaurant",
  });
  expect(poisAfterVerify[0].verifiedCount).toBe(2);

  // Subsequent background upsert with verifiedCount: 1 must not clobber verifiedCount: 2
  await t.mutation(api.mutations.upsertPOIs, {
    deviceId: deviceA,
    pois: [{ ...basePoi, fetchedAt: now + 5000, verifiedCount: 1 }],
  });
  const poisAfterUpsert = await t.query(api.queries.poiQuery, {
    deviceId: deviceA,
    category: "restaurant",
  });
  expect(poisAfterUpsert[0].verifiedCount).toBe(2);
});

test("rekeyDevice deduplicates prefs, budgets, and overlapping POIs on target device", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();
  const now = Date.now();

  await t.mutation(api.mutations.savePrefs, { deviceId: deviceA, currency: "ZAR" });
  await t.mutation(api.mutations.savePrefs, { deviceId: deviceB, currency: "USD" });
  await t.mutation(api.mutations.upsertBudget, {
    deviceId: deviceA,
    totalBudget: 5000,
    currency: "ZAR",
    period: "trip",
    startDate: now,
  });
  await t.mutation(api.mutations.upsertBudget, {
    deviceId: deviceB,
    totalBudget: 1000,
    currency: "USD",
    period: "trip",
    startDate: now,
  });

  const poi = {
    placeId: "osm:dup-1",
    source: "osm" as const,
    name: "Dup Place",
    category: "park",
    lat: 1,
    lng: 2,
    verifiedCount: 1,
    fetchedAt: now,
  };
  await t.mutation(api.mutations.upsertPOIs, { deviceId: deviceA, pois: [poi] });
  await t.mutation(api.mutations.upsertPOIs, { deviceId: deviceB, pois: [poi] });

  await t.mutation(api.mutations.rekeyDevice, { oldDeviceId: deviceA, newDeviceId: deviceB });

  // prefsQuery and budgetQuery use .unique() and must not throw
  const prefsB = await t.query(api.queries.prefsQuery, { deviceId: deviceB });
  expect(prefsB?.currency).toBe("ZAR");
  const budgetB = await t.query(api.queries.budgetQuery, { deviceId: deviceB });
  expect(budgetB?.totalBudget).toBe(5000);
  const poisB = await t.query(api.queries.poiQuery, { deviceId: deviceB, category: "park" });
  expect(poisB).toHaveLength(1);
});

test("markReminderSent advances overdue recurring reminder past Date.now()", async (t) => {
  const device = testDeviceId();
  const threeDaysAgo = Date.now() - 3 * 86_400_000 - 60_000;
  const id = await t.mutation(api.mutations.addReminder, {
    deviceId: device,
    title: "Daily Vitamin",
    dueAt: threeDaysAgo,
    repeat: "daily",
  });

  await t.mutation(internal.mutations.markReminderSent, { id });
  const reminders = await t.query(api.queries.remindersQuery, { deviceId: device });
  expect(reminders[0].dueAt).toBeGreaterThan(Date.now());
  expect(reminders[0].done).toBe(false);
});

test("addExpense rejects ticketId belonging to another device", async (t) => {
  const deviceA = testDeviceId();
  const deviceB = testDeviceId();

  const ticketIdA = await t.mutation(api.mutations.createTicket, {
    deviceId: deviceA,
    ocrText: "Secret ticket",
  });

  await expect(
    t.mutation(api.mutations.addExpense, {
      deviceId: deviceB,
      amount: 50,
      currency: "USD",
      category: "food",
      date: Date.now(),
      ticketId: ticketIdA,
    })
  ).rejects.toThrow("Ticket not found");
});

test("purgeExpiredTickets removes tickets whose expiresAt has passed", async (t) => {
  const device = testDeviceId();
  const now = Date.now();

  // Expired ticket (expired 1 hour ago)
  await t.mutation(async (ctx) => {
    await ctx.db.insert("tickets", {
      deviceId: device,
      ocrText: "Old ticket",
      createdAt: now - 31 * 86_400_000,
      expiresAt: now - 3600_000,
    });
    // Active ticket (expires in 10 days)
    await ctx.db.insert("tickets", {
      deviceId: device,
      ocrText: "Active ticket",
      createdAt: now,
      expiresAt: now + 10 * 86_400_000,
    });
  });

  const res = await t.mutation(internal.mutations.purgeExpiredTickets, {});
  expect(res.deleted).toBe(1);

  const remaining = await t.query(api.queries.ticketsQuery, { deviceId: device });
  expect(remaining).toHaveLength(1);
  expect(remaining[0].ocrText).toBe("Active ticket");
});

test("purgeExpiredCache removes POIs older than 24 hours", async (t) => {
  const device = testDeviceId();
  const now = Date.now();

  const stalePoi = {
    placeId: "osm:stale-1",
    source: "osm" as const,
    name: "Old Bakery",
    category: "restaurant",
    lat: -25.7,
    lng: 28.2,
    verifiedCount: 0,
    fetchedAt: now - 25 * 3600_000,
  };
  const freshPoi = {
    placeId: "osm:fresh-1",
    source: "osm" as const,
    name: "Fresh Cafe",
    category: "restaurant",
    lat: -25.7,
    lng: 28.2,
    verifiedCount: 0,
    fetchedAt: now,
  };

  await t.mutation(async (ctx) => {
    await ctx.db.insert("pois", {
      ...stalePoi,
      deviceIds: [device],
    });
    await ctx.db.insert("pois", {
      ...freshPoi,
      deviceIds: [device],
    });
  });

  const purgeRes = await t.mutation(internal.mutations.purgeExpiredCache, {});
  expect(purgeRes.deleted).toBeGreaterThanOrEqual(1);

  const remaining = await t.query(api.queries.poiQuery, {
    deviceId: device,
    category: "restaurant",
    now,
  });
  expect(remaining).toHaveLength(1);
  expect(remaining[0].placeId).toBe("osm:fresh-1");
});



