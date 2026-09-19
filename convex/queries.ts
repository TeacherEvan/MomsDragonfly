import { query } from "./_generated/server";
import { v } from "convex/values";
import { validateDeviceId } from "./auth";

export const poiQuery = query({
  args: { deviceId: v.string(), category: v.string() },
  handler: async (ctx, { deviceId, category }) => {
    validateDeviceId(deviceId);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return ctx.db
      .query("pois")
      .withIndex("by_deviceIds_category", (q) =>
        q.eq("deviceIds", deviceId as any).eq("category", category)
      )
      .filter((q) => q.gt(q.field("fetchedAt"), cutoff))
      .collect();
  },
});

export const prefsQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    return ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
  },
});

export const historyQuery = query({
  args: { deviceId: v.string(), limit: v.number() },
  handler: async (ctx, { deviceId, limit }) => {
    validateDeviceId(deviceId);
    return ctx.db
      .query("locationHistory")
      .withIndex("by_deviceId_timestamp", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .take(limit);
  },
});

/** Returns true if a fetch was made within windowMs milliseconds. */
export const recentFetchCheck = query({
  args: { deviceId: v.string(), category: v.string(), windowMs: v.number() },
  handler: async (ctx, { deviceId, category, windowMs }) => {
    validateDeviceId(deviceId);
    const cutoff = Date.now() - windowMs;
    const recent = await ctx.db
      .query("pois")
      .withIndex("by_deviceIds_category", (q) =>
        q.eq("deviceIds", deviceId as any).eq("category", category)
      )
      .filter((q) => q.gt(q.field("fetchedAt"), cutoff))
      .first();
    return recent !== null;
  },
});

export const expensesQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    return ctx.db
      .query("expenses")
      .withIndex("by_deviceId_date", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .collect();
  },
});

export const budgetQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    return ctx.db
      .query("budgets")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
  },
});

export const remindersQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    return ctx.db
      .query("reminders")
      .withIndex("by_deviceId_dueAt", (q) => q.eq("deviceId", deviceId))
      .order("asc")
      .collect();
  },
});

export const upcomingRemindersQuery = query({
  args: { before: v.number() },
  handler: async (ctx, { before }) => {
    return ctx.db
      .query("reminders")
      .filter((q) =>
        q.and(
          q.lte(q.field("dueAt"), before),
          q.eq(q.field("done"), false),
          q.eq(q.field("sentAt"), undefined)
        )
      )
      .collect();
  },
});

export const ticketsQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    validateDeviceId(deviceId);
    return ctx.db
      .query("tickets")
      .withIndex("by_deviceId_createdAt", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .collect();
  },
});