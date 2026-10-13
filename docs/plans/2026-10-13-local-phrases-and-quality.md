# Local Phrases + Quality Refactor Implementation Plan (Enhanced)

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Agent:** Fenrie 🐺 (for Evan / Mom'sDragonfly)
> **Enhanced sub-skills invoked:** writing-plans-enhanced (verification gates) + optional subagent-driven-development / surgical-implementation for execution
> **Verification mode:** Test + Transform + Visual + Browser-observable
> **Review basis:** two read-only review agents (backend + frontend) run 2026-10-13; the orchestrator spot-verified every finding this plan acts on (verification notes in the findings table; one subagent claim was refuted and dropped).

**Goal:** Add a location-based phrasebook to the Local tab — ten popular phrases in the local language, with pronunciation and English translation, cached per city cell — and land the highest-leverage correctness/quality fixes the final review found.

**Architecture:** Two workstreams sharing one extraction.
- **Quality first, behaviour-preserving:** collapse the three duplicated area-cache implementations (`highlightsCache`, `dishesCache`, `placeEnrichCache`) into one `cache` table with `cacheGet`/`cachePut`/`readThroughCache`, extract one `fetchWithTimeout`, and fix the POI cache's `deviceIds` leak/loss.
- **Then the feature rides the new primitives:** `convex/phraseHelpers.ts` (pure, unit-tested) + `getLocalPhrases` action + `phrasesCache` rows in the unified `cache` table + `PhrasebookCard` as a third "Phrases" segment in the Local tab — mirroring `getLocalDishes` / `LocalDishesCard` exactly.

**Spec:** this document is the spec (user request 2026-10-13 + the two review reports; evidence inline). Executors read it top to bottom before starting.

**Anti-Gravity boundary:** not applicable — no external agent collaboration. Both review subagents ran locally against this checkout; their briefs contained no `.env` contents, no user identity data, no unverified external URLs. Nothing in this plan leaves the machine.

---

## Global Constraints

- pnpm only. Strict TS. Import order is enforced by `simple-import-sort` — never hand-sort, autofix with `pnpm lint -- --fix`. `convex/_generated/` is never re-sorted and always committed.
- Every public Convex query/mutation/action calls `validateDeviceId(deviceId)` as its first statement. Public payloads never contain `deviceId` — allow-list fields explicitly (see `shareView`).
- All list reads are bounded by constants in `convex/limits.ts`; cache tables carry a `by_fetchedAt` index so retention can expire them.
- Actions never throw: degrade gracefully and `console.warn` with a `<Feature>:` prefix.
- Green at every commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:convex && pnpm build`.
- **One commit per phase.** Refactors land separately from the feature (review rule: never mix).
- Convex function **paths are file-based**: moving a registered function to a new file changes `api.actions.*` and breaks every client call site. This plan therefore extracts *helpers* out of `convex/actions.ts` (1065 lines) and keeps the registered functions where they are.
- **CI is currently dead** (GitHub account billing lock, verified 2026-10-13: every run fails at 4s with "job was not started"). Local gates are the only verification until the owner clears it. Do not wait on CI.
- `AGENTS.md` / `CLAUDE.md` are write-protected: they can only be updated with live user approval.

---

## Review findings this plan acts on (verified)

| ID | Sev | Location | Finding | Verified |
|----|-----|----------|---------|----------|
| F1 | Critical | `src/components/poi/POICard.tsx:36-50` | `div role="button" tabIndex={0}` wraps three real `<button>`s (`:95, :109, :122`) → axe `nested-interactive`, and the wrapper `onKeyDown` (`:46`) fires on bubbled Enter/Space, so activating "Verify" also opens the details sheet | ✅ read; children `stopPropagation` on click but **not** on keydown |
| F2 | Critical | `tests/e2e/a11y.spec.ts:4,12,22` | The only WCAG gate keeps `impact === "critical"` only; covers 5 of 8 routes (missing `/local`, `/journal`); never waits for Convex data | ✅ read |
| F3 | Critical | `src/components/explore/HighlightsCard.tsx:135` | `href={n.url}` renders a Brave-supplied URL with no scheme validation (`javascript:`/`data:` can reach the DOM) | ✅ read |
| B1 | Required | `convex/actions.ts:556-666,737-792,848-932`; `queries.ts:198-228`; `mutations.ts:311-356`; `schema.ts:60-80` | The area-cache pattern has 3–4 near-identical instances (read → TTL → JSON.parse → fetch → write; 3 tables, 3 readers, 3 writers); a 4th (phrases) is about to be written | ✅ read all three |
| B2 | Required | `convex/mutations.ts:48-66` | `upsertPOIs` sets `deviceIds: [deviceId]` on a **shared** POI row (index `by_deviceIds_category`), so device B's fetch removes the POI from device A's list; concurrent writers race | ✅ read (comment at `:56` admits the overwrite) |
| B3 | Required | `convex/queries.ts:13-28` | `poiQuery` returns raw docs including `deviceIds` — the credential `shareView` strips everywhere else | ✅ read |
| B4 | Required | `convex/queries.ts:204,215,226` | Cache readers use `.unique()`; a double insert on a cold key makes that cell permanently throw for every reader | ✅ read (`.`unique()` semantics confirmed in `_generated/ai/guidelines.md` usage) |
| B5 | Required | `convex/actions.ts` (8 sites), `wikiHelpers.ts:15-27`, `http.ts:40-72` | The `AbortController`+`setTimeout` dance is re-implemented 8× with inconsistent error handling; some call sites swallow failures entirely | ✅ sampled 4 sites |
| B6 | Required | `convex/queries.ts:41-51` | `historyQuery` takes an unbounded caller-supplied `limit` (client passes 1000) | ✅ read |
| B7 | Required | `convex/crons.ts`, `mutations.ts:358-383` | `highlightsCache`/`dishesCache`/`placeEnrichCache` have no retention purge (POIs and tickets do) | ✅ read |
| F4 | Required | `PlaceDetailsSheet.tsx:33-64`; `HighlightsCard.tsx:48-62`; `LocalDishesCard.tsx:59-71` | Three copies of round→`useAction`→`useEffect`+cancelled-flag; `PlaceDetailsSheet` has no cancelled guard → stale response writes state for the previous place | ✅ read LocalDishesCard + card shape |
| F5 | Optional | `ParticleCanvas.tsx:238-245` vs `:158-192` | DPR scaling mismatch: particles are positioned in CSS px but wrapped using device-px canvas size → wrap bounds ~dpr× too wide | not verified (inspect during phase) |

