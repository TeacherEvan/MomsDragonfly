import { afterEach, expect, vi } from "vitest";

import { api } from "../convex/_generated/api";
import { test } from "./helpers";

/* Place-enrichment action tests: the Street View fallback (photo keyed off
 * coordinates — cannot be the wrong place) and the Wikipedia last resort.
 * The action's global fetch is stubbed, so no real network calls happen. */

const SAVED_ENV = {
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
  CONVEX_CLOUD_URL: process.env.CONVEX_CLOUD_URL,
};

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [k, v] of Object.entries(SAVED_ENV)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

test("getPlaceDetails returns a Street View proxy photo when Google has imagery", async (t) => {
  process.env.GOOGLE_PLACES_API_KEY = "test-key";
  process.env.CONVEX_SITE_URL = "https://test.convex.site";
  delete process.env.CONVEX_CLOUD_URL;

  const fetched: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      fetched.push(href);
      if (href.includes("streetview/metadata")) {
        return { ok: true, json: async () => ({ status: "OK" }) };
      }
      return { ok: false, json: async () => ({}) };
    })
  );

  const res = await t.action(api.actions.getPlaceDetails, {
    deviceId: "test-device-sv",
    placeId: "osm:1",
    source: "osm",
    name: "La Fiamma",
    category: "restaurant",
    lat: -25.7479,
    lng: 28.2293,
  });

  expect(res.photos.length).toBe(1);
  expect(res.photos[0]).toBe("https://test.convex.site/streetview?lat=-25.7479&lng=28.2293");
  // The metadata check ran; Wikipedia must not be consulted when imagery exists.
  expect(fetched.some((u) => u.includes("streetview/metadata"))).toBe(true);
  expect(fetched.some((u) => u.includes("wikipedia"))).toBe(false);
});

test("getPlaceDetails falls through to Wikipedia when Street View has no imagery", async (t) => {
  process.env.GOOGLE_PLACES_API_KEY = "test-key";
  process.env.CONVEX_SITE_URL = "https://test.convex.site";
  delete process.env.CONVEX_CLOUD_URL;

  const fetched: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      fetched.push(href);
      if (href.includes("streetview/metadata")) {
        return { ok: true, json: async () => ({ status: "ZERO_RESULTS" }) };
      }
      // Bare-name direct summary → disambiguation, no thumbnail.
      if (href.endsWith("/summary/La_Fiamma")) {
        return {
          ok: true,
          json: async () => ({
            title: "La fiamma",
            description: "Opera by Ottorino Respighi",
            extract: "La fiamma is an opera in three acts…",
          }),
        };
      }
      if (href.includes("list=search")) {
        return {
          ok: true,
          json: async () => ({ query: { search: [{ title: "La fiamma" }] } }),
        };
      }
      return { ok: false, json: async () => ({}) };
    })
  );

  const res = await t.action(api.actions.getPlaceDetails, {
    deviceId: "test-device-sv2",
    placeId: "osm:2",
    source: "osm",
    name: "La Fiamma",
    category: "restaurant",
    lat: -25.7479,
    lng: 28.2294,
  });

  // Street View had no imagery → Wikipedia was consulted → the opera article
  // is gated out → no photos at all (an empty sheet beats a wrong picture).
  expect(fetched.some((u) => u.includes("streetview/metadata"))).toBe(true);
  expect(fetched.some((u) => u.includes("wikipedia"))).toBe(true);
  expect(res.photos).toEqual([]);
});

test("getPlaceDetails survives a denied Street View key (metadata 403)", async (t) => {
  process.env.GOOGLE_PLACES_API_KEY = "test-key";
  process.env.CONVEX_SITE_URL = "https://test.convex.site";
  delete process.env.CONVEX_CLOUD_URL;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("streetview/metadata")) {
        return { ok: false, status: 403, json: async () => ({ status: "REQUEST_DENIED" }) };
      }
      return { ok: false, json: async () => ({}) };
    })
  );

  const res = await t.action(api.actions.getPlaceDetails, {
    deviceId: "test-device-sv3",
    placeId: "osm:3",
    source: "osm",
    name: "La Fiamma",
    category: "restaurant",
    lat: -25.7479,
    lng: 28.2295,
  });

  // No crash, no photo — exactly the current production behaviour with the
  // restricted key, until Street View Static API is enabled on the key.
  expect(res.photos).toEqual([]);
});
