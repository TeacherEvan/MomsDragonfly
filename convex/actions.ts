"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { validateDeviceId } from "./auth";

/* ────────────────────────────────────────────────────────────────────────────
 * Overpass (OSM) helpers
 * overpass-api.de rejects POST from some networks with 406 (verified live),
 * while GET works. A fallback chain keeps OSM data flowing when an endpoint
 * is rate-limited, blocked, or slow.
 * ──────────────────────────────────────────────────────────────────────────── */

const OVERPASS_ENDPOINTS: Array<{ url: string; method: "GET" | "POST" }> = [
  { url: "https://overpass-api.de/api/interpreter", method: "GET" },
  { url: "https://maps.mail.ru/osm/tools/overpass/api/interpreter", method: "POST" },
  { url: "https://overpass.kumi.systems/api/interpreter", method: "GET" },
];

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

async function fetchOverpass(query: string): Promise<OverpassElement[]> {
  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch(
        endpoint.method === "GET"
          ? `${endpoint.url}?data=${encodeURIComponent(query)}`
          : endpoint.url,
        {
          method: endpoint.method,
          headers: {
            "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)",
            ...(endpoint.method === "POST"
              ? { "Content-Type": "application/x-www-form-urlencoded" }
              : {}),
          },
          body:
            endpoint.method === "POST"
              ? `data=${encodeURIComponent(query)}`
              : undefined,
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status} from ${endpoint.url}`);
        console.warn("Overpass endpoint non-OK:", endpoint.url, res.status);
        continue;
      }

      const data = await res.json();
      return (data.elements ?? []) as OverpassElement[];
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      console.warn("Overpass endpoint error:", endpoint.url, String(err).slice(0, 200));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Overpass unreachable");
}

/** Builds an Overpass fallback query for a UI category (null when no good OSM equivalent). */
function overpassFallbackQuery(
  category: string,
  radius: number,
  lat: number,
  lng: number
): string | null {
  const selectors: Record<string, string[]> = {
    park: ['node["leisure"="park"]'],
    pharmacy: ['node["amenity"="pharmacy"]'],
    attraction: ['node["tourism"~"attraction|museum|viewpoint"]'],
    entertainment: ['node["amenity"~"theatre|cinema|nightclub"]'],
    toilets: ['node["amenity"="toilets"]'],
  };
  const sels = selectors[category];
  if (!sels) return null;
  return `[out:json][timeout:25];(${sels
    .map((s) => `${s}(around:${radius},${lat},${lng});`)
    .join("")});out body 20;`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * fetchOverpassNearby — toilets + parks + pharmacy straight from OSM.
 * Used for restrooms (no good Google type) and as a fallback path.
 * ──────────────────────────────────────────────────────────────────────────── */

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
      const elements = await fetchOverpass(query);

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
      console.warn("Overpass fetch failed:", String(err).slice(0, 200));
      return { count: 0 };
    }
  },
});

/* ────────────────────────────────────────────────────────────────────────────
 * fetchNearby — Google Places first (valid type mapping!), Overpass fallback.
 * ──────────────────────────────────────────────────────────────────────────── */

const GOOGLE_TYPES: Record<string, string[]> = {
  restaurant: ["restaurant", "cafe"],
  attraction: ["tourist_attraction"],
  park: ["park"],
  pharmacy: ["pharmacy"],
  entertainment: ["movie_theater", "night_club", "performing_arts_theater"],
};

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  rating?: number;
  currentOpeningHours?: { openNow?: boolean };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
}

/** Sparse categories need a wider net to find anything. */
function effectiveRadius(category: string, radius: number): number {
  return category === "park" || category === "attraction"
    ? Math.max(radius, 2500)
    : radius;
}

async function fetchGooglePlaces(
  key: string,
  category: string,
  lat: number,
  lng: number,
  radius: number
): Promise<GooglePlace[]> {
  const types = GOOGLE_TYPES[category];
  if (!types) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
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
        includedTypes: types,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Google Places ${res.status}: ${body.slice(0, 160)}`);
    }

    const data = await res.json();
    return (data.places ?? []) as GooglePlace[];
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
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

    const radiusToUse = effectiveRadius(category, radius);
    const key = process.env.GOOGLE_PLACES_API_KEY;

    // 1) Google Places (correct type mapping)
    if (key && GOOGLE_TYPES[category]) {
      try {
        const places = await fetchGooglePlaces(key, category, lat, lng, radiusToUse);
        if (places.length > 0) {
          await ctx.runMutation(api.mutations.upsertPOIs, {
            deviceId,
            pois: places.map((p) => ({
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
          return { cached: false, source: "google" as const, count: places.length };
        }
        console.warn("Google returned 0 results, trying Overpass fallback:", category);
      } catch (err) {
        console.warn("Google Places failed, trying Overpass fallback:", String(err).slice(0, 220));
      }
    } else if (!key) {
      console.warn("GOOGLE_PLACES_API_KEY not set — trying Overpass only");
    }

    // 2) Overpass fallback
    const fallbackQuery = overpassFallbackQuery(category, radiusToUse, lat, lng);
    if (fallbackQuery) {
      try {
        const elements = await fetchOverpass(fallbackQuery);
        await ctx.runMutation(api.mutations.upsertPOIs, {
          deviceId,
          pois: elements.map((el) => ({
            placeId: `osm:${el.id}`,
            source: "osm" as const,
            name:
              el.tags?.name ??
              el.tags?.tourism ??
              el.tags?.amenity ??
              el.tags?.leisure ??
              "Place",
            category,
            lat: el.lat,
            lng: el.lon,
            verifiedCount: 0,
            fetchedAt: Date.now(),
          })),
        });
        return { cached: false, source: "osm" as const, count: elements.length };
      } catch (err) {
        console.warn("Overpass fallback failed:", String(err).slice(0, 200));
      }
    }

    return { cached: false, mock: true };
  },
});

/* ────────────────────────────────────────────────────────────────────────────
 * fetchEntertainment — Brave → Google → Overpass chain.
 * ──────────────────────────────────────────────────────────────────────────── */

interface BraveResult {
  id: string;
  name: string;
  coordinates?: { lat: number; lon: number };
  address?: { street_address: string };
}

export const fetchEntertainment = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, { deviceId, lat, lng, radius }) => {
    // 1) Brave Search (free tier) — optional
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
          if (results.length > 0) {
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
            return { count: results.length, source: "brave" as const };
          }
        } else {
          console.warn("Brave search non-OK:", res.status);
        }
      } catch (err) {
        console.warn("Brave search failed:", String(err).slice(0, 200));
      }
    }

    // 2) Google Places fallback
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (key) {
      try {
        const places = await fetchGooglePlaces(key, "entertainment", lat, lng, radius);
        if (places.length > 0) {
          await ctx.runMutation(api.mutations.upsertPOIs, {
            deviceId,
            pois: places.map((p) => ({
              placeId: p.id,
              source: "google" as const,
              name: p.displayName?.text ?? "Unknown",
              category: "entertainment",
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
          return { count: places.length, source: "google" as const };
        }
      } catch (err) {
        console.warn("Google entertainment fallback failed:", String(err).slice(0, 200));
      }
    }

    // 3) Overpass fallback (theatres, cinemas, nightclubs)
    const q = overpassFallbackQuery("entertainment", radius, lat, lng);
    if (q) {
      try {
        const elements = await fetchOverpass(q);
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
        return { count: elements.length, source: "osm" as const };
      } catch (err) {
        console.warn("Overpass entertainment fallback failed:", String(err).slice(0, 200));
      }
    }

    return { count: 0 };
  },
});

/* ────────────────────────────────────────────────────────────────────────────
 * geminiOCR — optional AI enrichment. Never throws: returns structured result.
 * ──────────────────────────────────────────────────────────────────────────── */

export const geminiOCR = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, { imageBase64, mimeType }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set — AI analysis disabled");
      return { ok: false as const, text: "", reason: "AI analysis not configured" };
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
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
                  { inlineData: { mimeType, data: imageBase64 } },
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
        const body = await res.text().catch(() => "");
        console.error(`Gemini API error: ${res.status} — ${body.slice(0, 300)}`);
        return {
          ok: false as const,
          text: "",
          reason: `AI analysis failed (${res.status})`,
        };
      }

      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return { ok: true as const, text };
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Gemini request failed:", String(err).slice(0, 200));
      return { ok: false as const, text: "", reason: "AI analysis unavailable" };
    }
  },
});