**Refuted by verification (do not act on):** subagent claim that `dragonflyPalette.amber` does not exist — it is defined at `src/lib/theme/dragonfly.ts:32` and used by the theme itself; `pnpm typecheck` passes. No change needed.

---

## Phase 0 — Make the failures visible and fix the two that are live

**Files:** `src/components/poi/POICard.tsx`, `tests/e2e/a11y.spec.ts`, `src/components/explore/HighlightsCard.tsx`, `src/lib/theme/dragonfly.ts` (caption tokens only if the gate demands it)

**Interfaces:** Produces: an a11y gate that fails on `critical` **and** `serious` violations across all 8 routes; a `POICard` whose "open details" affordance is not a nested-interactive wrapper; a `sanitiseHttpsUrl(url): string | null` helper (in `src/lib/utils/url.ts`) used by news links.

- [ ] **Step 1: Fix the nested-interactive card.** In `POICard.tsx`, replace the outer `div role="button" tabIndex={0}` with a real `<button type="button">` that owns only the "open details" affordance (keep the visual layout: `className="flex w-full items-center gap-3 text-left"`), move the three action buttons out of that element into a sibling container so they are no longer descendants, and delete the wrapper's manual `onKeyDown`. Keep `aria-label={`Details for ${poi.name}`}`.
- [ ] **Step 2: Sanitise news URLs.** New `src/lib/utils/url.ts`:
  ```ts
  /** Only http(s) links may reach the DOM. Returns null for anything else. */
  export function sanitiseHttpsUrl(raw: string): string | null {
    try {
      const url = new URL(raw);
      return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
      return null;
    }
  }
  ```
  Use it in `HighlightsCard.tsx:133-137`: skip results whose URL sanitises to `null` (filter before mapping, so `key={n.url}` stays stable).
