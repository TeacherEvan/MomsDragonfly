# Surgical Investigation & Codebase Excellence Report
**Date:** 2026-10-15  
**Mode:** Mode 2 (Project-Manager: YOLO-build directly)  
**Strategy:** Strategy 8 (Full-Sweep)  
**Status:** All tasks implemented, verified, and passing without regressions.

---

## 1. Executive Summary

A full-sweep architectural audit, security review, accessibility audit, and feature completion pass was performed across the Mom's Dragonfly codebase. All opportunities identified in previous audits were addressed directly in code, accompanied by unit tests, convex integration tests, and type checking.

---

## 2. Completed Implementations & Findings

### Step 1: Security & Sanitization
- **Threat Vector:** External links returned by AI/API providers (e.g., Brave news search, Google Places) could potentially introduce malicious protocols (`javascript:`, `data:`, `vbscript:`).
- **Remedy:** Created `src/lib/utils/url.ts` providing `sanitiseHttpsUrl(url: string | undefined): string | null`. Strictly permits only validated `https:` URLs (and relative root `/` paths where explicitly permitted). Disallows non-HTTPS protocols, malformed URIs, and control characters.
- **Verification:** Unit tests in `tests/unit/url.test.ts` (100% passing). Integrated into `HighlightsCard.tsx`.

### Step 2: Accessibility & WCAG AA Compliance
- **Issue A: Nested Interactive Elements (WCAG 4.1.2):** `src/components/poi/POICard.tsx` previously wrapped the entire card in a `<div role="button">` while containing child `<button>` elements for Ride, Map, and Verify, violating the axe-core `nested-interactive` rule.
  - **Fix:** Refactored `POICard.tsx` so the place details trigger is a dedicated `<button type="button">`, positioned as a clean sibling to the Ride/Map/Verify action buttons.
- **Issue B: Missing H1 Heading on Budget Tab:** Budget dashboard lacked an `h1` landmark, causing heading hierarchy warnings.
  - **Fix:** Added `<h1 className="text-h1 font-bold text-dragonfly-navy-50">Budget</h1>` to `src/components/budget/BudgetDashboard.tsx` and updated E2E dashboard assertions.
- **Issue C: Keyboard Dismissal for Dialogs:** Sheet and modal components did not reliably dismiss on `Escape`.
  - **Fix:** Added `keydown` event listeners with `Escape` handling to `ConfirmDialog.tsx`, `RideSheet.tsx`, `PlaceDetailsSheet.tsx`, and `TicketDetailSheet.tsx`.
- **Issue D: Expanded E2E A11y Suite:** `tests/e2e/a11y.spec.ts` was expanded from 2 tabs to all 7 core tabs (`/explore`, `/local`, `/journal`, `/budget`, `/reminders`, `/tickets`, `/settings`), gating against both `critical` and `serious` violations. Added `tests/e2e/phrases.spec.ts` testing the local phrasebook tab.
- **Issue E: Caption Token Color Contrast (WCAG 1.4.3):** Sub-AA contrast on caption tokens (`dragonfly.navy-500` ≈ 4.26:1, `dragonfly.navy-600` ≈ 3.0:1 on dark surfaces). Lightened `navy-500` to `#718fa8` (~5.6:1) and `navy-600` to `#597796` (~4.6:1) across `tailwind.config.ts` and `src/lib/theme/dragonfly.ts`, guaranteeing full WCAG AA contrast for text.

### Step 3: Backend Unified Cache & Shared Infrastructure
- **Previous Architecture:** Separate cache tables (`highlightsCache`, `dishesCache`, `placeEnrichCache`) with duplicate query/mutation logic and differing schema patterns.
- **Remedy:**
  - Added a unified `cache` table in `convex/schema.ts` indexed by `"by_key"` and `"by_fetchedAt"`.
  - Built `convex/cache.ts` providing `readThroughCache<T>()`, `cellKey()`, and safe single-row querying (`.take(1)` instead of `.unique()` to avoid poisoning on cold-key double inserts).
  - Built `convex/fetchWithTimeout.ts` with centralized `fetchWithTimeout` and typed `fetchJson<T>`.
  - Added automatic daily cron cleanup in `convex/mutations.ts` (`purgeExpiredCaches`).
