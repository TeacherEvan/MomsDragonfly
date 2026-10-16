import { v } from "convex/values";

import { internalMutation, mutation } from "./_generated/server";
import { validateDeviceId } from "./auth";
import { MAX_EXPENSES, MAX_NOTES, MAX_REMINDERS, MAX_TICKETS } from "./limits";

interface PoiInput {
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
  verifiedCount: number;
  fetchedAt: number;
}

const poiInputSchema = {
  placeId: v.string(),
  source: v.union(v.literal("google"), v.literal("osm"), v.literal("brave")),
  name: v.string(),
  category: v.string(),
  lat: v.number(),
  lng: v.number(),
  address: v.optional(v.string()),
  rating: v.optional(v.number()),
  phone: v.optional(v.string()),
  openNow: v.optional(v.boolean()),
  verifiedCount: v.number(),
  fetchedAt: v.number(),
};

export const upsertPOIs = mutation({
  args: {
    deviceId: v.string(),
    pois: v.array(v.object(poiInputSchema)),
  },
  handler: async (ctx, { deviceId, pois }) => {
    validateDeviceId(deviceId);
    if (pois.length === 0) return;

    const now = Date.now();

    for (const poi of pois) {
      const existing = await ctx.db
        .query("pois")
        .withIndex("by_placeId", (q) => q.eq("placeId", poi.placeId))
        .filter((q) => q.eq(q.field("deviceIds"), [deviceId]))
        .first();

      const data: PoiInput = { ...poi, fetchedAt: now };
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...data,
          verifiedCount: Math.max(existing.verifiedCount, poi.verifiedCount),
          deviceIds: [deviceId],
        });
      } else {
        await ctx.db.insert("pois", {
          ...data,
          deviceIds: [deviceId],
        });
      }
    }
  },
});

export const savePrefs = mutation({
  args: {
    deviceId: v.string(),
    defaultRadius: v.optional(v.number()),
    currency: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    vapidSubscription: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    tripStartDate: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { deviceId, ...updates }) => {
    validateDeviceId(deviceId);
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
    const patchData: Record<string, unknown> = { ...updates };
    if (updates.tripStartDate === null) {
      patchData.tripStartDate = undefined;
    }
    if (existing) {
      await ctx.db.patch(existing._id, patchData);
    } else {
      await ctx.db.insert("userPrefs", {
        deviceId,
        defaultRadius: updates.defaultRadius ?? 1000,
        currency: updates.currency ?? "USD",
        notificationsEnabled: updates.notificationsEnabled ?? false,
        onboardingComplete: updates.onboardingComplete ?? false,
        ...patchData,
      });
    }
  },
});

/**
 * Clears the stored Web Push subscription for a device (user turned
 * notifications off, or the endpoint died and `sendDueReminders` pruned it).
 */
export const clearPushSubscription = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
    if (existing && existing.vapidSubscription !== undefined) {
      await ctx.db.patch(existing._id, { vapidSubscription: undefined });
    }
  },
});

/**
 * Enables a public read-only share link for this device's journal.
 * Reuses the existing token if one was ever minted so re-enabling keeps
 * previously shared links working; the viewer only sees data while
 * shareEnabled is true.
 */
export const enableShare = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
    const shareToken = existing?.shareToken ?? crypto.randomUUID();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        shareEnabled: true,
        shareToken,
        shareTokenCreatedAt: existing.shareTokenCreatedAt ?? now,
      });
    } else {
      await ctx.db.insert("userPrefs", {
        deviceId,
        defaultRadius: 1000,
        currency: "USD",
        notificationsEnabled: false,
        onboardingComplete: false,
        shareEnabled: true,
        shareToken,
        shareTokenCreatedAt: now,
      });
    }
    return shareToken;
  },
});

export const rotateShare = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
    if (!existing) {
      return null;
    }
    const newShareToken = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.patch(existing._id, {
      shareEnabled: true,
      shareToken: newShareToken,
      shareTokenCreatedAt: now,
    });
    return newShareToken;
  },
});

export const disableShare = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { shareEnabled: false });
    }
  },
});

