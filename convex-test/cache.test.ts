import { afterEach, expect, vi } from "vitest";

import { internal } from "../convex/_generated/api";
import { cellKey } from "../convex/cache";
import { test } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

test("cacheGet returns null on cache miss", async (t) => {
  const row = await t.query(internal.cache.cacheGet, { key: "highlights:none" });
  expect(row).toBeNull();
});

test("cachePut inserts and updates cache row", async (t) => {
  await t.mutation(internal.cache.cachePut, {
    key: "dishes:pretoria",
    payload: JSON.stringify({ dishes: ["Biltong"] }),
  });

  const row = await t.query(internal.cache.cacheGet, { key: "dishes:pretoria" });
  expect(row).not.toBeNull();
  expect(JSON.parse(row!.payload).dishes).toEqual(["Biltong"]);

  // Update
  await t.mutation(internal.cache.cachePut, {
    key: "dishes:pretoria",
    payload: JSON.stringify({ dishes: ["Biltong", "Boerewors"] }),
  });

  const updated = await t.query(internal.cache.cacheGet, { key: "dishes:pretoria" });
  expect(JSON.parse(updated!.payload).dishes).toEqual(["Biltong", "Boerewors"]);
});

test("cacheGet returns newest entry if duplicate keys exist", async (t) => {
  await t.mutation(async (ctx) => {
    await ctx.db.insert("cache", {
      key: "highlights:dup",
      payload: JSON.stringify({ version: 1 }),
      fetchedAt: 1000,
    });
    await ctx.db.insert("cache", {
      key: "highlights:dup",
      payload: JSON.stringify({ version: 2 }),
      fetchedAt: 2000,
    });
  });

  const newest = await t.query(internal.cache.cacheGet, { key: "highlights:dup" });
  expect(newest).not.toBeNull();
  expect(JSON.parse(newest!.payload).version).toBe(2);
});

test("cellKey rounds coordinates to specified decimal places", async () => {
  expect(cellKey(-25.7461, 28.2374, 1)).toBe("-25.7,28.2");
  expect(cellKey(-25.7461, 28.2374, 2)).toBe("-25.75,28.24");
});

test("purgeLegacyCaches removes rows from all three legacy tables", async (t) => {
  await t.mutation(async (ctx) => {
    await ctx.db.insert("highlightsCache", {
      locKey: "-25.7,28.2",
      payload: "{}",
      fetchedAt: Date.now(),
    });
    await ctx.db.insert("dishesCache", {
      locKey: "-25.7,28.2",
      payload: "{}",
      fetchedAt: Date.now(),
    });
    await ctx.db.insert("placeEnrichCache", {
      key: "g:place-123",
      payload: "{}",
      fetchedAt: Date.now(),
    });
  });

  const res = await t.mutation(internal.mutations.purgeLegacyCaches, {});
  expect(res.deleted).toBe(3);

  // Verify tables are now empty
  const emptyCheck = await t.query(async (ctx) => {
    const h = await ctx.db.query("highlightsCache").collect();
    const d = await ctx.db.query("dishesCache").collect();
    const p = await ctx.db.query("placeEnrichCache").collect();
    return h.length + d.length + p.length;
  });
  expect(emptyCheck).toBe(0);
});

test("purgeExpiredCaches purges unified cache rows older than 90 days", async (t) => {
  const ninetyOneDaysAgo = Date.now() - 91 * 24 * 60 * 60 * 1000;
  await t.mutation(async (ctx) => {
    await ctx.db.insert("cache", {
      key: "phrases:old",
      payload: "{}",
      fetchedAt: ninetyOneDaysAgo,
    });
    await ctx.db.insert("cache", {
      key: "phrases:recent",
      payload: "{}",
      fetchedAt: Date.now(),
    });
  });

  const res = await t.mutation(internal.mutations.purgeExpiredCaches, {});
  expect(res.deleted).toBeGreaterThanOrEqual(1);

  const oldRow = await t.query(internal.cache.cacheGet, { key: "phrases:old" });
  expect(oldRow).toBeNull();

  const recentRow = await t.query(internal.cache.cacheGet, { key: "phrases:recent" });
  expect(recentRow).not.toBeNull();
});