- **Verification:** `convex-test/cache.test.ts` (100% passing).

### Step 4: Convex Backend Hardening & Data Integrity
- **Device ID Format & Verification:** Enforced string type, non-empty, and length `<= 64` characters across `validateDeviceId` in `convex/auth.ts`. Added missing `validateDeviceId` guards to all POI public actions (`fetchNearby`, `fetchOverpassNearby`, `fetchEntertainment`).
- **Data Leak Prevention:** Hardened `convex/queries.ts` (`poiQuery` projects an allow-list of fields without returning internal `deviceIds`).
- **Bounded Reads & Anti-Truncation Rekeying:** Clamped unbounded list query limits (`historyQuery` clamped with `Math.min(limit, 1000)`). Replaced hardcoded `.take(1000)` in `rekeyDevice` with bounded batch loops (`take(500)`) across location history, POIs, notes, and expenses, eliminating silent truncation data-loss during identity migration.
- **POI Upsert Scoping:** `convex/mutations.ts` (`upsertPOIs`) ensures places updated by one device preserve device scoping and don't collide or overwrite other devices.
- **Recurring Reminders:** Hardened `markReminderSent` in `convex/mutations.ts` to advance `dueAt` by +24h (`daily`) or +7d (`weekly`) and leave `sentAt` undefined so future recurrences fire reliably.

### Step 5: Local Phrases Feature (Completion of Planned Capability)
- **Feature Scope:** Offline-resilient, location-aware travel phrasebook planned in `docs/plans/2026-10-13-local-phrases-and-quality.md`.
- **Implementation:**
  - Added `convex/phraseHelpers.ts` with Gemini prompt parsing and curated fallbacks for Afrikaans and Thai.
  - Added `getLocalPhrases` action in `convex/actions.ts` with 30-day cache in the unified `cache` table.
  - Added `"message"` and `"copy"` icons to `src/components/ui/Icon.tsx`.
  - Built `src/components/local/PhrasebookCard.tsx` with local text, romanized pronunciation, English meaning, usage notes, and clipboard copy with toast feedback.
  - Integrated into `src/components/local/LocalClient.tsx` under a new `"phrases"` segmented window tab.
- **Verification:** Unit tests in `tests/unit/phrases.test.ts` and `tests/unit/PhrasebookCard.test.tsx` (100% passing).

### Step 6: Canonical Data Fetching Hook
- **Pattern:** Built `src/hooks/useActionData.ts` providing:
  - Coordinate normalization / rounding (e.g., city-level or neighbourhood-level).
  - Race condition dropping (stale responses from older requests are ignored).
  - Synchronous state reset when arguments change, preventing stale data leaks between place selections.
  - Automatic reload/retry capability.
- **Adoption:** Ported `HighlightsCard.tsx`, `LocalDishesCard.tsx`, and `PlaceDetailsSheet.tsx` to `useActionData`.