/* ────────────────────────────────────────────────────────────────────────────
 * getHighlights — location weather + news highlights, cached ~30 min per
 * ~1 km cell. Open-Meteo (no key) + Nominatim reverse + Brave news (optional).
 * Never throws: degrades to whatever data could be fetched.
 * ──────────────────────────────────────────────────────────────────────────── */

const HIGHLIGHTS_TTL_MS = 30 * 60 * 1000;

interface WeatherPayload {
  tempC: number;
  feelsC: number;
  windKmh: number;
  code: number;
  isDay: boolean;
  maxC: number | null;
  minC: number | null;
}

interface HighlightNews {
  title: string;
  url: string;
  source?: string;
  age?: string;
}

interface HighlightsPayload {
  locationName: string | null;
  weather: WeatherPayload | null;
  news: HighlightNews[];
  fetchedAt: number;
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const getHighlights = action({
  args: { deviceId: v.string(), lat: v.number(), lng: v.number() },
  handler: async (ctx, { deviceId, lat, lng }): Promise<HighlightsPayload> => {
    validateDeviceId(deviceId);
    const locKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;

    const cached = await ctx.runQuery(internal.queries.getHighlightsCache, { locKey });
    if (cached && Date.now() - cached.fetchedAt < HIGHLIGHTS_TTL_MS) {
      try {
        return JSON.parse(cached.payload) as HighlightsPayload;
      } catch {
        // fall through and refetch
      }
    }

    let locationName: string | null = null;
    let country: string | null = null;
    let weather: WeatherPayload | null = null;
    let news: HighlightNews[] = [];

    // 1) Weather + today's range (Open-Meteo, keyless)
    try {
      const w = (await fetchJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
          `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
        {},
        10_000
      )) as {
        current?: Record<string, number>;
        daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
      };
      if (w?.current) {
        weather = {
          tempC: w.current.temperature_2m,
          feelsC: w.current.apparent_temperature,
          windKmh: w.current.wind_speed_10m,
          code: w.current.weather_code,
          isDay: w.current.is_day === 1,
          maxC: w.daily?.temperature_2m_max?.[0] ?? null,
          minC: w.daily?.temperature_2m_min?.[0] ?? null,
        };
      }
    } catch (err) {
      console.warn("Highlights: weather fetch failed:", String(err).slice(0, 160));
    }

    // 2) Place name (Nominatim reverse geocode, polite UA)
    try {
      const n = (await fetchJson(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`,
        { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" },
        10_000
      )) as {
        name?: string;
        address?: Record<string, string>;
      };
      const a = n?.address ?? {};
      locationName = a.city ?? a.town ?? a.suburb ?? a.village ?? a.county ?? n?.name ?? null;
      country = a.country ?? null;
    } catch (err) {
      console.warn("Highlights: geocode failed:", String(err).slice(0, 160));
    }

    // 3) Area news (Brave; key optional)
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;
    if (braveKey && locationName) {
      try {
        const q = encodeURIComponent(
          [locationName, country].filter(Boolean).join(" ")
        );
        const b = (await fetchJson(
          `https://api.search.brave.com/res/v1/news/search?q=${q}&count=6&freshness=pw`,
          { "Accept-Encoding": "gzip", "X-Subscription-Token": braveKey },
          10_000
        )) as { results?: Array<Record<string, unknown>> };
        news = (b?.results ?? [])
          .slice(0, 5)
          .map((r) => {
            const source = r.source as { name?: string } | undefined;
            const metaUrl = r.meta_url as { hostname?: string } | undefined;
            return {
              title: (r.title as string) ?? "Untitled",
              url: (r.url as string) ?? "",
              source: source?.name ?? metaUrl?.hostname ?? undefined,
              age: (r.age as string) ?? undefined,
            };
          })
          .filter((n) => n.url);
      } catch (err) {
        console.warn("Highlights: news fetch failed:", String(err).slice(0, 160));
      }
    }

    const payload: HighlightsPayload = {
      locationName,
      weather,
      news,
      fetchedAt: Date.now(),
    };

    if (weather || news.length > 0) {
      await ctx.runMutation(internal.mutations.setHighlightsCache, {
        locKey,
        payload: JSON.stringify(payload),
      });
    }

    return payload;
  },
});

/* ────────────────────────────────────────────────────────────────────────────
 * sendDueReminders — unchanged: web-push for due reminders.
 * ──────────────────────────────────────────────────────────────────────────── */

import { internalAction } from "./_generated/server";
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
