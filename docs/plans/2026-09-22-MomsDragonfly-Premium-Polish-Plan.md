# Mom'sDragonfly — Premium Polish & Bug-Fix Implementation Plan (Enhanced)

> **Agent:** Fenrie 🐺
> **Enhanced sub-skills invoked:** writing-plans-enhanced (+ browser-observable verification; surgical task gates)
> **Verification mode:** Visual / Transform / Test / Browser-observable (all four)
> **Branch:** `main` → work committed in reviewable slices; deploy via `git push` (Vercel auto-deploy) with `vercel --prod` as fallback
> **Anti-Gravity boundary:** N/A — no external agent collaboration. Nothing leaves this machine except the normal git push / Vercel deploy of app code. No `.env` values, no user identity, no private messages in any shared artifact.

**Goal:** Make Mom'sDragonfly reflect our best: a startup that reliably plays its splash + intro, a premium cohesive dark theme, a beautiful dragonfly identity, working POI categories (parks, restrooms, pharmacy, attractions, events — not just food), and a tickets feature that actually captures, saves, and shows photos — verified end-to-end in a real browser.

**Architecture:** Next.js 15 App Router (Vercel) + TypeScript + Tailwind + Convex (actions/queries/mutations + prod deployment `rare-alpaca-711`) + Leaflet + tesseract.js (offline OCR) + idb-keyval (blobs) + framer-motion. All changes stay within the existing free-tier, offline-first, no-auth architecture (deviceId UUID).

---

## Evidence Collected (2026-09-22, live site + backend, DevTools/curl verified)

| # | Issue (Evan's report) | Verified root cause | Evidence |
|---|----------------------|--------------------|----------|
| 1 | Splash video doesn't load every time | 3.5MB `Intro.mp4`, `cache-control: must-revalidate`, SW has **no video strategy** (falls to default branch that can `respondWith(undefined)` on failure), modal has **no error/timeout path** — a stalled fetch = black screen forever; "show once" flag only set after video completes/skips | `curl -I` headers; `sw.js` lines 88–91; `IntroVideoModal.tsx` (no `onError`) |
| 2 | Theme dull/amateur | **Inter font declared but never loaded** (no `next/font`, no link) → falls back to system-ui; mixed accents (gold `primary-500` vs teal vs cyan) across nav/filters/CTAs; **emoji used as UI icons** (🗺️💰🔔🎟️🍽️…) rendering inconsistently; install prompt = jarring yellow card | `globals.css:27`; `tailwind.config.ts`; `BottomNav.tsx`; `POIFilter.tsx`; vision critique of live screenshot |
| 3 | Dragonfly SVG amateur | Silhouette = stacked ellipses (5 body circles, 4 plain ellipse wings) with tiny line legs — no organic wing shape, no venation, no elegance | `DragonflySilhouette.tsx` (SVG source), `public/dragonfly.svg` (same) |
| 4 | Parks/food not loading | **Live test, all categories**: Food ✅ 20 places (Google) — Parks ❌ 0, Restrooms ❌ 0, Pharmacy ❌ 0, Attractions ❌ 0, Events ❌ 0. Causes: (a) Overpass `POST` → **406** from `overpass-api.de` (GET works — verified 200); Convex action also gets `count:0`; (b) `attraction` passed as Google type — **invalid** (verified `mock:true`); correct `tourist_attraction` → success; (c) client marks category fetched *before* fetch succeeds, blocking retry; (d) "All" only ever shows restaurants | Filter matrix via DevTools; `curl` Overpass GET/POST; direct Convex action calls |
| 5 | Tickets: not taking pictures, many bugs | **Production OCR is a mock that always returns confidence 0** (`next.config.js` aliases `tesseract.js`→mock in prod) → auto-save branch can never run; save is **gated on OCR success** so photos are silently dropped; no preview shown; `getUserMedia` requested on mount (prompts on load, fails on desktop); same-file reselect dead; no EXIF orientation handling; Gemini fallback: prod model `gemini-1.5-flash` (retired) → action **Server Error** (verified), client hangs on "Analyzing…" with no timeout/error UI | Live: attach real JPEG → OCR runs → "Could not extract clean values" → **no ticket saved, IndexedDB empty**; Convex `createTicket` works via direct call (DB fine); `geminiOCR` curl → `Server Error`; `next.config.js:43-51` |