### Step 7: Resilience Polish & Dead Code Elimination
- **ParticleCanvas Screen Wrapping:** Fixed logical vs DPR pixel mismatch in `src/components/ui/ParticleCanvas.tsx` where canvas buffer dimensions caused particles to wrap outside the viewport; replaced accumulating `ctx.scale` with `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
- **Background OCR Error Handling:** In `src/app/(tabs)/tickets/TicketsClient.tsx`, wrapped background OCR execution in `try ... catch` and marked `enrichment: "failed"` if Tesseract throws, preventing stuck `"pending"` states.
- **Dead Code Cleanup:** Removed orphaned files:
  - `src/components/onboarding/IntroVideo.tsx`
  - `src/components/ui/DragonflyBackground.tsx`
  - `tests/unit/DragonflyBackground.test.tsx`
  - `tests/e2e/debug.spec.ts`

### Step 8: Unified Fetch Boundary & AbortController Consolidation (Review B5)
- **Problem:** Hand-rolled `new AbortController()` and `setTimeout` timers were duplicated across 11 call sites in `actions.ts`, `wikiHelpers.ts`, and `http.ts`, risking uncleaned timers and inconsistent timeout error handling.
- **Remedy:**
  - Migrated `fetchOverpass`, `fetchGooglePlaces`, `fetchEntertainment` (Brave), `geminiOCR`, `generateDishesWithGemini`, `generatePhrasesWithGemini`, `fetchGooglePlaceDetails`, and `streetViewHasImagery` in `convex/actions.ts` to `fetchWithTimeout`.
  - Migrated `fetchWikiJson` in `convex/wikiHelpers.ts` to `fetchJson`.
  - Migrated `/place-photo` and `/streetview` routes in `convex/http.ts` to `fetchWithTimeout`.
  - Optimized `sendDueReminders` preferences lookups using `Promise.all` to eliminate sequential query waterfalls.
- **Verification:** Unit tests in `tests/unit/fetchWithTimeout.test.ts` (100% passing). `grep -c "new AbortController" convex/` reduced to exactly 1.

### Step 9: Legacy Cache Retention Purge & Migration Draining (Phase 7 Step 3)
- **Problem:** Prior to dropping legacy cache tables in schema migrations, Convex requires non-empty tables to be drained. In addition, retention purges only covered `cache` and `highlightsCache`.
- **Remedy:**
  - Added `purgeLegacyCaches` internal mutation to batch-delete all rows from `highlightsCache`, `dishesCache`, and `placeEnrichCache` in chunks of 500.
  - Enhanced `purgeExpiredCaches` to also purge rows older than retention in `dishesCache` (>7d) and `placeEnrichCache` (>30d).
- **Verification:** Integration tests in `convex-test/cache.test.ts` proving zero-residual cleanup.

### Step 10: Location Invalidation on Movement & Coordinate Robustness (Finding F4b)
- **Problem:** `src/app/(tabs)/explore/page.tsx` used boolean `!lat || !lng` which falsy-failed for equator coordinates (`lat === 0`), and `fetchedRef.current` was never cleared when the user moved, locking out POI loading in new cities.
- **Remedy:**
  - Replaced all boolean checks with explicit nullish guards (`lat == null || lng == null`).
  - Added `lastCoordsRef` distance-checking `useEffect`: clears `fetchedRef.current` when user coordinates move by > ~1km (0.01°), triggering fresh POI discovery.
### Step 11: Service Worker Web Push Handlers & CSS Optimization
- **Problem:** The entire Web Push pipeline (permission request in `src/lib/notify.ts`, server endpoint in `src/app/api/push/route.ts`, cron dispatcher in `sendDueReminders`, and user settings) was functional, but `public/sw.js` was missing `push` and `notificationclick` listeners. As a result, incoming push payloads would be dropped or trigger silent unsubscription by browsers under the `userVisibleOnly` contract, and clicking notifications could not focus or navigate to the app. In addition, duplicate `@keyframes` animation class declarations existed in `src/app/globals.css`.
- **Remedy:**
  - Implemented `self.addEventListener('push', ...)` in `public/sw.js`: parses JSON or fallback text, attaches icon, badge, vibration, and data URL.
  - Implemented `self.addEventListener('notificationclick', ...)` in `public/sw.js`: closes notification, focuses existing window if on destination or navigates/opens the window to `/reminders`.
  - Added `/manifest.json` and `/icons/icon-192x192.png` to `PRECACHE_URLS` and bumped cache version to `moms-dragonfly-v6`.
  - Added `url: "/reminders"` to the push payload in `convex/actions.ts` (`sendDueReminders`).
  - Removed duplicate `.animate-fade-in` and `.animate-scale-in` classes in `src/app/globals.css`.
- **Verification:** Added `tests/unit/swPush.test.ts` (4 unit tests, 100% passing).

---

## 3. Verification Matrix

| Check | Result | Details |
|---|---|---|
| `pnpm lint` | ✅ Passed | 0 warnings, 0 errors across `src`, `convex`, `convex-test`, `tests` |
| `pnpm typecheck` | ✅ Passed | Clean `tsc --noEmit` pass with TypeScript strict mode |
| `pnpm test` | ✅ Passed | 219 unit tests across 28 files passing (100%) |
| `pnpm test:convex` | ✅ Passed | 33 integration tests across 4 files passing (100%) |
| `pnpm build` | ✅ Passed | Production Next.js 15.5.27 build succeeded in 6.0s |
