# Mom's Dragonfly — Trip Journal · Bolt Rides · Location Highlights · Brand Refresh (Enhanced Plan)

> **Agent:** Fenrie
> **Enhanced sub-skills invoked:** writing-plans-enhanced + surgical-implementation (light — branch-based execution) + verification-before-completion
> **Verification mode:** Visual + Transform + Browser-observable (dev-tools verification pass on a preview deployment)
> **Branch:** `feature/trip-journal-bolt-highlights-branding`

**Goal:** Add five user-facing capabilities to Mom's Dragonfly — automatic trip journaling, Bolt ride requests, location-triggered weather/news highlights, an elegant dragonfly mark, and a warmer orange-forward theme — verified end-to-end with real browser evidence.

**Architecture:** Convex backend additions are purely additive (one new cache table + one new action + one extended query surface); the journal reuses the existing device-scoped `locationHistory` table and its `saveLocation` mutation. New UI: one new `/journal` tab, a ride-request sheet on POIs, a highlights card on Explore, plus a refreshed brand (SVG mark + regenerated PWA icons + silhouette v2). Every new distribution statement stays deviceId-scoped via the existing `validateDeviceId` pattern — user data cannot mix between devices.

**Anti-Gravity boundary:** N/A — no external agent collaboration in this plan. No secrets, env contents, or personal data leave this machine; new third-party calls are server-side (Convex actions) with key material already in Convex env.

---

## Workstream T1 — Trip Journal (auto history + pins, device-isolated)

**Requirements:** Once `userPrefs.tripStartDate` has started (i.e. `now >= tripStartDate`), the app automatically records the user's journey: sampled location points stored server-side, shown as a map trail + pins + timeline. Devices must never see each other's data.

### T1.1 — Recorder hook (`src/hooks/useTripJournal.ts`)
- Subscribe to `prefsQuery`; active when `tripStartDate` is set and passed.
- Geolocation watch; save a point via existing `mutations.saveLocation` when: first point of session, OR moved >150 m (haversine), OR >10 min elapsed (min 2 min gap to avoid jitter floods).
- Never save when trip inactive; never save when accuracy is null; cap accuracy stored as-is.
- **Verify Visual & Transform Claims**
  - [ ] **Visual claim:** n/a (no direct UI).
  - [ ] **Transform claim:** new rows appear in `locationHistory` for the active device only (checked via journal page + Convex dashboard query count).
  - [ ] **Verification method:** dev-tools geolocation simulation (CDP `setGeolocationOverride` across multiple positions) + journal page point count increases.
  - [ ] **Verification result:** [pending]

### T1.2 — Journal page (`src/app/(tabs)/journal/page.tsx` + `components/journal/*`)
- New bottom-nav tab "Journal" (route `/journal`).
- Stats header: total distance (haversine over sampled points), days recorded, point count, "Recording" badge when trip active.
- Map card: `LeafletMap` extended with optional `trail` prop → polyline through points + emphasized start/end pins.
- Timeline list grouped by day: time, coordinates, distance-from-previous; empty state explains auto-recording.
- **Verify Visual & Transform Claims**
  - [ ] **Visual claim:** trail polyline + pins visible on the journal map; day-grouped timeline below; "Recording" badge on when trip active.
  - [ ] **Transform claim:** journal renders exactly the points written by T1.1 (count/latest timestamp match).
  - [ ] **Verification method:** browser snapshot + vision check + count compare; isolation test: switch `deviceId` in localStorage → journal shows empty for the new device, and points return when switching back.
  - [ ] **Verification result:** [pending]

### T1.3 — Isolation tests (`tests/unit/journal.test.ts`)
- Device A saves points; device B saves points; assert each history query returns only its own device's rows; assert inactive-trip recorder saves nothing (pure logic test for the sampling decision function).
- **Verify Visual & Transform Claims**
  - [ ] **Transform claim:** `pnpm test` runs new test file green alongside existing 52 tests.
  - [ ] **Verification method:** test output.
  - [ ] **Verification result:** [pending]