- [ ] **Step 3: Widen the gate.** In `tests/e2e/a11y.spec.ts`, extend `PAGES` to `["/explore","/local","/journal","/budget","/reminders","/tickets","/settings"]` and change both assertions to:
  ```ts
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  expect(blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`)).toEqual([]);
  ```
  (Reporting ids/nodes makes failures actionable instead of a bare count.)
- [ ] **Step 4: Run it, and fix what it reveals.**
  `pnpm build && pnpm test:e2e -- a11y.spec.ts` (needs the local Convex backend: `PATH=/usr/bin:$PATH npx convex dev`).
  Expected first failure set: `nested-interactive` (should be fixed by Step 1) and `color-contrast` on caption tokens (`text-dragonfly-navy-500` ≈ 4.26:1, `text-dragonfly-navy-600` ≈ 3.0:1 on `bg-surface-900/70` over navy-950 — both under AA 4.5:1). Fix contrast by token, not by spot-patching components: lighten `navy-500`/`navy-600` in `tailwind.config.ts` + `src/lib/theme/dragonfly.ts` until the gate passes, then re-run.
- [ ] **Step 5: Commit.** `git commit -m "fix(a11y): real button for POI details, sanitise news links, gate on serious violations"`

### Verify Visual & Transform Claims

- [ ] **Visual claim:** pressing Enter on "Verify" verifies the POI **without** opening the details sheet; `/local` and `/journal` appear in the passing a11y run; caption text is visibly lighter where it was below AA.
- [ ] **Transform claim:** `tests/e2e/a11y.spec.ts` asserts on `critical|serious` across 7 routes; no `nested-interactive` or `color-contrast` violations remain.
- [ ] **Verification method:** `pnpm build && pnpm test:e2e -- a11y.spec.ts` output + a browser pass on `/explore` (keyboard: Tab to a POI, Enter on Verify).
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 1 — Backend: one cache primitive (kills B1, B4, B7-writer half)

**Files:** `convex/schema.ts`, new `convex/cache.ts`, `convex/queries.ts`, `convex/mutations.ts`, `convex/actions.ts`

**Interfaces:**
- Produces: `cacheKey(kind, key)`, `cacheGet(ctx, key)`, `cachePut(ctx, key, payload)`, `readThroughCache<T>(ctx, { kind, key, ttlMs, load })`.
- Consumed by: `getHighlights` (TTL 30 min), `getLocalDishes` (7 d), `getPlaceDetails` (30 d), `getLocalPhrases` (Phase 5, 30 d).

- [ ] **Step 1 (schema):** add the unified table and its retention index; keep the three legacy tables defined for this release:
  ```ts
  cache: defineTable({
    key: v.string(),        // "<kind>:<locKey|placeKey>"
    payload: v.string(),    // JSON
    fetchedAt: v.number(),
  }).index("by_key", ["key"]).index("by_fetchedAt", ["fetchedAt"]),
  ```
- [ ] **Step 2 (cache.ts):** new module, **no `"use node"`** (keeps it unit-testable). Complete implementation:
  ```ts
  import { v } from "convex/values";

  import { internal } from "./_generated/api";
  import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
  import { internalMutation, internalQuery } from "./_generated/server";

  export type CacheKind = "highlights" | "dishes" | "placeEnrich" | "phrases";

  /** Namespaced cache key: "<kind>:<locKey|placeKey>". */
  export const cacheKey = (kind: CacheKind, key: string) => `${kind}:${key}`;

  /** Round a coordinate pair into a cache cell, e.g. cellKey(13.7563, 100.5018, 1) → "13.8,100.5". */
  export const cellKey = (lat: number, lng: number, decimals: number) =>
    `${lat.toFixed(decimals)},${lng.toFixed(decimals)}`;

  /** Newest row for a key. `take(1)` on purpose: a cold-key double insert must
   *  never poison the read path the way `.unique()` would (review B4). */
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
    handler: (ctx, { key }) => readCacheRow(ctx, key),
  });

  export const cachePut = internalMutation({
    args: { key: v.string(), payload: v.string() },
    handler: (ctx, { key, payload }) => writeCacheRow(ctx, key, payload),
  });

  /**
   * Read-through cache for actions: fresh hit → return immediately; otherwise
   * run `load()` and persist its result when `shouldCache` allows (default: always).
   * Never throws on a corrupt row — falls through and reloads.
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
        // corrupt row — fall through and reload
      }
    }
    const value = await opts.load();
    if (opts.shouldCache ? opts.shouldCache(value) : true) {
      await ctx.runMutation(internal.cache.cachePut, {
        key,
        payload: JSON.stringify(value),
      });
    }
    return value;
  }
  ```
  Call sites pass the per-feature TTL (`HIGHLIGHTS_TTL_MS` 30 min, `DISHES_TTL_MS` 7 d, `PLACE_ENRICH_TTL_MS` 30 d, phrases 30 d) and the existing "only cache when it has content" rule via `shouldCache`.
- [ ] **Step 3:** rewrite the three actions to `readThroughCache` (delete their local read/TTL/parse/write blocks; keep the TTL constants at the call sites; rename `locKey` construction to the shared `cellKey(lat, lng, decimals)` helper added in the same module — highlights uses 2 dp, dishes/phrases 1 dp).
- [ ] **Step 4 (convex-test):** new `convex-test/cache.test.ts` — cache miss → load runs → row written; cache hit within TTL → load **not** called; expired row → reload; `cacheGet` returns the newest when duplicates exist (insert two rows manually).
- [ ] **Step 5: prove no behaviour change.** `pnpm typecheck && pnpm test:convex && pnpm test && pnpm build`.
- [ ] **Step 6: Commit** (`refactor(convex): single cache table + readThroughCache`). Deploy + drop the legacy tables only after Phase 5 ships (their rows must be deleted before the table definitions can be removed from the schema — Convex rejects dropping a non-empty table). Add a one-off `internalMutation purgeLegacyCaches` in Phase 7 to clear them.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** Highlights and the dishes card still render identically on the Local tab (same content, no loading flicker regression).
- [ ] **Transform claim:** `convex/cache.ts` exists; the three legacy `get*Cache`/`set*Cache` functions have no callers left in `actions.ts`; new rows land in `cache` with `key` prefixed by kind.
- [ ] **Verification method:** `pnpm test:convex` output; local backend browser run against `pnpm dev` + `npx convex dev`; inspect rows in the Convex dashboard.
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 2 — Backend: one fetch boundary (B5)

**Files:** new `convex/fetchWithTimeout.ts`, `convex/actions.ts`, `convex/wikiHelpers.ts`, `convex/http.ts`

**Interfaces:** Produces `fetchWithTimeout(url, init & { timeoutMs }): Promise<Response>` (single AbortController + `finally clearTimeout`, throws `HttpError` carrying `status`), and `readJson<T>(res): Promise<T | null>`.

- [ ] **Step 1:** add the helper with an inline unit-testable predicate `isRetryable(status)`.
- [ ] **Step 2:** replace all 8 hand-rolled copies (`actions.ts` `fetchGooglePlaces`, Brave, `geminiOCR`, `fetchJson`, `generateDishesWithGemini`, `fetchGooglePlaceDetails`; `wikiHelpers.fetchWikiJson`; `http.ts`'s route). Delete the pass-through `try/catch` re-throw in `fetchGooglePlaces`.
- [ ] **Step 3:** make the "all upstreams failed" outcome explicit for POI fetches: return a discriminated union `{ ok: true, pois: PoiInput[] } | { ok: false, reason: "google" | "overpass" | "both" }` and update the client check in `src/app/(tabs)/explore/page.tsx:81-91` (currently guesses with `result?.mock === true || result?.count === 0`).
- [ ] **Step 4:** keep every existing `console.warn` prefix; add the missing ones (`fetchWikiJson` failure reason, cache-write failures in `getPlaceDetails`).
- [ ] **Step 5:** `pnpm typecheck && pnpm test && pnpm test:convex && pnpm build` — then commit.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** Explore still lists POIs for a city; with both upstreams stubbed to fail, the UI shows the explicit "couldn't reach the place services" state instead of an empty list.
- [ ] **Transform claim:** `grep -c "new AbortController" convex/` drops from 8 to 1.
- [ ] **Verification method:** grep count + browser run with a stubbed failure (temporarily unset `GOOGLE_PLACES_API_KEY`, Overpass blocked).
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 3 — Backend: POI cache boundary (B2, B3) — **decision point**

**Files:** `convex/schema.ts`, `convex/queries.ts`, `convex/mutations.ts`

**Decision (recommended default, confirm with owner before implementing):** the POI cache is public place data with no auth, so make it **global** — drop `deviceIds` from `pois` and the `by_deviceIds_category` index; read by `by_fetchedAt` + category. This deletes the cross-device loss bug and the `deviceId` leak in one move. *Alternative if per-device scoping is a product requirement:* keep the field but union it (`Array.from(new Set([...existing.deviceIds, deviceId]))`), bound it, and still allow-list the `poiQuery` projection (`deviceIds` must never be returned).

- [ ] **Step 1:** migrate the schema + `poiQuery`/`recentFetchCheck`/`upsertPOIs` accordingly; allow-list the returned fields (`placeId, source, name, category, lat, lng, address, rating, phone, openNow, verifiedCount`).
- [ ] **Step 2:** fix `verifyPOI`'s membership check (`mutations.ts:393`) — without auth it proves nothing; either drop it or count increments unconditionally (decide with the owner).
- [ ] **Step 3:** convex-test: two different devices fetching the same place must both see it afterwards; assert `deviceIds` never appears in a `poiQuery` payload.
- [ ] **Step 4:** `pnpm test:convex && pnpm typecheck` — commit.

### Verify Visual & Transform Claims

- [ ] **Transform claim:** a `poiQuery` response has no `deviceIds` key; device B's fetch no longer removes device A's POI.
- [ ] **Verification method:** `pnpm test:convex` output (new test names in the log).
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 4 — Frontend: the missing canonical fetch hook (F4)

**Files:** new `src/hooks/useActionData.ts`; port `HighlightsCard.tsx`, `LocalDishesCard.tsx`, `PlaceDetailsSheet.tsx`

**Interfaces:** `useActionData<Args, Result>(action, args | null, { roundTo?: number })` → `{ data: Result | null; loading: boolean; failed: boolean; reload(): void }` (internally: `getDeviceId()` at call time, lat/lng rounding, cancellation + stale-response guard).

- [ ] **Step 1:** write the hook with the cancelled-flag pattern the cards already use, plus an `argsKey` guard so a late response for old coordinates is dropped (this is the `PlaceDetailsSheet` fix).
- [ ] **Step 2:** port all three cards; delete their local rounding/`useEffect`/`console.warn` blocks. `LocalDishesCard` and `HighlightsCard` keep their "hide quietly when empty" behaviour.
- [ ] **Step 3:** unit test the hook with a fake action: resolves → data set; resolves late after an args change → ignored; rejects → `failed: true`, no throw.
- [ ] **Step 4:** `pnpm test && pnpm typecheck` — commit.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** switching POIs quickly in the details sheet shows the *new* place's photos only (no flicker of the previous place's data).
- [ ] **Transform claim:** three duplicated fetch blocks gone; only `useActionData` calls `useAction` for these cards.
- [ ] **Verification method:** unit test output + browser run on `/explore` tapping two POIs in a row.
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 5 — Feature: the phrasebook backend

**Files:** new `convex/phraseHelpers.ts`, `convex/actions.ts` (`getLocalPhrases`), `convex/schema.ts` (nothing new — `cache` covers it), `convex/limits.ts` (`MAX_PHRASES = 10`)

**Interfaces:**
- `PhraseItem { local: string; roman: string; english: string; note: string }`
- `PhrasesPayload { areaName: string | null; language: string | null; phrases: PhraseItem[]; fetchedAt: number }`
- Produces: `parsePhraseResponse(raw): PhraseItem[] | null`, `fallbackPhrases(areaName, country): { language: string | null; phrases: PhraseItem[] }`, and `api.actions.getLocalPhrases({ deviceId, lat, lng })`.
- Consumed by: `PhrasebookCard` (Phase 6).

- [ ] **Step 1 (helpers, TDD):** `phraseHelpers.ts` mirrors `dishHelpers.ts` — tolerant parse (strip ```json fences, take the first `[`…last `]`, validate all four fields non-empty, cap at `MAX_PHRASES`), and curated fallbacks. Curated data (verbatim, both languages; matching is case-insensitive substring on `areaName + country`):
  - **Afrikaans** (matches `pretoria|tshwane|johannesburg|south africa`):
    `Hallo`/"Hallo"/Hello/"Any time of day"; `Goeie môre`/"GOO-ee-uh MORE-uh"/Good morning/"Before ~11:00"; `Dankie`/"DUNK-ee"/Thank you/"The one you'll use most"; `Asseblief`/"AH-suh-bleef"/Please/"Also 'you're welcome'"; `Totsiens`/"TOT-seens"/Goodbye/"On leaving"; `Verskoon my`/"fer-SKOHN may"/Excuse me/"Getting attention or passing through"; `Hoe gaan dit?`/"hoo KHAN dit"/How are you?/"Friendly greeting"; `Ek verstaan nie`/"ek fer-STAHN nee"/I don't understand/"When it's too fast"; `Praat jy Engels?`/"praht yay ENG-uls"/Do you speak English?/"Ask before switching"; `Hoeveel kos dit?`/"HOO-fel kos dit"/How much does this cost?/"Markets and taxis".
  - **Thai** (matches `bangkok|thailand|chiang mai|phuket|pattaya`):
    `สวัสดี`/"sà-wàt-dee"/Hello/"Works any time of day"; `ขอบคุณ`/"khàawp-khun"/Thank you/"Add 'khráp'/'khâ' for politeness"; `ขอโทษ`/"khǎaw-thôot"/Sorry, excuse me/"Apologies or getting attention"; `ใช่`/"châi"/Yes/"Confirming"; `ไม่`/"mâi"/No/"Declining"; `ไม่เป็นไร`/"mâi bpen rai"/It's okay, no worries/"The all-purpose reply"; `เท่าไหร่`/"thâo-rài"/How much is it?/"Street food and markets"; `แพงไป`/"phaeng bpai"/Too expensive/"Gentle bargaining"; `ไม่เข้าใจ`/"mâi khâo-jai"/I don't understand/"When Thai comes fast"; `พูดภาษาอังกฤษได้ไหม`/"phûut phaa-sǎa ang-grìt dâi mǎi"/Do you speak English?/"Ask before switching".
  - Unknown area → `{ language: null, phrases: [] }` (card hides itself).
- [ ] **Step 2 (tests first):** `tests/unit/phrases.test.ts` — clean JSON; fenced JSON with prose; garbage → null; invalid entries skipped; cap at 10; both fallback matchers; unknown area → `[]`.
- [ ] **Step 3 (action):** `getLocalPhrases` in `convex/actions.ts`, identical shape to `getLocalDishes`: `validateDeviceId` → 30-day `readThroughCache({ kind: "phrases", key: cellKey(lat, lng, 1) })` → Nominatim reverse (`zoom=10`, polite UA) for `areaName`/`country` → Gemini prompt (below) → fallback → cache only when `phrases.length > 0`. Gemini prompt (exact):
  ```
  List the 10 most useful everyday phrases for a traveller to ${areaName}${country ? `, ${country}` : ""}.
  Use the language locals actually speak there. Reply with ONLY a JSON object
  {"language":"<language name in English>","phrases":[{"local":"<local script>","roman":"<pronunciation>","english":"<English>","note":"<when to use it, max 8 words>"}]}
  — ten entries, no prose, no markdown fences.
  ```
  Parse with `parsePhraseResponse`; on failure or empty, use `fallbackPhrases`.
- [ ] **Step 4:** `pnpm test && pnpm typecheck && pnpm test:convex` — commit.

### Verify Visual & Transform Claims

- [ ] **Transform claim:** `npx convex run actions:getLocalPhrases '{"deviceId":"test-device","lat":-25.75,"lng":28.19}'` returns 10 Afrikaans phrases (fallback path, no Gemini key needed) and `"lat":13.75,"lng":100.5` returns 10 Thai phrases; a second call is served from the `cache` row (`fetchedAt` unchanged).
- [ ] **Visual claim:** n/a (no UI yet).
- [ ] **Verification method:** `npx convex run` output for both coordinates + a `cache` row dump.
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 6 — Feature: PhrasebookCard + the "Phrases" segment

**Files:** new `src/components/local/PhrasebookCard.tsx`; `src/components/local/LocalClient.tsx`; `src/components/ui/Icon.tsx`; `tests/e2e/a11y.spec.ts` already covers `/local` after Phase 0

**Interfaces:** consumes `api.actions.getLocalPhrases` via `useActionData` (Phase 4).

- [ ] **Step 1:** add a `message` (speech-bubble) icon to `Icon.tsx` (`<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.6-.7L3 21l1.8-5.4A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" />` style, matching the existing 24px stroke icons).
- [ ] **Step 2:** `PhrasebookCard.tsx` — twin of `LocalDishesCard`:
  - Header: `<Icon name="message" …/>` + `Phrases of {areaName ?? "the area"}`; subtitle `Popular {language} phrases with English translations` (omit the language word when null).
  - List: one row per phrase — `local` (larger, `font-semibold`, `lang` attribute), `roman` (italic caption), `english` (body), `note` (caption, muted); each row has a copy button (`aria-label={`Copy "${phrase.english}"`}`) that calls `copyText(phrase.local)` and toasts via `useToast()` (`{ message: "Phrase copied", type: "success" }`) and briefly swaps the icon to `check`.
  - Hide entirely when `!data || data.phrases.length === 0`; `aria-label="Popular local phrases"` on the section; `<ol>` for the ten items (it reads as a numbered list).
- [ ] **Step 3:** `LocalClient.tsx` — extend `LocalSegment` with `"phrases"`, add `{ id: "phrases", label: "Phrases" }` to `SEGMENTS`, extend `isSegment`, and render `<PhrasebookCard lat={lat} lng={lng} />` in the third branch of the tab panel. (The existing `mdf_local_segment` persistence and geolocation gating need no change.)
- [ ] **Step 4:** `pnpm lint -- --fix && pnpm typecheck && pnpm build && pnpm test` — commit.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** on `/local`, the third segment "Phrases" shows ten rows (local script, pronunciation, English, note); tapping a row's copy button shows the toast and the check icon; with the location stubbed to Pretoria the Afrikaans list renders; unknown area (e.g. Paris with the fallback path) hides the card instead of showing an empty box.
- [ ] **Transform claim:** clipboard contains the local-script phrase after the copy tap (browser `navigator.clipboard.readText()` in the Playwright/eval probe).
- [ ] **Verification method:** browser session (geolocation stub) + DOM reads; add one Playwright spec (`tests/e2e/phrases.spec.ts`) asserting segment visibility and ten `<li>` rows.
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 7 — Bounds & retention (B6, B7)

**Files:** `convex/limits.ts`, `convex/queries.ts`, `convex/mutations.ts`, `convex/crons.ts`, `convex/schema.ts`

- [ ] **Step 1:** `MAX_LOCATION_POINTS = 1000` in `limits.ts`; clamp `historyQuery` (`Math.min(limit, MAX_LOCATION_POINTS)`), keeping the argument for compatibility.
- [ ] **Step 2:** `purgeStaleCache` internal mutation: delete `cache` rows with `fetchedAt` older than 90 days via `by_fetchedAt`, **and** de-duplicate keys sharing a `key` (keep newest). Extend the hourly `purge-poi-cache` cron (or add a daily one) to call it.
- [ ] **Step 3:** `purgeLegacyCaches` one-off internal mutation: delete all rows from the three legacy tables, so their definitions can be removed from `schema.ts` in a follow-up deploy (they must be empty first — Convex rejects dropping a non-empty table).
- [ ] **Step 4 (owner decision, do not decide alone):** `locationHistory` is the traveller's trip record — this plan does **not** purge it. Record the growth risk in `docs/recommendations.md` and defer an age-based retention policy to a product decision.
- [ ] **Step 5:** `pnpm test:convex && pnpm typecheck` — commit.

### Verify Visual & Transform Claims

- [ ] **Transform claim:** a `cache` row with a 91-day-old `fetchedAt` is deleted by the purge; two duplicate `key` rows collapse to the newest; `historyQuery` with `limit: 999999` returns at most 1000 rows.
- [ ] **Verification method:** `pnpm test:convex` (new tests) + a local `npx convex run mutations:purgeStaleCache` against seeded rows.
- [ ] **Verification result:** _(filled at execution)_

---

## Phase 8 — Verification pass, docs, ship

- [ ] **Step 1 (enhanced verification pass):** run the whole matrix and record real output in this file:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:convex && pnpm build && pnpm test:e2e` (backend up for e2e) — plus `pnpm test:lhci -- --collect.settings.chromeFlags=--no-sandbox` (accessibility gate ≥ 0.95 is the enforced one; performance is advisory).
- [ ] **Step 2 (docs):** update `AGENTS.md` Key Conventions (phrasebook: `getLocalPhrases`, `phraseHelpers.ts`, unified `cache` table + `readThroughCache`, `fetchWithTimeout`) and the test counts. **Requires live user approval** — the file is write-protected; if approval isn't available, record the change in `docs/recommendations.md` instead and note it here. Also add the findings this plan defers to `docs/recommendations.md`.
- [ ] **Step 3 (ship):** branch `feat/local-phrases-quality`; deploy in order — `pnpm deploy:prod` (Convex, pins `prod:rare-alpaca-711`) then `npx vercel --prod --yes`; browser-verify on `mom-s-dragonfly.vercel.app` (Phrases segment, both fallback languages, copy button); then merge to `main` and push.
- [ ] **Step 4:** confirm the Vercel deployment is Ready (`npx vercel ls`) — a failed git build silently leaves the previous build live.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** the phrasebook is live in production for both fallback areas and hides cleanly for an unknown area.
- [ ] **Transform claim:** production Convex carries the `cache` table + `getLocalPhrases`; all counts in this document are the ones the commands above printed.
- [ ] **Verification method:** production URL in a browser + `npx vercel ls` + the pasted command outputs.
- [ ] **Verification result:** _(filled at execution)_

---

## Queue — reviewed, deliberately not in this plan

Correctness/quality items found but out of scope here (move to `docs/recommendations.md` when Phase 8 runs):

| Item | Why deferred |
|---|---|
| `sendDueReminders` N+1 prefs lookups + duplicated row types (`actions.ts:942-990`) | separate change; needs its own test |
| `markReminderSent` ignores `repeat` — daily/weekly reminders fire once (`schema.ts:113`, `actions.ts:948`) | product decision: implement rescheduling or delete the field |
| `rekeyDevice` truncates with hardcoded `.take(1000)`/`.take(100)` (`mutations.ts:231-288`) | silent data-loss risk on identity reset — fix in its own phase with pagination |
| Three POI actions skip `validateDeviceId` (`actions.ts:117,237,332`) | one-line each; fold into the Phase 2 commit if convenient |
| Unchecked casts on external JSON (`actions.ts:584-641`) | fold into Phase 2 where the same lines are touched |
| Modal primitive: `ConfirmDialog`/`TicketDetailSheet`/`PlaceDetailsSheet`/`RideSheet` lack focus trap/Escape/focus restore, hardcoded ids (F6) | largest frontend refactor; needs its own plan |
| `getDeviceId()` during render in page components; no cached `useDeviceId()`/`usePrefs()` (F7) | touches 8 files; do after Phase 4 |
| Ad-hoc localStorage keys; unguarded `getItem` in Safari private mode (F8) | same family as F7 |
| `JournalClient.tsx` (469 lines) split into hook + 3 components (F9) | pure structure; no behaviour change; own commit |
| Explore refetch-on-move (`fetchedRef` never invalidated) + boolean lat/lng checks (F4b) | needs a geohash-cell keying decision |
| Tickets pipeline robustness (no `.catch` on enrichment IIFE, array-identity deps) | deserves a focused offline-behaviour test first |
| `ParticleCanvas` DPR mismatch; overlay loop pauses; particle count on mobile (F5, F10) | visual/perf polish; measure first |
| Dead code: `IntroVideo.tsx`, `DragonflyBackground.tsx` (+its test), unused `Skeleton` exports, orphaned theme/currency exports, `tests/e2e/debug.spec.ts` (F13) | ask-before-delete per review policy; one small commit |
| `amount`/`amber` palette check — **refuted**, no action | verified false |

---

## Execution Handoff

After this plan is approved, implement task-by-task with either:

1. **Subagent-Driven (recommended)** — a fresh subagent per phase, two-stage review between phases (`superpowers:subagent-driven-development`). Before accepting any subagent deliverable: check `git show --stat HEAD` for stray workspace artifacts, and re-run the phase's own verification commands yourself — a subagent's "done" is a claim, not evidence.
2. **Inline Execution** — execute the phases in this session with `superpowers:executing-plans` and checkpoints.

Either way: **phases land as separate commits**, refactors before the feature, and the Phase 8 verification pass runs against real artifacts (command output, browser state, clipboard contents) before anything is called done.