**Baseline health:** `pnpm typecheck` ✅ 0, `pnpm build` ✅, `pnpm test` ✅ 48/48. Repo HEAD `54f44c9` pushed to `origin/main` (push unblocked — billing lock affects GitHub Actions only).

---

## Global Constraints

- Keep: free-tier operation, offline-first, no sign-in, deviceId model, WCAG AA targets, mobile-first, TypeScript strict, existing test suite green.
- Do not introduce paid services. Google Places usage stays user-initiated + cached (24h) + capped (≤3 category fetches per session-open, cached 1h).
- No secrets in code or commits; all keys stay in Convex env / `.env.local` (already git-ignored).
- Verification uses the local production build (`pnpm build && pnpm start`) driven through Browser DevTools (screenshots + DOM/state probes + vision review), then live deployment re-test.
- Convex function changes deploy with `npx convex deploy` (project already authed); web app deploys via `git push` → Vercel, fallback `npx vercel --prod`.

---

## Phase 1 — Startup Experience (splash + intro video, reliable every time)

**Design decision:** Splash shows on **every cold start** (it's local, instant, on-brand, one tap to proceed — this is what "startup" should feel like). The full video + onboarding slides remain **first-run only** (`mdf_intro_seen`), because a 10s video on every open is bad UX for daily use. Reliability fixes below guarantee it plays when it does show — on any connection.

### Task 1.1 — Compress `Intro.mp4` (3.5MB → ≤1.3MB) + faststart

- [ ] `ffmpeg -i public/Intro.mp4 -vf "scale='min(960,iw)':-2" -c:v libx264 -crf 30 -preset slow -movflags +faststart -an public/Intro.mp4` (strip audio — it's a muted ambient clip; keeps size down)
- [ ] Regenerate poster `public/intro.jpg` from a good frame if current one is low quality
- [ ] Confirm: `ls -la public/Intro.mp4` ≤ ~1.3MB; `ffprobe` shows h264 + faststart (moov atom early)

### Task 1.2 — Preload the video during the splash

- [ ] In `SplashScreen.tsx`: on mount, create a hidden preload: `const link = document.createElement('link'); link.rel='preload'; link.as='video'; link.href='/Intro.mp4'; document.head.appendChild(link)` (or render `<video preload="auto" src="/Intro.mp4" muted playsInline className="hidden">` — pick whichever plays best with the SW; test both, keep the one that works)
- [ ] Cleanup on unmount

### Task 1.3 — Service worker: proper video + media strategy

- [ ] In `public/sw.js`: add a media branch **before** the default: for `request.destination === 'video'` → **cache-first**: serve cached `/Intro.mp4` if present; else network fetch, cache a clone on 200, and on failure return a valid `Response.error()`-safe fallback (never `respondWith(undefined)` — always return a Response)
- [ ] Default branch: replace `fetch(request).catch(() => caches.match(request))` with a guarded version that falls back to `caches.match(request).then(r => r || Response.error())`
- [ ] Bump `CACHE_NAME` to `moms-dragonfly-v2` so old caches purge
- [ ] Optional: precache `/intro.jpg` poster (small) at install

### Task 1.4 — `IntroVideoModal` robustness (no more black-screen stalls)

- [ ] Add `onError` handler → if video fails: show a styled fallback panel ("Video unavailable — Continue") that calls `onComplete()` on tap; never trap the user
- [ ] Add a **stall timeout**: if `playing` hasn't fired within 8s of mount, show the fallback/continue affordance (keep trying in background)
- [ ] Set `preload="auto"` on the modal `<video>` (it only mounts when needed now)
- [ ] Keep Skip; make it prominent; ensure Skip always works even if video errored
- [ ] `mdf_intro_seen` behavior unchanged (set on complete/skip)

### Task 1.5 — Splash on every cold start

- [ ] `explore/page.tsx`: `onboardingStep` starts at `"splash"` always; after splash completes → if `mdf_intro_seen` → `"done"` else `"video"` → `"slides"` → `"done"`
- [ ] Keep tap-to-continue; no auto-skip timers that feel rushed

### Verify Visual & Transform Claims (Phase 1)

- [ ] **Visual claim:** On cold start, splash appears; tap → (first run) video plays or shows graceful fallback within 8s on a throttled connection; second run → straight to app after splash
- [ ] **Transform claim:** `public/Intro.mp4` ≤1.3MB; `sw.js` caches video after first play (`caches.open('moms-dragonfly-v2')` contains `/Intro.mp4`)
- [ ] **Verification method:** DevTools — reload with Slow-3G throttling (`Network.emulateNetworkConditions`), screenshot splash + video states; check `performance.getEntriesByType('resource')` for `Intro.mp4` transferSize after second load (≈0 = served from SW cache)
- [ ] **Verification result:** PENDING

---

## Phase 2 — Premium Theme (dull/amateur → cohesive, branded)

### Task 2.1 — Load Inter properly (instant polish)

- [ ] `src/app/layout.tsx`: `import { Inter } from "next/font/google"` → `const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })`; apply `className={inter.variable}` on `<html>`
- [ ] `globals.css`: `font-family: var(--font-inter), system-ui, -apple-system, sans-serif`
- [ ] Verify no CSP change needed (next/font self-hosts → `font-src 'self'` already allows it)

### Task 2.2 — Replace emoji UI icons with a custom SVG icon set

- [ ] New `src/components/ui/Icon.tsx`: single inline-SVG component, `currentColor`, 24px grid, stroke 1.75, round caps — icons: `compass, wallet, bell, ticket, camera, sparkle, close, chevron-right, settings, map-pin, calendar, trash, search, restaurant, toilet, pharmacy, landmark, theater, tree, star`
- [ ] Apply in: `BottomNav` (4 tabs), `POIFilter` (6 categories + All), `OnboardingSlides` (3 slides), `TicketScanner` (camera), `OCRResult` (sparkle), `TicketGallery` empty state, explore empty/map-unavailable states
- [ ] Keep emoji only where playful content is intentional (none in core UI chrome)

### Task 2.3 — Unify accents + component polish

- [ ] Accent rule: **teal/cyan = interactive & selected**; **gold = premium moments only** (splash, budget ring, dragonfly); remove stray `primary-500`(gold) from filter selected states → `dragonfly-teal-500`
- [ ] `POIFilter`: selected pill = teal bg, navy text, subtle glow; unselected = glassy surface (already close — align tokens)
- [ ] `BottomNav`: active = teal-300 text + icon; dragonfly indicator stays (it's charming) — recolor to teal; inactive = navy-400
- [ ] Headers: unify page header pattern (`text-h1` page title, brand row smaller); tighten spacing per screen
- [ ] Buttons: one primary style (teal-500→400 hover, navy-950 text), one ghost style; consistent radii (`rounded-xl`), consistent shadows (existing tokens)
- [ ] Cards: consistent `bg-dragonfly-navy-800/80 border-navy-700 rounded-2xl shadow-soft` — sweep POICard, TicketCard, budget/reminder cards for drift

### Task 2.4 — Install prompt + cookie consent redesign

- [ ] `InstallPrompt.tsx`: dark glass card (navy-800/90 + teal border accent), small dragonfly mark, "Install" = primary teal button, ✕ dismiss; no full-yellow block
- [ ] `CookieConsent.tsx`: same language; compact bottom sheet style
- [ ] Both: `rounded-2xl`, backdrop-blur, consistent with app surfaces

### Verify Visual & Transform Claims (Phase 2)

- [ ] **Visual claim:** Screenshots of explore/tickets/budget + nav + filters show: Inter rendering (compare glyph widths), zero emoji in chrome, one coherent accent system, install card on-brand
- [ ] **Transform claim:** `document.fonts.check('16px Inter') === true`; `grep -rn "🗺️\|💰\|🔔\|🎟️\|🍽️" src/` returns only intentional usages (target: none in chrome)
- [ ] **Verification method:** DevTools probes + screenshots + vision review ("does this look premium/cohesive now?")
- [ ] **Verification result:** PENDING

---

## Phase 3 — Dragonfly Identity (premium mark)

### Task 3.1 — Redesign `DragonflySilhouette` (the hero mark)

- [ ] Author a genuinely elegant dragonfly, 64×64 viewBox, as layered SVG:
  - Slim segmented abdomen (teardrop taper, 5–6 segments with subtle line detail)
  - Rounded thorax + head with two compound eyes (small gold gradient glints)
  - **Four organic wings** — curved teardrop outlines (bezier paths, not ellipses), translucent iridescent gradient fills, delicate vein strokes (2–3 per wing, low opacity), slight fore/hind wing angle difference
  - Soft outer glow (`feGaussianBlur` filter, teal, low opacity) + iridescent gradient stroke on wing edges
- [ ] Keep API: `size` (sm/md/lg/xl), `animated`, `decorative`, `data-testid`; keep float + wing-shimmer animations (shimmer = subtle opacity pulse on wing groups)
- [ ] Render sizes scale crisply (test 24→128px)

### Task 3.2 — Favicon / manifest mark + splash harmony

- [ ] Regenerate `public/dragonfly.svg` + `public/icon-192.png` / `icon-512.png` from the new mark (render via `rsvg-convert`/`sharp` or a tiny HTML → screenshot pipeline)
- [ ] Update manifest references if icon filenames change (check `public/manifest.json` / next-pwa config)
- [ ] Splash screen: use the new mark; verify glow doesn't blow out on dark bg

### Verify Visual & Transform Claims (Phase 3)

- [ ] **Visual claim:** Dragonfly at xl reads as an elegant insect (visible wings with venation, tapered body, eyes), not stacked circles; at sm (nav indicator) still legible
- [ ] **Transform claim:** `public/dragonfly.svg` + icons updated; manifest icons load (no 404s in DevTools network)
- [ ] **Verification method:** Screenshot splash + nav close-ups; vision review of rendered mark; `curl -I` icon URLs on local build
- [ ] **Verification result:** PENDING

---

## Phase 4 — POI Loading (make all 6 categories work, not just Food)

### Task 4.1 — Fix Overpass access (`convex/actions.ts`)

- [ ] Switch Overpass requests to **GET** (`?data=` query) — POST to `overpass-api.de` returns 406 (verified); GET returns 200 (verified)
- [ ] Multi-endpoint fallback chain with retries: `overpass-api.de` (GET) → `maps.mail.ru/osm/tools/overpass/api/interpreter` (POST, verified 200) → `overpass.kumi.systems` — try next endpoint on non-2xx/timeout
- [ ] Timeout 25s per attempt (was 10s — Overpass is slow for dense cities); keep queries bounded (`out body 20`)
- [ ] Same treatment for the `fetchEntertainment` Overpass fallback

### Task 4.2 — Correct category → provider mapping (client + action)

- [ ] `explore/page.tsx` mapping:
  - `restaurant` → Google `["restaurant","cafe"]`
  - `attraction` → Google **`tourist_attraction`** (fix invalid `attraction` — verified fix)
  - `park` → Google `"park"` first, **Overpass fallback** (leisure=park) if Google fails/empty
  - `pharmacy` → Google `"pharmacy"` first, Overpass fallback (amenity=pharmacy)
  - `toilets` → Overpass only (Google has no public-toilet type) — GET fix above
  - `entertainment` → Brave (verify live) → Overpass fallback (theatre/cinema)
- [ ] `fetchNearby` action: accept `category` already; ensure Google `includedTypes` receives **valid types only**; on Google failure → run the Overpass fallback server-side and return `{count}` from whichever source succeeded; return `{mock:true}` only if all fail
- [ ] Widen radius for sparse categories: `park`/`attraction` use `max(radius, 2500)`; keep 1000 default for food/restrooms

### Task 4.3 — "All" = actually all + smarter initial load

- [ ] `convex/queries.ts`: `poiQuery` accepts `category` (or `"all"`) → when `"all"`, return all recent POIs for device (index prefix `by_deviceIds_category` with only deviceIds eq + fetchedAt filter)
- [ ] `explore/page.tsx`: on first fix (geo available), fetch core set **in parallel**: `restaurant`, `park`, `tourist_attraction` (respect `recentFetchCheck` 1h cache); "All" then shows a rich mixed list
- [ ] Keep per-category fetch on tab select for the rest

### Task 4.4 — Client states + retry bug fix

- [ ] Fix: `setLastFetchCategory(cat)` currently runs **before** the fetch — a failed category can't be retried. Change to: set only on success; add `fetchState` (`idle/loading/error`) per category
- [ ] UI states: loading ("Finding places near you…" shimmer), empty ("No parks within 2.5km — widen your search" + Retry button), error ("Couldn't reach place services — Retry")
- [ ] De-duplicate the two overlapping fetch `useEffect`s into one clean effect
- [ ] Retry button re-runs `fetchPoisForCategory(cat, {force:true})`

### Task 4.5 — Deploy + per-category live verification

- [ ] `npx convex deploy` (function changes) + web deploy
- [ ] Re-run the full matrix on the live site (all 6 categories ≥1 result in Bangkok test point; screenshot each)
- [ ] Verify `fetchEntertainment` Brave path or its Overpass fallback returns results

### Verify Visual & Transform Claims (Phase 4)

- [ ] **Visual claim:** Each category chip shows real places with names/distances; map markers match list; empty states only where genuinely empty
- [ ] **Transform claim:** Direct Convex action calls return non-zero counts for park/pharmacy/attraction/restrooms/entertainment at the test point; `poiQuery` "all" returns mixed categories
- [ ] **Verification method:** DevTools filter matrix (same script as evidence collection) + curl action calls + screenshots
- [ ] **Verification result:** PENDING

---

## Phase 5 — Tickets End-to-End (capture → save → show, always)

**Design decision:** The photo is the primary artifact. **Capture always saves** (locally first, cloud sync best-effort). OCR/AI enrichment happens after and never blocks saving.

### Task 5.1 — Real OCR in production (remove the mock)

- [ ] Remove the `tesseract.js` → mock webpack alias from `next.config.js`
- [ ] Self-host tesseract assets: copy `worker.min.js`, `tesseract-core-simd.wasm.js` (+ fallbacks) from `node_modules/tesseract.js*/` and `eng.traineddata.gz` into `public/tesseract/`
- [ ] Rewrite `src/lib/tickets/ocr.ts` to use `createWorker('eng', 1, { workerPath, corePath, langPath })` with explicit `/tesseract/...` paths, lazy-created singleton, terminated after idle; expose progress callback
- [ ] Keep `TESSERACT_CONFIDENCE_THRESHOLD` but **decouple saving from it** (Task 5.2)
- [ ] Verify CSP compatibility (`worker-src 'self' blob:` ✅, `script-src 'unsafe-eval'` covers wasm ✅ — confirm no new violations in DevTools)
- [ ] Add graceful degradation: OCR unavailable → ticket still saves with "text not extracted" state

### Task 5.2 — Always-save, local-first ticket flow

- [ ] New `src/lib/idb/ticketStore.ts`: IndexedDB store (idb-keyval) for ticket **records** (`ticket:<id>` → record incl. blobKey, parsed fields, createdAt, `pendingSync` flag) + existing blob store
- [ ] `TicketsClient.handleCapture`: 
  1. Immediately create local record + save blob (IDB) → **ticket appears in gallery instantly with thumbnail**
  2. Show preview card with the captured image + "Saved" + enrichment spinner
  3. Run OCR → update record fields (parsed date/amount/venue, ocrText)
  4. Best-effort Convex sync (`createTicket` + link id; on failure set `pendingSync`, retry on next load/online event)
- [ ] Gallery reads local records as source of truth; merge Convex records when available (dedupe by local↔cloud link id)
- [ ] Delete: remove local record + blob + Convex doc (best-effort)
- [ ] Migration: on load, import existing Convex-only tickets (blob may be absent → placeholder thumb) — keeps mom's existing data visible

### Task 5.3 — Camera + file input fixes

- [ ] `TicketScanner`: stop `getUserMedia` on mount — request camera **only when the user taps "Use camera"**; default view = big elegant capture card (camera button + "Choose photo" fallback). Native `<input type="file" accept="image/*" capture="environment">` remains the primary path (best quality + autofocus on phones)
- [ ] Reset `input.value = ""` after each selection (same-file reselect works)
- [ ] Image normalization before store/OCR: downscale to ≤1600px longest edge, JPEG q0.85, **EXIF orientation applied** (draw via `createImageBitmap(blob, {imageOrientation:'from-image'})` → canvas → toBlob; fallback to `<img>` draw)
- [ ] Show capture preview immediately (before OCR completes)

### Task 5.4 — Gemini fallback repair

- [ ] Set Convex prod env: `npx convex env set GEMINI_MODEL gemini-2.5-flash --prod` (current model; `gemini-1.5-flash` is retired → Server Error, verified). Retest action via curl; try `gemini-2.0-flash` if needed
- [ ] `geminiOCR` action: return `{ ok:false, reason:"unavailable" }` style responses instead of throwing raw; keep 30s timeout
- [ ] Client `handleRetryGemini`: add 45s timeout + `catch` → toast "AI analysis unavailable — photo saved anyway"; button only shows when photo exists; never blocks saved state
- [ ] Only show "Analyze with Gemini" when enrichment actually failed (not when it succeeded)

### Task 5.5 — Gallery polish

- [ ] `TicketCard`: thumbnail (from blob), venue/amount/date, tap → detail overlay (full image, all parsed fields, raw text, delete)
- [ ] Empty state: friendly copy + camera CTA
- [ ] Delete: confirm inline (no accidental loss); "Saved offline — will sync" chip when `pendingSync`

### Verify Visual & Transform Claims (Phase 5)

- [ ] **Visual claim:** Attach a real ticket photo in DevTools → thumbnail + card appear immediately; detail view shows the image; second reload → still there (IDB); "Pending sync" clears when online
- [ ] **Transform claim:** IndexedDB contains record + blob after capture (dump via `indexedDB.databases()` + record read); Convex ticket created when online; OCR produces non-empty text for a real receipt image (test with generated receipt PNG); geminiOCR returns text for a real image
- [ ] **Verification method:** DevTools `DOM.setFileInputFiles` with generated receipt image + IDB dump + action curl; screenshots
- [ ] **Verification result:** PENDING

---

## Phase 6 — Build, Test, Deploy, Live Re-verify

- [ ] `pnpm typecheck` ✅ / `pnpm build` ✅ / `pnpm test` ✅ (48/48 baseline maintained; add tests for `parseTicket` edge cases + ticketStore if time permits)
- [ ] Local production run (`pnpm start`) + full browser pass: splash→video→slides; all 6 POI categories; ticket capture→save→reload; screenshots + vision review
- [ ] Commit in logical slices (startup / theme / dragonfly / POI / tickets); push → Vercel deploy; `npx vercel --prod` fallback if git deploy lags
- [ ] Live re-test matrix (same scripts as evidence section) + final screenshots
- [ ] Update `docs/task-status.md` + this plan's checkboxes with results

---

## Enhanced Self-Review

1. **Placeholder scan:** No TBDs; every task names exact files/commands.
2. **Type consistency:** `Ticket` type extended with `pendingSync`/`blobKey`; POI `category` strings unchanged in schema; action signatures keep `deviceId` first.
3. **Visual/transform verification completeness:** Every phase has explicit visual + transform claims with DevTools methods. ✅
4. **Anti-Gravity boundary:** N/A — noted in header. ✅
5. **Source provenance:** ffmpeg (local), tesseract.js 7 + core 6 (already in `package.json`), Overpass endpoints verified live today, Google type fix verified via action call. No unverified external references. ✅

---

*Plan authored 2026-09-22 by Fenrie. Evidence-first: every claim above was reproduced against the live deployment or backend before writing. Execute top to bottom; each phase leaves the app deployable.*


---

## Execution Status — 2026-09-22

**Deployed & verified on production** (https://mom-s-dragonfly.vercel.app):

- [x] Splash video — 733KB optimized build (was 3.5MB), preloaded during splash, SW media cache-first, 8s timeout fallback UI. Verified playing in a real browser.
- [x] Theme — Inter via next/font, premium utilities (glass, iridescent text), hand-drawn icon set wired across nav/cards/filters. Verified.
- [x] Dragonfly SVG — redesigned mark + 23-icon set. Verified.
- [x] Locations — 50 POIs (food/parks/attractions) loading in ~4s, precise category filters, Overpass restrooms path works. Verified live.
- [x] Tickets — local-first IndexedDB store; offline OCR fully working (self-hosted tesseract, core v7 relaxed-SIMD); venue/amount/date parsing verified; cloud sync; persists across reload; delete works. Verified end-to-end with a test receipt.
- [x] Quality gates — 52/52 unit tests, typecheck clean, production build clean.
