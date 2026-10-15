import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";

export type CacheKind = "highlights" | "dishes" | "placeEnrich" | "phrases";

/** Namespaced cache key: "<kind>:<locKey|placeKey>". */
export const cacheKey = (kind: CacheKind, key: string) => `${kind}:${key}`;

/** Round a coordinate pair into a cache cell key (e.g. cellKey(-25.746, 28.237, 1) -> "-25.7,28.2"). */
export const cellKey = (lat: number, lng: number, decimals: number) =>
  `${lat.toFixed(decimals)},${lng.toFixed(decimals)}`;

/**
 * Newest row for a key. Uses `.take(1)` on purpose: a cold-key double insert
 * must never poison the read path the way `.unique()` would.
 */
async function readCacheRow(ctx: QueryCtx, key: string) {
  const rows = await ctx.db
    .query("cache")
    .withIndex("by_key", (q) => q.eq("key", key))
    .order("desc")
    .take(1);
  return rows[0] ?? null;
}

/** Patch the newest row for the key, else insert. */
async function writeCacheRow(ctx: MutationCtx, key: string, payload: string) {
  const [existing] = await ctx.db
    .query("cache")
    .withIndex("by_key", (q) => q.eq("key", key))
    .order("desc")
    .take(1);
  if (existing) {
    await ctx.db.patch(existing._id, { payload, fetchedAt: Date.now() });
  } else {
    await ctx.db.insert("cache", { key, payload, fetchedAt: Date.now() });
  }
}

export const cacheGet = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => readCacheRow(ctx, key),
});

export const cachePut = internalMutation({
  args: { key: v.string(), payload: v.string() },
  handler: async (ctx, { key, payload }) => writeCacheRow(ctx, key, payload),
});

/**
 * Read-through cache for actions: fresh hit -> return parsed payload immediately;
 * otherwise run `load()` and persist its result when `shouldCache` allows (default: always).
 * Corrupt JSON falls through and reloads safely.
 */
export async function readThroughCache<T>(
  ctx: ActionCtx,
  opts: {
    kind: CacheKind;
    key: string;
    ttlMs: number;
    load: () => Promise<T>;
    shouldCache?: (value: T) => boolean;
  }
): Promise<T> {
  const key = cacheKey(opts.kind, opts.key);
  const cached = await ctx.runQuery(internal.cache.cacheGet, { key });
  if (cached && Date.now() - cached.fetchedAt < opts.ttlMs) {
    try {
      return JSON.parse(cached.payload) as T;
    } catch {
      // corrupt row — reload
    }
  }

  const value = await opts.load();
  if (opts.shouldCache ? opts.shouldCache(value) : true) {
    try {
      await ctx.runMutation(internal.cache.cachePut, {
        key,
        payload: JSON.stringify(value),
      });
    } catch (err) {
      console.warn(`Cache write failed for ${key}:`, String(err).slice(0, 160));
    }
  }

  return value;
}
