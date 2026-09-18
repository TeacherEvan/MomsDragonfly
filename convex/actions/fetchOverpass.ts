"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/** Fetches public toilets + parks from OpenStreetMap Overpass API */
export const fetchOverpassNearby = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
  },
  handler: async (ctx: any, { deviceId, lat, lng, radius }: any) => {
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
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

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
