import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { validateDeviceId } from "./auth";
import type { Id } from "./_generated/dataModel";

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
        .unique();

      const data: PoiInput = { ...poi, fetchedAt: now };
      if (existing) {
        const deviceIds = existing.deviceIds ?? [];
        if (!deviceIds.includes(deviceId)) {
          await ctx.db.patch(existing._id, {
            ...data,
            deviceIds: [...deviceIds, deviceId],
          });
        } else {
          await ctx.db.patch(existing._id, data);
        }
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
    elderlyMode: v.optional(v.boolean()),
    defaultRadius: v.optional(v.number()),
    currency: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    vapidSubscription: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    tripStartDate: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, ...updates }) => {
    validateDeviceId(deviceId);
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("userPrefs", {
        deviceId,
        elderlyMode: updates.elderlyMode ?? false,
        defaultRadius: updates.defaultRadius ?? 1000,
        currency: updates.currency ?? "USD",
        notificationsEnabled: updates.notificationsEnabled ?? false,
        onboardingComplete: updates.onboardingComplete ?? false,
        ...updates,
      });
    }
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

export const purgeExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const BATCH_SIZE = 500;
    let deleted = 0;

    while (true) {
      const stale = await ctx.db
        .query("pois")
        .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", cutoff))
        .take(BATCH_SIZE);

      if (stale.length === 0) break;

      for (const poi of stale) {
        await ctx.db.delete(poi._id);
      }
      deleted += stale.length;

      if (stale.length < BATCH_SIZE) break;
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
      .unique();
    if (poi && (poi.deviceIds ?? []).includes(deviceId)) {
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
    await ctx.db.patch(id, { sentAt: Date.now() });
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
    let deleted = 0;

    while (true) {
      const expired = await ctx.db
        .query("tickets")
        .filter((q) => q.lt(q.field("expiresAt"), now))
        .take(BATCH_SIZE);

      if (expired.length === 0) break;

      for (const t of expired) {
        await ctx.db.delete(t._id);
      }
      deleted += expired.length;

      if (expired.length < BATCH_SIZE) break;
    }

    return { deleted };
  },
});