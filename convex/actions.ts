"use node";
import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { validateDeviceId } from "./auth";
import { cellKey, readThroughCache } from "./cache";
import { type DishItem, fallbackDishes, parseDishResponse } from "./dishHelpers";
import { fetchJson, fetchWithTimeout } from "./fetchWithTimeout";
import {
  fallbackPhrases,
  parsePhraseResponse,
  type PhraseItem,
  type PhrasesPayload,
} from "./phraseHelpers";
import {
  buildPhotoProxyUrl,
  buildStreetViewProxyUrl,
  deriveConvexSiteUrl,
  type GooglePlaceDetails,
  mapGoogleDetails,
  osmPhotoUrl,
  PLACE_ENRICH_TTL_MS,
  placeCacheKey,
  streetViewMetadataUrl,
} from "./placeHelpers";
import {
  summaryThumbnail,
  wikipediaPlaceImages,
  wikipediaPlacePhotosAt,
  wikipediaThumbnail,
  wikiSummaryUrl,
} from "./wikiHelpers";

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

/**
 * Address line from an OSM element's addr:* tags — "12 Burnett Street,
 * Hatfield". Verified live 2026-10-14 near Pretoria: Ocean Basket carries
 * addr:street=Burnett Street and phone=+27 12 362 6626 — real place info
 * the app used to fetch and discard. Returns undefined when the mapper
 * added no address tags.
 */