/**
 * Reset and rotate device identity.
 * Safely migrates all user preferences, locations, notes, expenses,
 * reminders, tickets, and budgets from oldDeviceId to newDeviceId,
 * while automatically revoking any active public share links.
 */
export const rekeyDevice = mutation({
  args: {
    oldDeviceId: v.string(),
    newDeviceId: v.string(),
  },
  handler: async (ctx, { oldDeviceId, newDeviceId }) => {
    validateDeviceId(oldDeviceId);
    validateDeviceId(newDeviceId);
    if (oldDeviceId === newDeviceId) {
      throw new Error("New device ID must differ from old device ID");
    }

    let migrated = 0;

    // 1. User preferences: re-key and revoke public share link
    const oldPrefs = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", oldDeviceId))
      .unique();

    if (oldPrefs) {
      const newPrefsExisting = await ctx.db
        .query("userPrefs")
        .withIndex("by_deviceId", (q) => q.eq("deviceId", newDeviceId))
        .take(100);
      for (const p of newPrefsExisting) {
        await ctx.db.delete(p._id);
      }
      await ctx.db.patch(oldPrefs._id, {
        deviceId: newDeviceId,
        shareEnabled: false,
        shareToken: undefined,
        shareTokenCreatedAt: undefined,
      });
      migrated++;
    }

    // 2. Location history (batched to prevent silent truncation)
    while (true) {
      const locations = await ctx.db
        .query("locationHistory")
        .withIndex("by_deviceId_timestamp", (q) => q.eq("deviceId", oldDeviceId))
        .take(500);
      if (locations.length === 0) break;
      for (const loc of locations) {
        await ctx.db.patch(loc._id, { deviceId: newDeviceId });
      }
      migrated += locations.length;
      if (locations.length < 500) break;
    }

    // 3. Journal notes
    while (true) {
      const notes = await ctx.db
        .query("journalNotes")
        .withIndex("by_deviceId_createdAt", (q) => q.eq("deviceId", oldDeviceId))
        .take(MAX_NOTES);
      if (notes.length === 0) break;
      for (const note of notes) {
        await ctx.db.patch(note._id, { deviceId: newDeviceId });
      }
      migrated += notes.length;
      if (notes.length < MAX_NOTES) break;
    }

    // 4. Expenses
    while (true) {
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_deviceId_date", (q) => q.eq("deviceId", oldDeviceId))
        .take(MAX_EXPENSES);
      if (expenses.length === 0) break;
      for (const exp of expenses) {
        await ctx.db.patch(exp._id, { deviceId: newDeviceId });
      }
      migrated += expenses.length;
      if (expenses.length < MAX_EXPENSES) break;
    }

    // 5. Reminders
    while (true) {
      const reminders = await ctx.db
        .query("reminders")
        .withIndex("by_deviceId_dueAt", (q) => q.eq("deviceId", oldDeviceId))
        .take(MAX_REMINDERS);
      if (reminders.length === 0) break;
      for (const rem of reminders) {
        await ctx.db.patch(rem._id, { deviceId: newDeviceId });
      }
      migrated += reminders.length;
      if (reminders.length < MAX_REMINDERS) break;
    }

    // 6. Tickets
    while (true) {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_deviceId_createdAt", (q) => q.eq("deviceId", oldDeviceId))
        .take(MAX_TICKETS);
      if (tickets.length === 0) break;
      for (const ticket of tickets) {
        await ctx.db.patch(ticket._id, { deviceId: newDeviceId });
      }
      migrated += tickets.length;
      if (tickets.length < MAX_TICKETS) break;
    }

    // 7. Budgets
    const newBudgetsExisting = await ctx.db
      .query("budgets")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", newDeviceId))
      .take(100);
    for (const b of newBudgetsExisting) {
      await ctx.db.delete(b._id);
    }
    while (true) {
      const budgets = await ctx.db
        .query("budgets")
        .withIndex("by_deviceId", (q) => q.eq("deviceId", oldDeviceId))
        .take(100);
      if (budgets.length === 0) break;
      for (const b of budgets) {
        await ctx.db.patch(b._id, { deviceId: newDeviceId });
      }
      migrated += budgets.length;
      if (budgets.length < 100) break;
    }

    // 8. Discovered POIs — preserve cached places under the new device ID
    while (true) {
      const userPois = await ctx.db
        .query("pois")
        .withIndex("by_deviceIds_category", (q) => q.eq("deviceIds", [oldDeviceId]))
        .take(500);
      if (userPois.length === 0) break;
      for (const poi of userPois) {
        const dup = await ctx.db
          .query("pois")
          .withIndex("by_placeId", (q) => q.eq("placeId", poi.placeId))
          .filter((q) => q.eq(q.field("deviceIds"), [newDeviceId]))
          .first();
        if (dup) {
          await ctx.db.patch(dup._id, {
            verifiedCount: Math.max(dup.verifiedCount, poi.verifiedCount),
            fetchedAt: Math.max(dup.fetchedAt, poi.fetchedAt),
          });
          await ctx.db.delete(poi._id);
        } else {
          await ctx.db.patch(poi._id, { deviceIds: [newDeviceId] });
        }
      }
      migrated += userPois.length;
      if (userPois.length < 500) break;
    }

    return { success: true, migrated };
  },
});

