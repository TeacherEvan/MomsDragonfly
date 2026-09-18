"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

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
  handler: async (ctx: any, { deviceId, lat, lng, radius }: any) => {
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;

    if (braveKey) {
      try {
        const res = await fetch(
          `https://api.search.brave.com/res/v1/local/pois?q=entertainment+events&latitude=${lat}&longitude=${lng}&count=20`,
          { headers: { "Accept-Encoding": "gzip", "X-Subscription-Token": braveKey } }
        );
        if (res.ok) {
          const data = await res.json();
          const results: Array<{
            id: string;
            name: string;
            coordinates?: { lat: number; lon: number };
            address?: { street_address: string };
          }> = data.results ?? [];
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
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(q)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) throw new Error(`Overpass fallback error: ${res.status}`);
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
          name: el.tags?.name ?? el.tags?.amenity ?? "Entertainment",
          category: "entertainment",
          lat: el.lat,
          lng: el.lon,
          verifiedCount: 0,
          fetchedAt: Date.now(),
        })),
      });
      return { count: elements.length };
    } catch {
      return { count: 0 };
    }
  },
});
