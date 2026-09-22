# Journal Notes + Local Dishes Implementation Plan (Enhanced)

> **Agent:** Fenrie 🐺 (for Evan / Mom'sDragonfly)
> **Enhanced sub-skills invoked:** writing-plans-enhanced (verification gates); implemented directly (no subagent handoff needed for this scope)
> **Verification mode:** Browser-observable + Test

**Goal:** (1) Let travellers write free-form notes into the Trip Journal — saved per device, shown in the day timeline, deletable — and (2) show a "Taste of the area" card on Explore with popular local dishes (name + warm one-line description + picture) for wherever the traveller is.

**Architecture:** Both features follow existing, proven app patterns.
- **Notes** mirror expenses: a device-scoped `journalNotes` table + `addJournalNote`/`deleteJournalNote` mutations + `journalNotesQuery`; UI merged into the existing day-grouped timeline in `JournalClient`.
- **Dishes** mirror `getHighlights`: a city-level cached action (`getLocalDishes`) using keyless Nominatim reverse-geocoding for the area name, Gemini (`GEMINI_MODEL`) for the dish list, a curated fallback dataset (Pretoria, Bangkok) when AI is unavailable, keyless Wikipedia REST thumbnails for pictures, and a `dishesCache` table (~7-day TTL).
- Pictures load from `upload.wikimedia.org` — CSP `img-src` updated in `next.config.js` + `vercel.json`.

**Anti-Gravity boundary:** Not applicable — no external agent collaboration in this plan.

---

## Task 1 — Backend: schema + notes CRUD + dishes cache

**Files:** `convex/schema.ts`, `convex/queries.ts`, `convex/mutations.ts`

1. Schema:
   - `journalNotes`: `{ deviceId, text, lat?, lng?, createdAt }`, index `by_deviceId_createdAt`.
   - `dishesCache`: `{ locKey, payload (JSON string), fetchedAt }`, index `by_locKey`.
2. `queries.ts`: `journalNotesQuery` (device-scoped, order desc). `getDishesCache` internalQuery (like `getHighlightsCache`).
3. `mutations.ts`: `addJournalNote` (trim, reject empty, cap 500 chars — `NOTE_MAX_LENGTH`), `deleteJournalNote` (ownership check like `deleteExpense`), `setDishesCache` internalMutation (upsert like `setHighlightsCache`).

### Verify Visual & Transform Claims

- [ ] **Transform claim:** `convex/schema.ts` contains both tables; mutations reject empty/oversize notes and cross-device deletes.
- [ ] **Verification method:** `pnpm typecheck` + convex-test suite additions (Task 5).
- [ ] **Verification result:** _(filled at execution)_

---

## Task 2 — Backend: `getLocalDishes` action + pure helpers

**Files:** `convex/actions.ts`, new `convex/dishHelpers.ts`

1. `dishHelpers.ts` (pure, no Convex imports — unit-testable):
   - `parseDishResponse(raw)` — parse strict JSON (tolerate fencing/backticks), validate items, cap at 8, → `DishItem[] | null`.
   - `fallbackDishes(areaName, country)` — curated 6-dish lists for Pretoria and Bangkok (accent-aware matching), else `[]`.
2. `getLocalDishes({ deviceId, lat, lng })` action:
   - `locKey` = lat/lng at 1 decimal (~11 km, city-level cell).
   - Cache hit if < `DISHES_TTL_MS` (7 days).
   - Area name via Nominatim reverse (zoom=10).
   - Dish list: Gemini JSON (if `GEMINI_API_KEY`) → fallback dataset → `[]`; only cache when non-empty.
   - Pictures: Wikipedia REST summary thumbnails in parallel; direct title → search fallback → `null`.
   - Never throws; degrades gracefully (same discipline as `geminiOCR`).

### Verify Visual & Transform Claims

- [ ] **Transform claim:** calling `getLocalDishes` for Pretoria/Bangkok returns 6 dishes each with an imageUrl where Wikipedia has art.
- [ ] **Verification method:** local `npx convex run` call against dev deployment + browser card render (Task 7).
- [ ] **Verification result:** _(filled at execution)_

---

## Task 3 — Lib: journal day-merge helper + quick position helper

**Files:** `src/lib/journal/stats.ts`, `src/lib/utils/geo.ts`

1. `mergeJournalDays(notes, points)` — union of note-days and pin-days, newest first; notes/pins sorted newest-first within a day.
2. `getQuickPosition(timeoutMs = 4000)` — promise-capped geolocation; resolves `null` on denial/timeout/SSR (used to optionally pin a note to the writer's position without blocking the save).

### Verify Visual & Transform Claims

- [ ] **Transform claim:** helpers export cleanly; unit tests cover merge ordering, empty sides, and the null-path of `getQuickPosition`.
- [ ] **Verification method:** `tests/unit/journal.test.ts` + `tests/unit/geo.test.ts` additions.
- [ ] **Verification result:** _(filled at execution)_

---

## Task 4 — UI: Journal composer + notes in the timeline

**Files:** `src/components/journal/JournalClient.tsx`

1. Composer section (above the standby hint): textarea (maxLength 500, char counter), "Save note" button, disabled while empty/saving; error surface on failure.
2. On save: `getQuickPosition()` → `addJournalNote` with optional `lat`/`lng`; clear textarea; note appears reactively in the timeline.
3. Day sections: notes render as orange-accented cards (text + time + "pinned" chip) above the pins list; trash button deletes (`deleteJournalNote`).
4. Day header shows `N notes · M pins · distance`; empty-state copy only when no pins **and** no notes.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** a saved note appears immediately in today's section; deleting it removes it; after reload it persists.
- [ ] **Verification method:** Browser session — add/delete/reload on the deployed site; screenshots/notes.
- [ ] **Verification result:** _(filled at execution)_

---

## Task 5 — UI: "Taste of the area" card on Explore + CSP

**Files:** new `src/components/explore/LocalDishesCard.tsx`, `src/app/(tabs)/explore/page.tsx`, `next.config.js`, `vercel.json`

1. Card: header "Taste of {areaName}" + list of dishes (56px rounded picture or 🍲 fallback, name, description). Hidden entirely when no dish data. Lazy image loading, `onError` → emoji fallback.
2. Explore: render `<LocalDishesCard lat={lat} lng={lng} />` after `HighlightsCard`, same location gating.
3. CSP: add `https://upload.wikimedia.org` to `img-src` in both `next.config.js` and `vercel.json`.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** with location stubbed to Pretoria/Bangkok, the card lists 6 dishes and at least one real image loads (naturalWidth > 0).
- [ ] **Verification method:** Browser — geolocation stub + DOM reads.
- [ ] **Verification result:** _(filled at execution)_

---

## Task 6 — Tests + docs

**Files:** `tests/unit/dishes.test.ts`, `tests/unit/journal.test.ts`, `tests/unit/geo.test.ts`, `convex-test/mutations.test.ts`, `AGENTS.md`

1. Unit: `parseDishResponse` (valid / fenced / garbage / cap / item validation), `fallbackDishes` (case/config matching), `mergeJournalDays`, `getQuickPosition` null-path.
2. Convex: notes CRUD (happy path, trim, empty reject, oversize reject, cross-device delete reject, per-device isolation).
3. AGENTS.md: record both features in Key Conventions; refresh test counts.

### Verify Visual & Transform Claims

- [ ] **Transform claim:** full suite green — `pnpm typecheck`, `pnpm test`, `pnpm test:convex`, `pnpm build`.
- [ ] **Verification method:** command output.
- [ ] **Verification result:** _(filled at execution)_

---

## Task 7 — Ship: branch → merge → deploy → verify prod

1. Branch `feat/journal-notes-and-dishes`; commits arrive there.
2. Deploy order: `npx convex deploy --yes` (schema + functions), then `npx vercel --prod --yes`.
3. Browser verify on `mom-s-dragonfly.vercel.app`: add/delete note (with and without location), reload persistence; dishes card with stubbed coordinates (Bangkok + Pretoria), image load check.
4. Merge to `main`, push.

### Verify Visual & Transform Claims

- [ ] **Visual claim:** both features observable on the production URL in a browser session.
- [ ] **Transform claim:** prod Convex deployment carries the new tables; prod bundle serves the new card.
- [ ] **Verification method:** browser DOM reads + deploy output.
- [ ] **Verification result:** _(filled at execution)_

---

## Bugs/risks noted during recon

- Local `.env.local` points at the stale dev deployment `different-squid-155` — local browser runs against it behave oddly (stale schema/functions). Verifications therefore run against the deployed site, not localhost.
- Convex-client error strings (e.g. `happy-otter-123.convex.cloud`) in bundles are library examples, not config.
- Gemini may be unavailable/unset → fallback dataset guarantees Pretoria/Bangkok demo value; other cities simply hide the card when empty.

---

## Execution Results (2026-09-22)

**Status: COMPLETE — shipped to production and verified in-browser.**

- **Task 1 (backend):** `journalNotes` + `dishesCache` deployed to prod Convex (indexes confirmed in deploy output). Convex tests 14/14 green.
- **Task 2 (getLocalDishes):** live smoke tests — Pretoria → 6 dishes (6/6 Wikipedia images); Bangkok → 6 dishes (6/6 images). ⚠️ Prod `GEMINI_API_KEY` is invalid ("API key not valid") → the curated fallback serves Pretoria/Bangkok; a fresh key unlocks every city.
- **Task 3 (lib helpers):** `mergeJournalDays` + `getQuickPosition` — unit tests green (102/102 total across 15 files).
- **Task 4 (journal UI):** verified live — note saved, pinned via geolocation, persisted across reload, deleted with confirm. ✅
- **Task 5 (dishes UI + CSP):** "Taste of Pretoria" and "Taste of Bangkok" cards verified live; images load (CSP now includes `upload.wikimedia.org` **and** `thumb.wikimedia.org` — Wikipedia serves thumbs from the latter now).
- **Task 6 (tests/docs):** typecheck + build green. AGENTS.md convention update pending (approval guard) — code comments + this document cover it meanwhile.
- **Task 7 (ship):** branch `feat/journal-notes-and-dishes` → `npx convex deploy` → `npx vercel --prod` (deployment `69k9po63d`, aliased) → prod browser verification → merge to main.

**Post-verify fixups discovered:** `thumb.wikimedia.org` CSP gap (caught by smoke test); Gemini error-body logging; Tom Yum naming for a truer Wikipedia image (affects future cache fills).