export const saveLocation = mutation({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    validateDeviceId(args.deviceId);
    await ctx.db.insert("locationHistory", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/** Cache write for location highlights (weather + news). Server-side only. */
export const setHighlightsCache = internalMutation({
  args: { locKey: v.string(), payload: v.string() },
  handler: async (ctx, { locKey, payload }) => {
    const existing = await ctx.db
      .query("highlightsCache")
      .withIndex("by_locKey", (q) => q.eq("locKey", locKey))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { payload, fetchedAt: Date.now() });
    } else {
      await ctx.db.insert("highlightsCache", { locKey, payload, fetchedAt: Date.now() });
    }
  },
});

/** Cache write for local dishes. Server-side only (called by the action). */
export const setDishesCache = internalMutation({
  args: { locKey: v.string(), payload: v.string() },
  handler: async (ctx, { locKey, payload }) => {
    const existing = await ctx.db
      .query("dishesCache")
      .withIndex("by_locKey", (q) => q.eq("locKey", locKey))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { payload, fetchedAt: Date.now() });
    } else {
      await ctx.db.insert("dishesCache", { locKey, payload, fetchedAt: Date.now() });
    }
  },
});

/** Cache write for lazy place enrichment. Server-side only (called by the action). */
export const setPlaceEnrichCache = internalMutation({
  args: { key: v.string(), payload: v.string() },
  handler: async (ctx, { key, payload }) => {
    const existing = await ctx.db
      .query("placeEnrichCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { payload, fetchedAt: Date.now() });
    } else {
      await ctx.db.insert("placeEnrichCache", { key, payload, fetchedAt: Date.now() });
    }
  },
});

export const purgeExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const BATCH_SIZE = 500;
    const MAX_PURGE_PER_RUN = 2000;
    let deleted = 0;

    while (deleted < MAX_PURGE_PER_RUN) {
      const takeCount = Math.min(BATCH_SIZE, MAX_PURGE_PER_RUN - deleted);
      const stale = await ctx.db
        .query("pois")
        .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", cutoff))
        .take(takeCount);

      if (stale.length === 0) break;

      for (const poi of stale) {
        await ctx.db.delete(poi._id);
      }
      deleted += stale.length;

      if (stale.length < takeCount) break;
    }

    return { deleted };
  },
});