function osmAddress(tags?: Record<string, string>): string | undefined {
  if (!tags) return undefined;
  const house = tags["addr:housenumber"]?.trim();
  const street = tags["addr:street"]?.trim();
  const area =
    tags["addr:suburb"]?.trim() ||
    tags["addr:neighbourhood"]?.trim() ||
    tags["addr:quarter"]?.trim() ||
    tags["addr:city"]?.trim() ||
    tags["addr:town"]?.trim() ||
    tags["addr:village"]?.trim();
  const line1 = [house, street].filter(Boolean).join(" ");
  const parts = [line1 || undefined, area || undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/** Phone from an OSM element's phone / contact:phone tags. */
function osmPhone(tags?: Record<string, string>): string | undefined {
  const phone = tags?.phone?.trim() || tags?.["contact:phone"]?.trim();
  return phone || undefined;
}

async function fetchOverpass(query: string): Promise<OverpassElement[]> {
  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(
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
          timeoutMs: 25_000,
        }
      );

      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status} from ${endpoint.url}`);
        console.warn("Overpass endpoint non-OK:", endpoint.url, res.status);
        continue;
      }

      const data = await res.json();
      return (data.elements ?? []) as OverpassElement[];
    } catch (err) {
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
    // Food must degrade too: with the Google key dead (403) restaurants had
    // no fallback at all and the primary category loaded nothing.
    restaurant: [
      'node["amenity"="restaurant"]',
      'node["amenity"="fast_food"]',
      'node["amenity"="cafe"]',
    ],
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
    validateDeviceId(deviceId);
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
          address: osmAddress(el.tags),
          phone: osmPhone(el.tags),
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

  const res = await fetchWithTimeout("https://places.googleapis.com/v1/places:searchNearby", {
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
    timeoutMs: 12_000,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Places ${res.status}: ${body.slice(0, 160)}`);
  }

  const data = await res.json();
  return (data.places ?? []) as GooglePlace[];
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
    validateDeviceId(deviceId);
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
            address: osmAddress(el.tags),
            phone: osmPhone(el.tags),
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
    validateDeviceId(deviceId);
    // 1) Brave Search (free tier) — optional
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;
    if (braveKey) {
      try {
        const res = await fetchWithTimeout(
          `https://api.search.brave.com/res/v1/local/pois?q=entertainment+events&latitude=${lat}&longitude=${lng}&count=20`,
          {
            headers: { "Accept-Encoding": "gzip", "X-Subscription-Token": braveKey },
            timeoutMs: 10_000,
          }
        );

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
    deviceId: v.string(),
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, { deviceId, imageBase64, mimeType }) => {
    validateDeviceId(deviceId);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set — AI analysis disabled");
      return { ok: false as const, text: "", reason: "AI analysis not configured" };
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

    try {
      const res = await fetchWithTimeout(
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
          timeoutMs: 30_000,
        }
      );

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

export const getHighlights = action({
  args: { deviceId: v.string(), lat: v.number(), lng: v.number() },
  handler: async (ctx, { deviceId, lat, lng }): Promise<HighlightsPayload> => {
    validateDeviceId(deviceId);
    const locKey = cellKey(lat, lng, 2);

    return readThroughCache<HighlightsPayload>(ctx, {
      kind: "highlights",
      key: locKey,
      ttlMs: HIGHLIGHTS_TTL_MS,
      shouldCache: (payload) => Boolean(payload.weather || payload.news.length > 0),
      load: async () => {
        let locationName: string | null = null;
        let country: string | null = null;
        let weather: WeatherPayload | null = null;
        let news: HighlightNews[] = [];

        // 1) Weather + today's range (Open-Meteo, keyless)
        try {
          const w = await fetchJson<{
            current?: Record<string, number>;
            daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
          }>(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
              `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
              `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
            {},
            10_000
          );
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
          const n = await fetchJson<{
            name?: string;
            address?: Record<string, string>;
          }>(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`,
            { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" },
            10_000
          );
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
            const b = await fetchJson<{ results?: Array<Record<string, unknown>> }>(
              `https://api.search.brave.com/res/v1/news/search?q=${q}&count=6&freshness=pw`,
              { "Accept-Encoding": "gzip", "X-Subscription-Token": braveKey },
              10_000
            );
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

        return {
          locationName,
          weather,
          news,
          fetchedAt: Date.now(),
        };
      },
    });
  },
});


/* ────────────────────────────────────────────────────────────────────────────
 * getLocalDishes — popular local dishes for the area, cached ~7 days per
 * city-level (~11 km) cell. Nominatim reverse (keyless) + Gemini (optional,
 * curated fallback for known cities) + Wikipedia thumbnails (keyless).
 * Never throws: degrades to an empty list when nothing can be built.
 * ──────────────────────────────────────────────────────────────────────────── */

const DISHES_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface DishesPayload {
  areaName: string | null;
  dishes: DishItem[];
  fetchedAt: number;
}

/** Ask Gemini for the dish list. Returns null when unavailable/unusable. */
async function generateDishesWithGemini(
  areaName: string | null,
  country: string | null
): Promise<DishItem[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !areaName) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    `List 6 popular local dishes to try in ${areaName}` +
                    `${country ? `, ${country}` : ""}. Reply with ONLY a JSON array ` +
                    `(no prose, no markdown fences) of objects shaped ` +
                    `{"name": "...", "description": "..."} where description is ONE warm, simple ` +
                    `sentence (max 20 words) about what the dish is and what it is made of — ` +
                    `perfect for a curious traveller.`,
                },
              ],
            },
          ],
        }),
        timeoutMs: 25_000,
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`Dishes: Gemini error ${res.status} — ${body.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseDishResponse(text);
  } catch (err) {
    console.warn("Dishes: Gemini request failed:", String(err).slice(0, 160));
    return null;
  }
}

export const getLocalDishes = action({
  args: { deviceId: v.string(), lat: v.number(), lng: v.number() },
  handler: async (ctx, { deviceId, lat, lng }): Promise<DishesPayload> => {
    validateDeviceId(deviceId);
    const locKey = cellKey(lat, lng, 1);

    return readThroughCache<DishesPayload>(ctx, {
      kind: "dishes",
      key: locKey,
      ttlMs: DISHES_TTL_MS,
      shouldCache: (payload) => payload.dishes.length > 0,
      load: async () => {
        let areaName: string | null = null;
        let country: string | null = null;

        // 1) Area name (Nominatim reverse geocode, polite UA, city-level zoom)
        try {
          const n = await fetchJson<{ name?: string; address?: Record<string, string> }>(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`,
            { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" },
            10_000
          );
          const a = n?.address ?? {};
          areaName = a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? n?.name ?? null;
          country = a.country ?? null;
        } catch (err) {
          console.warn("Dishes: geocode failed:", String(err).slice(0, 160));
        }

        // 2) Dish list — Gemini first, curated fallback second (AI optional)
        const generated = await generateDishesWithGemini(areaName, country);
        const dishes: DishItem[] = generated ?? fallbackDishes(areaName, country);

        // 3) Pictures — Wikipedia summary thumbnails (keyless), in parallel
        const enriched = await Promise.all(
          dishes.map(async (dish) => ({
            ...dish,
            imageUrl: await wikipediaThumbnail(dish.name),
          }))
        );

        return { areaName, dishes: enriched, fetchedAt: Date.now() };
      },
    });
  },
});

