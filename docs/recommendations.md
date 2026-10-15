# Recommendations log

## 2026-10-08 — Surgical-Investigation run

### Done this run
- **Journal sharing (built)**: live token link (`/share/[token]`), GPX/GeoJSON export, Web Share API. Effort: ~1 day. Unblocks: travellers sharing trips with family.
- **CSP hardening**: added `object-src`, `base-uri`, `form-action`, `frame-ancestors`. Low effort, closes audit gaps.
- **Removed `next-pwa`**: unmaintained dep unused at runtime; reduces audit noise and install weight.

### Recommended next
- **Run `pnpm outdated` / `pnpm audit` pass** (eslint 8 EOL, react 18 vs Next 15 peer mismatch, framer-motion→motion rename, vitest 5, tailwind 4). Effort: 2–4 hours for the safe subset.
- **Token rotation/expiry for share links**: currently one persistent token per device, revocable only via disable. Add `shareTokenCreatedAt` + UI to rotate. Effort: half day.
- **Rate-limit / cap `shareView` payload** (now 500 points/50 notes, fine at current scale); revisit if public links get hammered.
- **E2E coverage for the share happy path** (enable share in UI → visit link shows trail). Needs seeded locationHistory. Effort: half day.
- **Deploy pipeline**: this run's convex codegen uploaded functions to dev; production deploy (`npx convex deploy --yes`) and Vercel redeploy still pending owner sign-off.
- **Next.js 15.5.27 bundled postcss / source-map-js advisories**: `next` vendor-bundles its own `postcss` and `source-map-js` internally. Upstream Next.js release required to bump internal PostCSS past 8.5.23.
- **Deferred major updates**: React 19, Next 16, ESLint 10, Tailwind 4, Framer Motion 14.

## Phase 5: Device Identity Reset Flow — ✅ Implemented & Tested
When a `deviceId` has been leaked, travellers need a clean mechanism to generate a new device identity without data loss.

### Implementation Summary:
1. **Mutation (`rekeyDevice({ oldDeviceId, newDeviceId })`)** (`convex/mutations.ts`):
   - Validates both `oldDeviceId` and `newDeviceId` format via `validateDeviceId`.
   - Atomically updates all device-scoped tables in Convex: `userPrefs`, `locationHistory`, `journalNotes`, `expenses`, `budgets`, `reminders`, `tickets`.
   - Automatically revokes any active `shareToken` to prevent old share links from accessing re-keyed data.
   - Verified via integration tests in `convex-test/mutations.test.ts` (23 total Convex integration tests passing).
2. **Client-side Workflow (Settings → Privacy & Device Identity)** (`src/app/(tabs)/settings/SettingsClient.tsx`):
   - "Reset Device Identity" action with prominent `ConfirmDialog` modal explaining the transfer.
   - Generates a new cryptographically secure UUID (`crypto.randomUUID()`).
   - Invokes `rekeyDevice` mutation with network toast feedback.
   - Upon mutation success, updates `localStorage.setItem("mdf_device_id", newDeviceId)`, dispatches storage/custom events, and triggers a clean reload so active queries subscribe to the new device scope.
3. **Emergency Disconnect / Hard Reset**:
   - Optional future enhancement to purge local IDB blobs, unregister push subscriptions, and generate an unlinked `deviceId` without migrating historical data.

## Phase 6: Codebase Excellence & Feature Completion — ✅ Implemented & Tested
Completed full-sweep audit, hardening, and feature completion:
1. **Security (`sanitiseHttpsUrl`)**:
   - Centralized URL sanitizer in `src/lib/utils/url.ts` blocking `javascript:` and other non-HTTPS schemes from external APIs/AI results.
   - Verified with unit tests (`tests/unit/url.test.ts`) and integrated into `HighlightsCard.tsx`.
2. **Accessibility & WCAG AA**:
   - Resolved `nested-interactive` axe violations in `POICard.tsx`.
   - Added `h1` landmark to Budget dashboard.
   - Added `Escape` key listeners to modals and bottom sheets.
   - Expanded E2E axe a11y testing to all 7 tabs (`tests/e2e/a11y.spec.ts`).
3. **Unified Backend Caching**:
   - Added unified `cache` table in `convex/schema.ts` with `readThroughCache` helper in `convex/cache.ts`.
   - Centralized timeout handling in `convex/fetchWithTimeout.ts`.
   - Automated cache cleanup cron (`purgeExpiredCaches`).
4. **Backend Hardening**:
   - Bounded `validateDeviceId` checks.
   - Stripped internal `deviceIds` from `poiQuery` projections.
   - Clamped unbounded list queries (`historyQuery`).
   - Hardened POI upserts and recurring reminder recurrence advancement.
5. **Local Phrases Feature**:
   - Gemini prompt + curated fallbacks in `convex/phraseHelpers.ts`.
   - Action `getLocalPhrases` in `convex/actions.ts` with 30-day cache.
   - Built `PhrasebookCard.tsx` with clipboard copy and toast feedback.
   - Integrated as third segmented tab (`"phrases"`) in `LocalClient.tsx`.
   - Verified with `tests/unit/phrases.test.ts` and `tests/unit/PhrasebookCard.test.tsx`.
6. **Canonical Hook (`useActionData`)**:
   - Standardized Convex action execution with coordinate memoization, race condition elimination, and synchronous state resets on argument changes.
7. **Dead Code Cleanup & Resilience**:
   - Fixed ParticleCanvas DPR scaling and screen wrapping.
   - Wrapped background OCR in try-catch in `TicketsClient.tsx`.
   - Removed orphaned `IntroVideo.tsx`, `DragonflyBackground.tsx`, and `debug.spec.ts`.
8. **Unified Fetch Boundary & AbortController Consolidation**:
   - Consolidated 11 manual `AbortController` + timer sites in `convex/actions.ts`, `convex/wikiHelpers.ts`, and `convex/http.ts` into `convex/fetchWithTimeout.ts` with `isRetryable` helper and unit tests.
   - Parallelized `sendDueReminders` preferences lookups via `Promise.all`.
9. **Legacy Cache Drainage**:
   - Added `purgeLegacyCaches` internal mutation to batch-delete all rows from `highlightsCache`, `dishesCache`, and `placeEnrichCache` to prepare for schema retirement.
   - Extended `purgeExpiredCaches` to clean `dishesCache` (>7d) and `placeEnrichCache` (>30d).
10. **Explore Movement Invalidation & Strict Coordinate Checks**:
   - Replaced boolean coordinate checks with nullish guards in `src/app/(tabs)/explore/page.tsx` to handle equator coordinates (`lat === 0`).
   - Automatically invalidates category fetch cache when user moves > 1km (~0.01°).
11. **Service Worker Web Push Handlers & CSS Optimization**:
   - Implemented `self.addEventListener('push', ...)` and `self.addEventListener('notificationclick', ...)` in `public/sw.js` with vibration, icon, and URL routing.
   - Included `/manifest.json` and `/icons/icon-192x192.png` in precache assets and bumped cache version to `moms-dragonfly-v6`.
   - Explicitly attached destination URL (`url: "/reminders"`) to reminder push payloads in `convex/actions.ts`.
   - Removed duplicate `@keyframes` animation utility classes in `src/app/globals.css`.
   - Added unit test coverage in `tests/unit/swPush.test.ts` (100% passing).