export const purgeExpiredCaches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff90d = now - 90 * 24 * 60 * 60 * 1000;
    const BATCH_SIZE = 500;
    const MAX_PURGE_PER_RUN = 2000;
    let deleted = 0;

    // 1. Unified cache (>90d)
    while (deleted < MAX_PURGE_PER_RUN) {
      const takeCount = Math.min(BATCH_SIZE, MAX_PURGE_PER_RUN - deleted);
      const stale = await ctx.db
        .query("cache")
        .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", cutoff90d))
        .take(takeCount);
      if (stale.length === 0) break;
      for (const row of stale) {
        await ctx.db.delete(row._id);
      }
      deleted += stale.length;
      if (stale.length < takeCount) break;
    }

    // 2. Legacy highlights cache (24h)
    const cutoffHighlights = now - 24 * 60 * 60 * 1000;
    const staleHighlights = await ctx.db
      .query("highlightsCache")
      .filter((q) => q.lt(q.field("fetchedAt"), cutoffHighlights))
      .take(BATCH_SIZE);
    for (const row of staleHighlights) {
      await ctx.db.delete(row._id);
      deleted++;
    }

    // 3. Legacy dishes cache (7d)
    const cutoffDishes = now - 7 * 24 * 60 * 60 * 1000;
    const staleDishes = await ctx.db
      .query("dishesCache")
      .filter((q) => q.lt(q.field("fetchedAt"), cutoffDishes))
      .take(BATCH_SIZE);
    for (const row of staleDishes) {
      await ctx.db.delete(row._id);
      deleted++;
    }

    // 4. Legacy place enrichment cache (30d)
    const cutoffPlaceEnrich = now - 30 * 24 * 60 * 60 * 1000;
    const stalePlaceEnrich = await ctx.db
      .query("placeEnrichCache")
      .filter((q) => q.lt(q.field("fetchedAt"), cutoffPlaceEnrich))
      .take(BATCH_SIZE);
    for (const row of stalePlaceEnrich) {
      await ctx.db.delete(row._id);
      deleted++;
    }

    return { deleted };
  },
});

/**
 * One-off maintenance mutation to drain legacy cache tables so their
 * schemas can be dropped safely in subsequent releases.
 */
export const purgeLegacyCaches = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;
    const BATCH_SIZE = 500;
    for (const table of ["highlightsCache", "dishesCache", "placeEnrichCache"] as const) {
      while (true) {
        const rows = await ctx.db.query(table).take(BATCH_SIZE);
        if (rows.length === 0) break;
        for (const row of rows) {
          await ctx.db.delete(row._id);
        }
        deleted += rows.length;
        if (rows.length < BATCH_SIZE) break;
      }
    }
    return { deleted };
  },
});

export const verifyPOI = mutation({
  args: { placeId: v.string(), deviceId: v.string() },
  handler: async (ctx, { placeId, deviceId }) => {
    validateDeviceId(deviceId);
    const poi = await ctx.db
      .query("pois")
      .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
      .filter((q) => q.eq(q.field("deviceIds"), [deviceId]))
      .first();
    if (poi) {
      await ctx.db.patch(poi._id, {
        verifiedCount: poi.verifiedCount + 1,
      });
    }
  },
});

export const addExpense = mutation({
  args: {
    deviceId: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.union(
      v.literal("food"),
      v.literal("transport"),
      v.literal("accommodation"),
      v.literal("attraction"),
      v.literal("other")
    ),
    note: v.optional(v.string()),
    date: v.number(),
    ticketId: v.optional(v.id("tickets")),
  },
  handler: async (ctx, args) => {
    validateDeviceId(args.deviceId);
    if (args.ticketId) {
      const ticket = await ctx.db.get(args.ticketId);
      if (!ticket || ticket.deviceId !== args.deviceId) {
        throw new Error("Ticket not found or access denied");
      }
    }
    return ctx.db.insert("expenses", args);
  },
});

export const deleteExpense = mutation({
  args: { id: v.id("expenses"), deviceId: v.string() },
  handler: async (ctx, { id, deviceId }) => {
    validateDeviceId(deviceId);
    const expense = await ctx.db.get(id);
    if (!expense || expense.deviceId !== deviceId) {
      throw new Error("Expense not found or access denied");
    }
    await ctx.db.delete(id);
  },
});

/** Journal notes — hand-written memories, device-scoped. */
const NOTE_MAX_LENGTH = 500;