/* ────────────────────────────────────────────────────────────────────────────
 * getLocalPhrases — 10 essential everyday local phrases, cached 30 days per
 * city-level cell. Gemini AI with curated fallbacks for offline/test reliability.
 * ──────────────────────────────────────────────────────────────────────────── */

const PHRASES_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function generatePhrasesWithGemini(
  areaName: string | null,
  country: string | null
): Promise<{ language: string | null; phrases: PhraseItem[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !areaName) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    `You are a warm, helpful local travel guide. Identify the primary local language ` +
                    `spoken by locals in ${areaName}${country ? `, ${country}` : ""}. If English is the main ` +
                    `language or lingua franca (e.g. UK, USA, Australia), pick the most notable local dialect ` +
                    `or informal everyday slang phrases travelers encounter. Otherwise pick the local language. ` +
                    `List exactly 10 essential everyday travel phrases (e.g. Hello, Thank you, Please, Excuse me, ` +
                    `How much is this?, Where is the bathroom?, Yes, No, Delicious, Do you speak English?). ` +
                    `Reply with ONLY a JSON object (no markdown, no prose) shaped: ` +
                    `{"language": "Name of Language", "phrases": [{"local": "Native script/text", "roman": "phonetic pronunciation", "english": "English translation", "note": "brief usage tip max 8 words"}]}`,
                },
              ],
            },
          ],
        }),
        timeoutMs: 25_000,
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`Phrases: Gemini error ${res.status} — ${body.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parsePhraseResponse(text);
  } catch (err) {
    console.warn("Phrases: Gemini request failed:", String(err).slice(0, 160));
    return null;
  }
}

export const getLocalPhrases = action({
  args: { deviceId: v.string(), lat: v.number(), lng: v.number() },
  handler: async (ctx, { deviceId, lat, lng }): Promise<PhrasesPayload> => {
    validateDeviceId(deviceId);
    const locKey = cellKey(lat, lng, 1);

    return readThroughCache<PhrasesPayload>(ctx, {
      kind: "phrases",
      key: locKey,
      ttlMs: PHRASES_TTL_MS,
      shouldCache: (payload) => payload.phrases.length > 0,
      load: async () => {
        let areaName: string | null = null;
        let country: string | null = null;

        // 1) Area name (Nominatim reverse geocode, polite UA, city-level zoom)
        try {
          const n = await fetchJson<{ name?: string; address?: Record<string, string> }>(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`,
            { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" },
            10_000
          );
          const a = n?.address ?? {};
          areaName = a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? n?.name ?? null;
          country = a.country ?? null;
        } catch (err) {
          console.warn("Phrases: geocode failed:", String(err).slice(0, 160));
        }

        // 2) Phrases — Gemini first, curated fallback second
        const generated = await generatePhrasesWithGemini(areaName, country);
        const resolved = generated ?? fallbackPhrases(areaName, country);

        return {
          areaName,
          language: resolved.language,
          phrases: resolved.phrases,
          fetchedAt: Date.now(),
        };
      },
    });
  },
});


/* ────────────────────────────────────────────────────────────────────────────
 * getPlaceDetails — lazy enrichment for one selected place. Google Places
 * Details (New) when the place came from Google; otherwise Street View of the
 * place's coordinates (a photo of the actual location — cannot be the wrong
 * place), and Wikipedia only when Street View has no imagery. Cached 30 days
 * per place key in placeEnrichCache. Never throws: degrades to whatever is
 * known. Photo bytes are proxied by /place-photo and /streetview
 * (convex/http.ts) so the API key never reaches the client — only
 * `*.convex.site` refs are returned.
 * ──────────────────────────────────────────────────────────────────────────── */

interface PlaceDetailsPayload {
  photos: string[];
  phone?: string;
  hours?: string[];
  ratingCount?: number;
  fetchedAt: number;
}

