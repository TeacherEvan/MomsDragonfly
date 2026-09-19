import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── POI cache (all sources) ──────────────────────────────────────────────────
  pois: defineTable({
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
    deviceIds: v.array(v.string()),
  })
    .index("by_fetchedAt", ["fetchedAt"])
    .index("by_placeId", ["placeId"])
    .index("by_deviceIds_category", ["deviceIds", "category"]),

  // ── User preferences (one doc per device) ───────────────────────────────────
  userPrefs: defineTable({
    deviceId: v.string(),
    elderlyMode: v.boolean(),
    defaultRadius: v.number(),
    currency: v.string(),
    notificationsEnabled: v.boolean(),
    vapidSubscription: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    tripStartDate: v.optional(v.number()),
  }).index("by_deviceId", ["deviceId"]),

  // ── Location history ─────────────────────────────────────────────────────────
  locationHistory: defineTable({
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
    timestamp: v.number(),
  }).index("by_deviceId_timestamp", ["deviceId", "timestamp"]),

  // ── Expenses (plan B) ────────────────────────────────────────────────────────
  expenses: defineTable({
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
  }).index("by_deviceId_date", ["deviceId", "date"]),

  // ── Budget (plan B) ──────────────────────────────────────────────────────────
  budgets: defineTable({
    deviceId: v.string(),
    totalBudget: v.number(),
    currency: v.string(),
    period: v.union(v.literal("trip"), v.literal("daily")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  }).index("by_deviceId", ["deviceId"]),

  // ── Reminders (plan C) ───────────────────────────────────────────────────────
  reminders: defineTable({
    deviceId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    dueAt: v.number(),
    repeat: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    done: v.boolean(),
    sentAt: v.optional(v.number()),
  }).index("by_deviceId_dueAt", ["deviceId", "dueAt"]),

  // ── Tickets (plan D) ─────────────────────────────────────────────────────────
  tickets: defineTable({
    deviceId: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    ocrText: v.optional(v.string()),
    parsedDate: v.optional(v.number()),
    parsedAmount: v.optional(v.number()),
    parsedVenue: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_deviceId_createdAt", ["deviceId", "createdAt"]),
});