export const addJournalNote = mutation({
  args: {
    deviceId: v.string(),
    text: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, text, lat, lng }) => {
    validateDeviceId(deviceId);
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Note text is required");
    if (trimmed.length > NOTE_MAX_LENGTH) {
      throw new Error(`Note must be ${NOTE_MAX_LENGTH} characters or fewer`);
    }
    return ctx.db.insert("journalNotes", {
      deviceId,
      text: trimmed,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      createdAt: Date.now(),
    });
  },
});

export const deleteJournalNote = mutation({
  args: { id: v.id("journalNotes"), deviceId: v.string() },
  handler: async (ctx, { id, deviceId }) => {
    validateDeviceId(deviceId);
    const note = await ctx.db.get(id);
    if (!note || note.deviceId !== deviceId) {
      throw new Error("Note not found or access denied");
    }
    await ctx.db.delete(id);
  },
});

export const upsertBudget = mutation({
  args: {
    deviceId: v.string(),
    totalBudget: v.number(),
    currency: v.string(),
    period: v.union(v.literal("trip"), v.literal("daily")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    validateDeviceId(args.deviceId);
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("budgets", args);
    }
  },
});

export const addReminder = mutation({
  args: {
    deviceId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    dueAt: v.number(),
    repeat: v.union(v.literal("none"), v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    validateDeviceId(args.deviceId);
    return ctx.db.insert("reminders", { ...args, done: false });
  },
});

export const toggleReminder = mutation({
  args: { id: v.id("reminders"), deviceId: v.string() },
  handler: async (ctx, { id, deviceId }) => {
    validateDeviceId(deviceId);
    const reminder = await ctx.db.get(id);
    if (!reminder || reminder.deviceId !== deviceId) {
      throw new Error("Reminder not found or access denied");
    }
    await ctx.db.patch(id, { done: !reminder.done });
  },
});

export const deleteReminder = mutation({
  args: { id: v.id("reminders"), deviceId: v.string() },
  handler: async (ctx, { id, deviceId }) => {
    validateDeviceId(deviceId);
    const reminder = await ctx.db.get(id);
    if (!reminder || reminder.deviceId !== deviceId) {
      throw new Error("Reminder not found or access denied");
    }
    await ctx.db.delete(id);
  },
});

export const markReminderSent = internalMutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) return;

    const now = Date.now();
    if (reminder.repeat === "daily" || reminder.repeat === "weekly") {
      const stepMs = reminder.repeat === "daily" ? 86_400_000 : 7 * 86_400_000;
      let nextDue = reminder.dueAt + stepMs;
      while (nextDue <= now) {
        nextDue += stepMs;
      }
      await ctx.db.patch(id, {
        dueAt: nextDue,
        sentAt: undefined,
      });
    } else {
      await ctx.db.patch(id, { sentAt: now });
    }
  },
});

export const createTicket = mutation({
  args: {
    deviceId: v.string(),
    ocrText: v.optional(v.string()),
    parsedDate: v.optional(v.number()),
    parsedAmount: v.optional(v.number()),
    parsedVenue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateDeviceId(args.deviceId);
    const createdAt = Date.now();
    return ctx.db.insert("tickets", {
      ...args,
      createdAt,
      expiresAt: createdAt + 86_400_000,
    });
  },
});

export const deleteTicket = mutation({
  args: { id: v.id("tickets"), deviceId: v.string() },
  handler: async (ctx, { id, deviceId }) => {
    validateDeviceId(deviceId);
    const ticket = await ctx.db.get(id);
    if (!ticket || ticket.deviceId !== deviceId) {
      throw new Error("Ticket not found or access denied");
    }
    await ctx.db.delete(id);
  },
});

export const purgeExpiredTickets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const BATCH_SIZE = 500;
    const MAX_PURGE_PER_RUN = 2000;
    let deleted = 0;

    while (deleted < MAX_PURGE_PER_RUN) {
      const takeCount = Math.min(BATCH_SIZE, MAX_PURGE_PER_RUN - deleted);
      const expired = await ctx.db
        .query("tickets")
        .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
        .take(takeCount);

      if (expired.length === 0) break;

      for (const t of expired) {
        await ctx.db.delete(t._id);
      }
      deleted += expired.length;

      if (expired.length < takeCount) break;
    }

    return { deleted };
  },
});