---

## Workstream T2 — Bolt ride requests

**Requirement:** "Book or request rides via the app." **Constraint (verified):** Bolt publishes no consumer booking/deep-link API for third-party apps (only Bolt Business partner APIs behind auth). Delivering the best compliant UX: a ride sheet that (a) opens Bolt via its universal link, (b) copies the destination (name + address + coordinates) to the clipboard so it can be pasted as the drop-off, and (c) offers a fully-prefilled Google Maps fallback for navigation. Copy explicitly documents what happens so nothing overpromises.

### T2.1 — Ride sheet component (`src/components/ride/RideSheet.tsx` + `lib/ride/links.ts`)
- Pure link builder (`buildBoltUrl`, `buildMapsUrl`, `buildDestinationText`) so it is unit-testable.
- Trigger points: "Ride" button on POI cards + map popups (pickup = current location when available, dropoff = POI).
- **Verify Visual & Transform Claims**
  - [ ] **Visual claim:** sheet slides up with Bolt action, destination preview, and Maps action; toast confirms clipboard copy.
  - [ ] **Transform claim:** clipboard contains the POI name + address + coords; Bolt/Maps URLs contain correct coordinates (assert in unit test).
  - [ ] **Verification method:** browser click-through + clipboard read (`navigator.clipboard.readText()` in dev-tools context) + unit test assertions.
  - [ ] **Verification result:** [pending]

---

## Workstream T3 — Location weather/news highlights

**Requirement:** Weather + news highlights triggered by the user's location. Keys: Open-Meteo (no key, CORS-open), Nominatim reverse geocode (free, UA-required), Brave News API (key already present in Convex prod env).

### T3.1 — Backend (`highlightsCache` table + `getHighlights` action + `highlightsQuery`)
- Cache key = lat/lng rounded to 2 decimals (~1.1 km), TTL 30 min; keeps API volume tiny.
- Weather via Open-Meteo (current temp, apparent temp, wind, weather code, daily min/max).
- Location name via Nominatim reverse (city/suburb); news via Brave news search (freshness=24h, count 5) — degrade gracefully to weather-only if the news call fails.
- **Verify Visual & Transform Claims**
  - [ ] **Transform claim:** `highlightsCache` row created on first call; second call within TTL served from cache (verify log/timestamp unchanged).
  - [ ] **Verification method:** Convex deploy + direct action call from app + cache row inspection via Convex CLI.
  - [ ] **Verification result:** [pending]

### T3.2 — UI (`components/explore/HighlightsCard.tsx`)
- Card at top of Explore: location name, big temperature + condition icon, wind chip; news list (2–3 items, tappable, source label). Skeleton while loading; weather-only fallback state. Orange accents per T5.
- **Verify Visual & Transform Claims**
  - [ ] **Visual claim:** card shows real Pretoria weather + SA news items with sources on the live preview.
  - [ ] **Verification method:** browser snapshot + vision check + click-through on a news link.
  - [ ] **Verification result:** [pending]

---

## Workstream T4 — Dragonfly mark redesign (no more ant)

**Requirement:** "Dragonfly logo enhance — currently it looks like a green ant with wings." Root cause found: the PWA icon is stacked ellipses (literally an ant body). Redesign = new master SVG: long slender segmented abdomen, four spread wings (fore + hind pairs, translucent gradients, orange-tipped), compact thorax/head with gold eyes, top-down classic pose on a deep navy rounded tile with warm rim light.

