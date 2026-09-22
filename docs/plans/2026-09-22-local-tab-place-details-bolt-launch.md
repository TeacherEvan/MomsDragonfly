# Local Tab, Place Details & Bolt App Launch — Implementation Plan (Enhanced)

> **Agent:** Fenrie (solo) — **Enhanced sub-skills invoked:** writing-plans-enhanced
> **Verification mode:** Browser-observable (prod) + Test (unit) + Device checklist (Bolt on Evan's phone)
> **Branch:** `feat/local-tab-place-details` → merge to `main` after verification

**Goal:** Give "Taste of the area" (dishes) and news/weather their own dedicated tab with two windows; make place selection expandable with full info + images; make the Bolt button actually launch the Bolt **app** (not the website) with the destination on the clipboard.

**Architecture:** New `/local` tab (segmented "News & weather" / "Taste of the area") reusing the two existing self-fetching cards; Explore sheds both cards. New `PlaceDetailsSheet` opens on tap (react-window list stays fast) and lazily enriches via a new `getPlaceDetails` action — Google Places (New) photos proxied through a new Convex HTTP action so the API key never reaches the client, with Wikipedia fallback. Bolt launch switches to an Android `intent://` URL targeting `ee.mtakso.client` (verified App-Link domain via assetlinks), falling back to bolt.eu.

**Anti-Gravity boundary:** N/A — solo work; nothing shared externally.

---

## Investigation Findings (evidence collected 2026-09-22)

### F1 — Dishes/News live inside Explore (by design, now superseded)
Explore renders, top to bottom: `MapView` → `HighlightsCard` (weather+news) → `LocalDishesCard` → `POIFilter` + `POIList`. Both cards are self-contained (`{lat, lng}` props, own Convex action fetch). Moving them is low-risk.

### F2 — Place list truncates + hides meaning
`POICard` single-line `truncate` on name and address; rows in a fixed-height (140px) react-window list; the only tap targets are three small icon buttons (ride/map/verify). Tapping the row itself does nothing → "you don't know what you're selecting."

### F3 — Bolt opens the website because we link to the website
`src/lib/ride/links.ts` → `buildBoltUrl()` returns literally `"https://bolt.eu/"`. `RideSheet` copies the destination text, then `window.open("https://bolt.eu/")`.

### F4 — Android CAN launch the Bolt app; iOS CANNOT (documented limitation)
- `https://bolt.eu/.well-known/assetlinks.json` shows the Bolt app (`ee.mtakso.client`) is associated for **`common.handle_all_urls`** across bolt.eu — so an explicit Android intent resolves to the app.
- `https://bolt.eu/.well-known/apple-app-site-association` contains **only `webcredentials`** — no `applinks` section. On iOS, bolt.eu has **no Universal Link support**, so no web page can open the Boot app on iOS. Keep the website + clipboard flow there.
- Chrome's `intent://` syntax (developer.chrome.com/docs/android/intents): `intent://<host/path>#Intent;scheme=https;package=…;S.browser_fallback_url=…;end`. Requires a user gesture (we have one: the button tap). `browser_fallback_url` handles "app not installed" (encode it!).
- Bolt publishes no public ride-prefill deep link (confirmed earlier + no evidence found) — even Google Maps' "Open in Bolt" is a private integration. The best any third-party app can do: **open the app + clipboard ready to paste**.

### F5 — Places API (New) is already used; photos are feasible
`fetchNearby` calls `places.googleapis.com/v1/places:searchNearby` with a field mask (id, displayName, location, rating, currentOpeningHours, formattedAddress, internationalPhoneNumber). A **lazy** Place Details call (`GET /v1/places/{id}` with `photos,nationalPhoneNumber,regularOpeningHours,userRatingCount`) can enrich on selection. Photo bytes require the key → proxy via a Convex **HTTP action** (`convex/http.ts`, served at `*.convex.site`; the function runtime exposes `CONVEX_SITE_URL` so no new env var is needed). `GOOGLE_PLACES_API_KEY` is present on prod Convex (names verified; values never printed).

---

## Task 1 — New "Local" tab (News & weather + Taste of the area)

**Files:** `src/app/(tabs)/local/page.tsx` (new), `src/components/local/LocalClient.tsx` (new), `src/components/shell/BottomNav.tsx`, `src/app/(tabs)/explore/page.tsx`, `public/sw.js`

**Steps:**
1. `page.tsx` — server shell rendering `<LocalClient />` (mirror explore page shell).
2. `LocalClient.tsx` — client component:
   - `useGeolocation()` for position; no-position state = friendly panel ("Turn on location to see what's around you" + retry button).
   - Segmented control (two "windows"): **"News & weather"** | **"Taste of the area"**; renders `<HighlightsCard lat lng />` or `<LocalDishesCard lat lng />` unchanged (they self-fetch + self-cache). Remember last segment in `localStorage` (`mdf_local_segment`).
   - Header: "Local" + subtitle "What's around you".
3. `BottomNav.tsx` — add `{ href: "/local", label: "Local", icon: "sparkle" }` after Explore (6 tabs total). Fix indicator math for N tabs: `step = 100 / tabs.length; left = idx * step + step / 2 + "%"`. Visual check on 360px width (touch targets ≥ 48px).
4. `explore/page.tsx` — remove `HighlightsCard` + `LocalDishesCard` imports/renders (Explore keeps map, filter, list — cleaner).
5. `sw.js` — add `'/local'` to the precache list (consistent with other tabs).

**Verify Visual & Transform Claims**
- [ ] **Visual claim:** Bottom nav shows 6 items; `/local` shows two segmented windows; Explore no longer shows weather/news/dishes cards.
- [ ] **Transform claim:** `sw.js` precache includes `/local`; Explore bundle imports dropped.
- [ ] **Verification method:** prod browser run (localStorage geolocation stub), DOM checks for `section[aria-label="Weather and news highlights"]` + `section[aria-label="Popular local dishes"]` on `/local`; `document.body.innerText` on `/explore` lacks them; nav shows 6 labels.
- [ ] **Verification result:** _(filled at execution)_

---

## Task 2 — Place rows readable + `PlaceDetailsSheet` (selection expands with info + images)

**Files:** `src/components/poi/POICard.tsx`, `src/components/poi/POIList.tsx`, `src/components/poi/PlaceDetailsSheet.tsx` (new), `src/app/(tabs)/explore/page.tsx`

**Steps:**
1. `POICard.tsx`:
   - Name → `line-clamp-2` (drop single-line truncation); address → `line-clamp-2`.
   - Whole card becomes tappable (`onSelect(poi)`, role/button semantics + Enter/Space); inner buttons call `e.stopPropagation()`.
   - Add a visible **Details ›** affordance (chevron-right) in the meta row; keep ride/map/verify buttons.
2. `POIList.tsx` — thread `onSelect` through `rowProps`/`POIRow`; bump `ITEM_HEIGHT` if the clamped name needs it (tune visually, target ≤ 152px).
3. `PlaceDetailsSheet.tsx` (new — mirror `RideSheet` structure: backdrop, spring motion, `role="dialog"`):
   - Shows immediately: full name, category chip, Open/Closed, distance, rating, full address, phone (`tel:` link), verified count + Verify button, source badge (Google/OSM/Crowd).
   - **Images:** up to 3 photos in a horizontal snap strip (lazy, `onError` → placeholder). Placeholder = category emblem panel (never a broken box).
   - **Lazy enrichment:** on open, call `getPlaceDetails` (Task 3). Shimmer while loading; graceful degrade to existing fields if it fails.
   - Actions row: **Request a ride** (opens `RideSheet`), **Show on map** (closes sheet + focuses marker), **Call** (if phone), **Google Maps** link.
4. `explore/page.tsx` — `selectedPoi` state; render `<PlaceDetailsSheet …/>`; wire `onRequestRide` → existing ride flow; `onShowOnMap` → existing focus behavior.

**Verify Visual & Transform Claims**
- [ ] **Visual claim:** Long place names wrap (no mid-word cut); tapping a row opens a rich sheet with full info + photos; buttons still work independently.
- [ ] **Transform claim:** New component + props wired; `POIList` row height updated if needed; no console errors.
- [ ] **Verification method:** prod browser run — click a restaurant row, assert sheet content (full text, image `naturalWidth > 0` or placeholder), click Ride → RideSheet; click Show on map → sheet closes.
- [ ] **Verification result:** _(filled at execution)_

---

## Task 3 — Place enrichment backend (details + photo proxy + Wikipedia fallback)

**Files:** `convex/schema.ts`, `convex/placeHelpers.ts` (new, pure), `convex/actions.ts`, `convex/http.ts` (new), `next.config.js` + `vercel.json` (CSP), tests

**Steps:**
1. `schema.ts` — add `placeEnrichCache` table: `{ key: string, payload: string, fetchedAt: number }`, index `by_key`.
2. `convex/placeHelpers.ts` (no Convex imports — unit-testable):
   - `PHOTO_REF_RE` = `^places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+$`; `isValidPhotoRef(name)`.
   - `mapGoogleDetails(json)` → `{ photos: string[] (valid refs only), phone?: string, hours?: string[], ratingCount?: number }`.
   - Wiki image parsing helper — **reuse/extract** the existing dishes wiki lookup (`convex/dishHelpers.ts` has the search+thumbnail flow; extract shared pieces into `convex/wikiHelpers.ts` without breaking current tests).
3. `actions.ts` — new `getPlaceDetails` action: args `{ deviceId, placeId, source, name, lat, lng }`.
   - Cache key: Google → `g:{placeId}`; else `w:{name slug}:{lat.toFixed(1)},{lng.toFixed(1)}`; TTL 30d.
   - Google path: `GET https://places.googleapis.com/v1/places/{id}` with field mask `photos,nationalPhoneNumber,regularOpeningHours,userRatingCount` → map → photo proxy URLs `${CONVEX_SITE_URL}/place-photo?ref=…&w=800`.
   - Fallback path: Wikipedia image(s) by `name + area` (same style as dishes).
   - Return `{ photos, phone?, hours?, ratingCount?, fetchedAt }`; store in cache.
4. `convex/http.ts` — HTTP action `GET /place-photo`: validate `ref` with `PHOTO_REF_RE` (reject otherwise — prevents open proxy abuse), clamp `w` 200–1600 (default 800), fetch `places.googleapis.com/v1/{ref}/media` with the server key, stream body back with correct `Content-Type` + `Cache-Control: public, max-age=604800`.
5. CSP: add `https://*.convex.site` to `img-src` in `next.config.js` **and** `vercel.json`.
6. Tests: `tests/unit/places.test.ts` — photo-ref validation matrix, `mapGoogleDetails` edge cases (missing photos/hours, invalid refs filtered), wiki parsing. Convex-test: none for the network action (keep to unit + live smoke).

**Verify Visual & Transform Claims**
- [ ] **Visual claim:** Selecting a Google-sourced place shows real photos (or a clean emblem if none); no key material visible in network URLs (only `convex.site` refs).
- [ ] **Transform claim:** Convex deploy includes `http.ts` route; cache rows created on first fetch; second fetch served from cache (fast).
- [ ] **Verification method:** `npx convex deploy --yes`; smoke `curl -sI https://rare-alpaca-711.convex.site/place-photo?ref=<valid>` (expect image content-type; invalid ref → 400); browser: sheet images `naturalWidth > 0`; check no `key=` appears in any client-visible URL.
- [ ] **Verification result:** _(filled at execution)_

---

## Task 4 — Bolt: launch the app, not the website

**Files:** `src/lib/ride/links.ts`, `src/components/ride/RideSheet.tsx`, tests

**Steps:**
1. `links.ts` — replace `buildBoltUrl()` with `buildBoltLaunch(ua: string): { href: string; mode: "app" | "web" }`:
   - **Android + Chromium-family** (`/Android/i` and `/Chrome\/|SamsungBrowser|EdgA|OPR/i`): return
     `intent://bolt.eu/#Intent;scheme=https;package=ee.mtakso.client;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=https%3A%2F%2Fbolt.eu%2F;end` (mode `app`).
   - Otherwise (iOS, desktop, Firefox Android): `https://bolt.eu/` (mode `web`).
   - Document the iOS finding (AASA = webcredentials only) in a comment so nobody "fixes" it later.
2. `RideSheet.tsx` — `handleBolt`:
   - `await copyText(buildDestinationText(destination))` **first** (clipboard before any navigation).
   - If mode `app`: click a transient `<a href={intentUrl}>` element (user gesture preserved; fallback URL handles missing app).
   - If mode `web`: keep `window.open(url, "_blank", "noopener,noreferrer")`.
   - Copy updates: button → "Open Bolt app — destination copied"; helper line → "Opens Bolt with your destination on the clipboard — paste it into 'Where to?'. (Bolt doesn't let other apps pre-fill rides.)"
3. Tests: extend ride/links tests — Android Chrome UA → `intent://` + `package=ee.mtakso.client` + encoded fallback; iOS UA → `https://bolt.eu/`; desktop → `https://bolt.eu/`.

**Verify Visual & Transform Claims**
- [ ] **Visual claim:** Sheet copy reflects app-launch behavior; (on Evan's phone) tapping opens the Bolt app directly, destination on clipboard.
- [ ] **Transform claim:** unit matrix green; no `window.open` used for intent mode.
- [ ] **Verification method:** unit tests here; **device checklist for Evan** after deploy — Android Chrome: tap "Open Bolt app" → Bolt app opens (or bolt.eu if app missing); paste destination; iOS: bolt.eu site opens + clipboard (expected limitation, documented).
- [ ] **Verification result:** _(filled at execution)_

---

## Task 5 — Verification sweep, docs, ship

**Steps:**
1. Full gate: `pnpm test` (unit + typecheck), `pnpm build` green.
2. Deploy: `npx convex deploy --yes` (schema + action + http route) then `npx vercel --prod --yes`; confirm alias serves new build (CSP marker check).
3. **Prod browser verification** (geolocation stub as in today's run): `/local` two windows populated; Explore clean; POI tap → sheet + photos; RideSheet flows; nav 6 tabs.
4. Docs: update AGENTS.md counts/features (this is the previously-blocked edit — retry now; approval guard may need Evan present), README if tab list mentioned.
5. Merge `feat/local-tab-place-details` → `main`, push.
6. Hand Evan the Bolt device test checklist (he's the only one with a phone + Bolt installed).

**Non-goals / limits (documented):**
- iOS cannot launch the Bolt app (no universal links — AASA evidence) — website + clipboard is the ceiling.
- Bolt ride prefill is not possible for third-party apps; clipboard + app launch is the best available.
- No schema changes to the `pois` table (photos fetched lazily per selection, cached separately).

**Risks:** react-window row-height tuning (visual check); Google photo quota/cost is negligible at family scale (photos only fetched on selection; 7-day server cache); `CONVEX_SITE_URL` used server-side so no new client env needed.