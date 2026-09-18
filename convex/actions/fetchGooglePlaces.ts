"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const fetchNearby = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
    category: v.string(),
  },
  handler: async (ctx: any, { deviceId, lat, lng, radius, category }: any) => {
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
    });

    if (!res.ok) {
      throw new Error(`Google Places API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    await ctx.runMutation(api.mutations.upsertPOIs, {
      deviceId,
      pois: (data.places ?? []).map((p: Record<string, unknown>) => {
        const loc = p.location as { latitude: number; longitude: number };
        const name = p.displayName as { text: string } | undefined;
        return {
          placeId: p.id as string,
          source: "google" as const,
          name: name?.text ?? "Unknown",
          category,
          lat: loc.latitude,
          lng: loc.longitude,
          address: p.formattedAddress as string | undefined,
          rating: p.rating as number | undefined,
          phone: p.internationalPhoneNumber as string | undefined,
          openNow: (p.currentOpeningHours as { openNow?: boolean } | undefined)
            ?.openNow,
          verifiedCount: 0,
          fetchedAt: Date.now(),
        };
      }),
    });

    return { cached: false };
  },
});
