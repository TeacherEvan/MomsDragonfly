"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/** Fetches public toilets + parks from OpenStreetMap Overpass API */
export const fetchOverpassNearby = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, { deviceId, lat, lng, radius }) => {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="toilets"](around:${radius},${lat},${lng});
        node["leisure"="park"](around:${radius},${lat},${lng});
        node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      );
      out body 20;
    `;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
      const data = await res.json();

      const elements: Array<{
        id: number;
        lat: number;
        lon: number;
        tags?: Record<string, string>;
      }> = data.elements ?? [];

      await ctx.runMutation(api.mutations.upsertPOIs, {
        deviceId,
        pois: elements.map((el) => ({
          placeId: `osm:${el.id}`,
          source: "osm" as const,
          name: el.tags?.name ?? el.tags?.amenity ?? el.tags?.leisure ?? "POI",
          category: el.tags?.amenity ?? el.tags?.leisure ?? "other",
          lat: el.lat,
          lng: el.lon,
          verifiedCount: 0,
          fetchedAt: Date.now(),
        })),
      });

      return { count: elements.length };
    } catch (err) {
      console.warn("Overpass fetch failed, returning 0", err);
      return { count: 0 };
    }
  },
});

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  rating?: number;
  currentOpeningHours?: { openNow?: boolean };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
}

export const fetchNearby = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
    category: v.string(),
  },
  handler: async (ctx, { deviceId, lat, lng, radius, category }) => {
    const recent = await ctx.runQuery(api.queries.recentFetchCheck, {
      deviceId,
      category,
      windowMs: 3_600_000,
    });
    if (recent) return { cached: true };

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      console.warn("GOOGLE_PLACES_API_KEY not set — using offline/mock places");
      return { cached: false, mock: true };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.location,places.rating,places.currentOpeningHours,places.formattedAddress,places.internationalPhoneNumber",
        },
        body: JSON.stringify({
          includedTypes: [category],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radiusMeters: radius,
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Google Places API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      await ctx.runMutation(api.mutations.upsertPOIs, {
        deviceId,
        pois: (data.places ?? []).map((p: GooglePlace) => ({
          placeId: p.id,
          source: "google" as const,
          name: p.displayName?.text ?? "Unknown",
          category,
          lat: p.location?.latitude ?? 0,
          lng: p.location?.longitude ?? 0,
          address: p.formattedAddress,
          rating: p.rating,
          phone: p.internationalPhoneNumber,
          openNow: p.currentOpeningHours?.openNow,
          verifiedCount: 0,
          fetchedAt: Date.now(),
        })),
      });

      return { cached: false };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },
});

interface BraveResult {
  id: string;
  name: string;
  coordinates?: { lat: number; lon: number };
  address?: { street_address: string };
}

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

/**
 * Fetches entertainment events nearby.
 * Uses Brave Search API if key is available, else falls back to Overpass.
 */
export const fetchEntertainment = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, { deviceId, lat, lng, radius }) => {
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;

    if (braveKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(
          `https://api.search.brave.com/res/v1/local/pois?q=entertainment+events&latitude=${lat}&longitude=${lng}&count=20`,
          {
            headers: { "Accept-Encoding": "gzip", "X-Subscription-Token": braveKey },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const results: BraveResult[] = data.results ?? [];

          await ctx.runMutation(api.mutations.upsertPOIs, {
            deviceId,
            pois: results.map((r) => ({
              placeId: `brave:${r.id}`,
              source: "brave" as const,
              name: r.name,
              category: "entertainment",
              lat: r.coordinates?.lat ?? lat,
              lng: r.coordinates?.lon ?? lng,
              address: r.address?.street_address,
              verifiedCount: 0,
              fetchedAt: Date.now(),
            })),
          });
          return { count: results.length };
        }
      } catch (err) {
        console.warn("Brave search failed, falling back to Overpass", err);
      }
    }

    // Fallback: Overpass theaters + cinemas
    const q = `
      [out:json][timeout:25];
      (
        node["amenity"="theatre"](around:${radius},${lat},${lng});
        node["amenity"="cinema"](around:${radius},${lat},${lng});
        node["amenity"="nightclub"](around:${radius},${lat},${lng});
      );
      out body 20;
    `;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(q)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Overpass fallback error: ${res.status}`);
      const data = await res.json();
      const elements: OverpassElement[] = data.elements ?? [];

      await ctx.runMutation(api.mutations.upsertPOIs, {
        deviceId,
        pois: elements.map((el) => ({
          placeId: `osm:${el.id}`,
          source: "osm" as const,
          name: el.tags?.name ?? el.tags?.amenity ?? "Entertainment",
          category: "entertainment",
          lat: el.lat,
          lng: el.lon,
          verifiedCount: 0,
          fetchedAt: Date.now(),
        })),
      });
      return { count: elements.length };
    } catch (err) {
      console.warn("Overpass fallback failed", err);
      return { count: 0 };
    }
  },
});

export const geminiOCR = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, { imageBase64, mimeType }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set — returning mock parse text");
      return { text: "Receipt\nTotal: $0.00" };
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: { mimeType, data: imageBase64 },
                  },
                  {
                    text: "Extract all text from this ticket or receipt. Return only the raw text, no formatting.",
                  },
                ],
              },
            ],
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      return { text };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },
});

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

interface Reminder {
  _id: string;
  deviceId: string;
  title: string;
  body?: string;
  dueAt: number;
  repeat: "none" | "daily" | "weekly";
  done: boolean;
  sentAt?: number;
}

interface UserPrefs {
  deviceId: string;
  vapidSubscription?: string;
  notificationsEnabled: boolean;
}

export const sendDueReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublic || !vapidPrivate || !vapidSubject) {
      console.warn("VAPID keys not set — skipping push send");
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const now = Date.now();
    const due = (await ctx.runQuery(api.queries.upcomingRemindersQuery, {
      before: now,
    })) as Reminder[];

    if (due.length === 0) return;

    // Batch fetch prefs for all deviceIds
    const deviceIds = [...new Set(due.map((r) => r.deviceId))];
    const prefsMap = new Map<string, UserPrefs>();

    for (const deviceId of deviceIds) {
      const prefs = (await ctx.runQuery(api.queries.prefsQuery, {
        deviceId,
      })) as UserPrefs | null;
      if (prefs) {
        prefsMap.set(deviceId, prefs);
      }
    }

    for (const reminder of due) {
      const prefs = prefsMap.get(reminder.deviceId);
      if (!prefs?.vapidSubscription) continue;

      try {
        const subscription = JSON.parse(prefs.vapidSubscription);
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: reminder.title,
            body: reminder.body ?? "",
          })
        );
        await ctx.runMutation(internal.mutations.markReminderSent, {
          id: reminder._id as import("./_generated/dataModel").Id<"reminders">,
        });
      } catch (err) {
        console.error(`Failed to send push for reminder ${reminder._id}:`, err);
      }
    }
  },
});