/** Places Details (New) lookup; null on failure (logged, never thrown). */
async function fetchGooglePlaceDetails(
  placeId: string,
  key: string
): Promise<unknown | null> {
  try {
    const res = await fetchWithTimeout(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "photos,nationalPhoneNumber,regularOpeningHours,userRatingCount",
        },
        timeoutMs: 12_000,
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`PlaceDetails: Google ${res.status} — ${body.slice(0, 160)}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("PlaceDetails: Google request failed:", String(err).slice(0, 200));
    return null;
  }
}

/** Max photos the sheet will show. */
const PLACE_PHOTO_LIMIT = 3;

/**
 * Street View coverage check (metadata API — free, unbilled). Returns true
 * only when Google has imagery for the coordinate (status "OK"); false on
 * ZERO_RESULTS, key restrictions, or any failure. Used to decide whether to
 * hand the sheet a Street View photo instead of a Wikipedia guess.
 */
async function streetViewHasImagery(
  lat: number,
  lng: number,
  key: string
): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(streetViewMetadataUrl(lat, lng, key), {
      timeoutMs: 8_000,
    });
    if (!res.ok) {
      console.warn(`PlaceDetails: StreetView metadata ${res.status}`);
      return false;
    }
    const json = (await res.json()) as { status?: unknown };
    return json?.status === "OK";
  } catch (err) {
    console.warn(
      "PlaceDetails: StreetView metadata failed:",
      String(err).slice(0, 160)
    );
    return false;
  }
}

export const getPlaceDetails = action({
  args: {
    deviceId: v.string(),
    placeId: v.string(),
    source: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (
    ctx,
    { deviceId, placeId, source, name, category, lat, lng }
  ): Promise<PlaceDetailsPayload> => {
    validateDeviceId(deviceId);
    const key = placeCacheKey({ source, placeId, name, lat, lng });

    return readThroughCache<PlaceDetailsPayload>(ctx, {
      kind: "placeEnrich",
      key,
      ttlMs: PLACE_ENRICH_TTL_MS,
      shouldCache: (payload) =>
        payload.photos.length > 0 ||
        payload.phone !== undefined ||
        payload.hours !== undefined ||
        payload.ratingCount !== undefined,
      load: async () => {
        const siteUrl = deriveConvexSiteUrl(process.env);
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        let details: GooglePlaceDetails = { photos: [] };
        let photos: string[] = [];

        // 1) Google Places Details (New) — only for Google-sourced rows with an id
        if (String(source).toLowerCase() === "google" && placeId && apiKey && siteUrl) {
          const json = await fetchGooglePlaceDetails(placeId, apiKey);
          if (json) {
            details = mapGoogleDetails(json);
            photos = details.photos
              .slice(0, PLACE_PHOTO_LIMIT)
              .map((ref) => buildPhotoProxyUrl(siteUrl, ref, 800));
          }
        } else if (!apiKey) {
          console.warn("PlaceDetails: GOOGLE_PLACES_API_KEY not set — fallback only");
        }

        // 2) OpenStreetMap node details (for OSM-sourced places)
        if (String(source).toLowerCase() === "osm" && placeId) {
          try {
            const osmId = placeId.replace(/^osm:/, "").trim();
            if (/^\d+$/.test(osmId)) {
              const nodeData = await fetchJson<{
                elements?: Array<{ tags?: Record<string, string> }>;
              }>(
                `https://api.openstreetmap.org/api/0.6/node/${osmId}.json`,
                { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" },
                6000
              );
              const tags = nodeData?.elements?.[0]?.tags;
              if (tags) {
                const osmImg = osmPhotoUrl(tags);
                if (osmImg && !photos.includes(osmImg)) {
                  photos.push(osmImg);
                }
                if (tags.wikipedia && photos.length === 0) {
                  const wikiTitle = tags.wikipedia.replace(/^[a-z]+:/i, "").trim();
                  if (wikiTitle) {
                    const wikiSummary = await fetchJson<unknown>(
                      wikiSummaryUrl(wikiTitle),
                      { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" },
                      6000
                    );
                    const thumb = summaryThumbnail(wikiSummary);
                    if (thumb && !photos.includes(thumb)) photos.push(thumb);
                  }
                }
                if (!details.phone && (tags.phone || tags["contact:phone"])) {
                  details.phone = tags.phone || tags["contact:phone"];
                }
                if (!details.hours && tags.opening_hours) {
                  details.hours = [tags.opening_hours];
                }
              }
            }
          } catch (err) {
            console.warn("PlaceDetails: OSM node lookup failed:", String(err).slice(0, 160));
          }
        }

        // 2) Street View fallback
        if (photos.length === 0 && siteUrl && apiKey) {
          try {
            if (await streetViewHasImagery(lat, lng, apiKey)) {
              photos = [buildStreetViewProxyUrl(siteUrl, lat, lng)];
            }
          } catch (err) {
            console.warn(
              "PlaceDetails: Street View fallback failed:",
              String(err).slice(0, 160)
            );
          }
        }

        // 3) Wikipedia geosearch
        if (photos.length === 0) {
          try {
            photos = await wikipediaPlacePhotosAt(lat, lng, name, 2);
          } catch (err) {
            console.warn("PlaceDetails: Wikipedia geosearch failed:", String(err).slice(0, 160));
            photos = [];
          }
        }

        // 4) Wikipedia name-search fallback
        if (photos.length === 0) {
          try {
            photos = await wikipediaPlaceImages(name, category, 2);
          } catch (err) {
            console.warn("PlaceDetails: Wikipedia fallback failed:", String(err).slice(0, 160));
            photos = [];
          }
        }

        return {
          photos,
          ...(details.phone ? { phone: details.phone } : {}),
          ...(details.hours && details.hours.length > 0 ? { hours: details.hours } : {}),
          ...(typeof details.ratingCount === "number"
            ? { ratingCount: details.ratingCount }
            : {}),
          fetchedAt: Date.now(),
        };
      },
    });
  },
});