### T4.1 — Master mark + icon pipeline
- Author `public/dragonfly-icon.svg` (512 viewBox) → render/iterate with browser screenshots + vision QA (minimum 2 iterations).
- Generate `public/icons/icon-{16..512}*.svg` from the master (maskable variant with safe padding) + `favicon.svg` → run `node convert-icons.mjs` (sharp) to regenerate all PNGs.
- **Verify Visual & Transform Claims**
  - [ ] **Visual claim:** icon reads as an elegant dragonfly at 64 px and 512 px (vision-checked); no ant-like proportions.
  - [ ] **Transform claim:** all PNG files' mtimes/sizes updated; manifest icons still resolve (no 404s in dev tools).
  - [ ] **Verification method:** screenshots at multiple sizes + vision_analyze + curl the deployed icon files.
  - [ ] **Verification result:** [pending]

### T4.2 — In-app silhouette v2 (`DragonflySilhouette.tsx`) + splash
- Refine wings (wider spread, softer tips), add orange gradient accents; keep animations + reduced-motion behavior; keep `data-testid`s (tests depend on them).
- **Verify Visual & Transform Claims**
  - [ ] **Visual claim:** splash + header show the refined mark; existing tests still pass (selectors unchanged).
  - [ ] **Verification method:** `pnpm test`, browser snapshot of splash.
  - [ ] **Verification result:** [pending]

---

## Workstream T5 — Orange-forward theme pass

**Requirement:** "Add more orange colour to the theme."
- Add `dragonfly.orange` scale to `tailwind.config.ts` + mirror in `src/lib/theme/dragonfly.ts` (+ any CSS vars).
- Curated application: BottomNav active treatment, splash gradient text, POI filter active chips, highlights card, journal trail/accents, BudgetRing warmth, primary CTA glows, background ambient glow.
- **Verify Visual & Transform Claims**
  - [ ] **Visual claim:** every screen shows warm orange accents without breaking contrast/legibility (AAA-ish on body text kept; orange used on dark navy).
  - [ ] **Verification method:** screenshots of all five tabs + vision check; axe/contrast spot-check via dev tools.
  - [ ] **Verification result:** [pending]

---

## Process Gates

1. **Branch** — `feature/trip-journal-bolt-highlights-branding` ☑ created.
2. **Build gates after each workstream:** `pnpm typecheck && pnpm test && pnpm build`.
3. **Review:** self-review diff + `requesting-code-review`-style pass (security scan of new endpoints, secret handling, no `any` leaks); address findings before commit.
4. **Commit & push:** conventional commits per workstream; push branch to origin (GitHub).
5. **Preview deploy + dev-tools verification:** `npx convex deploy --yes` (additive schema) + `npx vercel --yes` preview; run the browser verification matrix below on the preview URL.
6. **Handoff:** report evidence (screenshots, test output, cache rows); ask before merging to `main` / production deploy.

## Verification Matrix (dev-tools pass, preview deployment)

| # | Feature | Method | Pass criteria |
|---|---------|--------|---------------|
| 1 | Journal recording | CDP geolocation simulation over 4 positions; reload journal | Points increase; trail + pins render |
| 2 | Journal isolation | Swap deviceId in localStorage | Other device's journal empty; original intact |
| 3 | Bolt sheet | Click ride on POI; read clipboard; inspect URL targets | Correct destination text; URLs valid |
| 4 | Highlights | Load Explore with geo | Real weather for Pretoria + news items with sources |
| 5 | Icon/brand | Screenshot icon at 64/512; check manifest + no 404 | Elegant dragonfly; all icons load |
| 6 | Orange theme | Screenshots of all tabs | Warm accents visible; no contrast regressions |
| 7 | Regression | Full unit suite + build + console-clean check on Explore/Tickets | 52+ tests green; no new console errors |

## Risks & Constraints (honest)

- **Bolt** has no public consumer booking API — deep-link flow is the compliant maximum; documented in UX copy. Re-check if Bolt publishes a public deep-link spec later.
- **Background tracking:** a PWA cannot record while fully closed on Android/iOS without native code; journal records while the app is open (any tab) + catches up on each open. Noted in UI copy ("records while you use the app").
- **Nominatim/Brave/Open-Meteo**: server-side calls only, cached 30 min, polite volumes; Brave key already in prod env.