/* ────────────────────────────────────────────────────────────────────────────
 * sendDueReminders — unchanged: web-push for due reminders.
 * ──────────────────────────────────────────────────────────────────────────── */

import webpush, { type PushSubscription } from "web-push";

import { internalAction } from "./_generated/server";

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
    const due = (await ctx.runQuery(internal.queries.upcomingRemindersQuery, {
      before: now,
    })) as Reminder[];

    if (due.length === 0) return;

    const deviceIds = [...new Set(due.map((r) => r.deviceId))];
    const prefsMap = new Map<string, UserPrefs>();

    const prefsList = (await Promise.all(
      deviceIds.map((deviceId) =>
        ctx.runQuery(api.queries.prefsQuery, { deviceId })
      )
    )) as (UserPrefs | null)[];

    prefsList.forEach((prefs, idx) => {
      if (prefs) {
        prefsMap.set(deviceIds[idx], prefs);
      }
    });

    // Devices whose push endpoint is permanently gone (404/410) — clear the
    // stored subscription after the loop so we stop hammering a dead endpoint
    // every 5 minutes.
    const deadDevices = new Set<string>();

    for (const reminder of due) {
      const prefs = prefsMap.get(reminder.deviceId);
      if (!prefs?.vapidSubscription) continue;
      // Respect the user's Notifications toggle in Settings.
      if (!prefs.notificationsEnabled) continue;

      let subscription: PushSubscription;
      try {
        const parsed = JSON.parse(prefs.vapidSubscription) as {
          endpoint?: string;
          keys?: { p256dh?: string; auth?: string };
        };
        // Validate the shape web-push requires — a structurally broken
        // subscription is treated as dead (pruned below) rather than throwing
        // on every cron tick.
        if (
          typeof parsed.endpoint !== "string" ||
          typeof parsed.keys?.p256dh !== "string" ||
          typeof parsed.keys?.auth !== "string"
        ) {
          throw new Error("Malformed push subscription");
        }
        subscription = parsed as PushSubscription;
      } catch {
        console.warn(
          `Corrupt push subscription for device ${reminder.deviceId} — clearing it`
        );
        deadDevices.add(reminder.deviceId);
        continue;
      }

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: reminder.title,
            body: reminder.body ?? "",
            url: "/reminders",
          })
        );
        await ctx.runMutation(internal.mutations.markReminderSent, {
          id: reminder._id as import("./_generated/dataModel").Id<"reminders">,
        });
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          console.warn(
            `Push endpoint gone (${statusCode}) for device ${reminder.deviceId} — will prune subscription`
          );
          deadDevices.add(reminder.deviceId);
        } else {
          console.error(
            `Failed to send push for reminder ${reminder._id}:`,
            err
          );
        }
      }
    }

    for (const deviceId of deadDevices) {
      try {
        await ctx.runMutation(api.mutations.clearPushSubscription, {
          deviceId,
        });
      } catch (err) {
        console.error(`Failed to prune dead push subscription for ${deviceId}:`, err);
      }
    }
  },
});
