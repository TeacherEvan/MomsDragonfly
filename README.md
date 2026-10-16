# Mom's Dragonfly

A mobile-first PWA travel companion — proximity-based verified POIs (10m→20km+), budgeting, reminders, ticket scanning/OCR — completely free, offline-first, no sign-in.

## Screenshots

| Explore & Map | Budget Tracker | Ticket Scanner |
|:---:|:---:|:---:|
| ![Explore](public/screenshots/explore.png) | ![Budget](public/screenshots/budget.png) | ![Tickets](public/screenshots/tickets.png) |

|| Reminders | Settings | Large Text |
||:---:|:---:|:---:|
|| ![Reminders](public/screenshots/reminders.png) | ![Settings](public/screenshots/settings.png) | ![Large Text](public/screenshots/settings-large-text.png) |

> **Add your own screenshots:** Place PNG files in `public/screenshots/` with the names above, or update the paths in this README.

---

## Tech Stack

- **Framework:** Next.js 15 App Router (15.5.27 on Vercel)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (`dragonfly` dark palette, WCAG AA contrast)
- **Database:** Convex (realtime DB + actions + scheduled crons + HTTP photo/streetview proxy)
- **Maps:** Leaflet + react-leaflet (inline SVG pins, journal trail polylines)
- **OCR:** Self-hosted Tesseract.js (`public/tesseract/`) with Gemini Vision fallback
- **PWA:** Hand-rolled service worker (`public/sw.js`) with Web Push & offline support
- **Testing:** Vitest (unit), `convex-test` (backend integration), Playwright + axe-core (E2E), Lighthouse CI
- **Deployment:** Convex + Vercel (+ Bubblewrap Android TWA in `android/`)

---

## What's New (2026-09-21) — Premium Onboarding + Design System

This release introduces the full dragonfly-themed experience: cinematic onboarding, unified dark palette, and micro-interactions throughout.

### Premium Onboarding Flow

Every launch shows the intro (no suppression — by design, analytics only):

1. **Splash Screen** (`SplashScreen.tsx`): Full-screen `intro.jpg` background with animated dragonfly SVG silhouette. Tap anywhere → dragonfly takes off (scale + fade, 400ms) → ripple effect.
2. **Intro Video** (`IntroVideoModal.tsx`): Full-screen overlay with `<video>` element (`intro.mp4`, `poster="intro.jpg"`). Centered gold play button; skip (top-right, gold-400); keyboard: Escape skips, Space toggles play/pause.
3. **Video End / Skip**: Dragonfly exits animation (flies to top-right, 300ms skip / 500ms return-to-nav) then dismisses.
4. **Onboarding Slides** (`OnboardingSlides.tsx`): 3 cinematic slides with Framer Motion transitions after video completes.

### Unified Dark Design System (`dragonfly` Palette)

New Tailwind palette in `tailwind.config.ts` and `src/lib/theme/dragonfly.ts`:

- **Navy (`#061416`, `#0a1f26`)** — base background
- **Teal (`#319795`)** — primary interactive color
- **Cyan (`#06b6d4`)** — accent
- **Emerald (`#10b981`)** — secondary
- **Gold (`#D4AF37`)** — rewards, active states, budget glow

CSS variables (`:root`) set in `src/app/globals.css`; applied app-wide. Key visual updates:

- **Header**: `bg-dragonfly-navy-950/95` with iridescent text gradient
- **BottomNav**: Flying dragonfly indicator with spring animation between tabs
- **BudgetRing**: Gold/amber shimmer gradients + glow pulse when spent ≥ 80%
- **Skeleton Loaders**: `Skeleton.tsx` applied to BudgetRing, POI cards, expenses, map, filter chips
- **ParticleCanvas**: Animated dragonfly silhouettes + ambient particles (`ParticleCanvas.tsx`, 267 lines)

> **Status**: Design system implemented (`7f588a7`). Component-level palette audit pending (see [`docs/task-status.md`](docs/task-status.md) KI-016).

---

## Features Walkthrough

### 1. Explore — Nearby Places & Map

**What it does:** Discovers verified points of interest around you using multiple data sources.

| Feature | Details |
|---------|---------|
| **Data Sources** | Google Places (New), OpenStreetMap (Overpass), Brave Search |
| **Categories** | Restaurants, Toilets, Pharmacies, Attractions, Entertainment, Parks |
| **Range** | 10 m → 20 km+ (configurable in Settings) |
| **Verification** | Tap "Verify" on any POI to confirm it exists — crowdsourced trust |
| **Offline** | Cached POIs persist in Convex; map tiles cache via service worker |

**How to use:**
1. Open the **Explore** tab (first tab)
2. Allow location permission when prompted
3. Select a category from the filter chips (Restaurant, Toilets, etc.)
4. Tap a POI card to see details, or tap "Show on Map" to pan the map
5. Tap **Verify** on a place you've visited to help other travelers

**Pro tips:**
- Pull down to refresh POIs for the current category
- The map shows your location (blue dot) and all discovered POIs
- Verified count appears on each card — higher = more trusted

---

### 2. Budget — Trip Expense Tracker

**What it does:** Visual budget ring + expense logging with multi-currency support.

| Feature | Details |
|---------|---------|
| **Budget Ring** | Animated SVG ring showing spent vs. remaining |
| **Currencies** | 12 supported (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, THB, SGD, MYR) |
| **Categories** | Food, Transport, Accommodation, Activities, Shopping, Other |
| **Ticket Linking** | Attach scanned receipts to expenses |
| **Offline** | Expenses stored locally, sync when online |

**How to use:**
1. Open the **Budget** tab
2. Tap **Edit Target** to set your total trip budget
3. Tap **Add Expense** → enter amount, pick category, optional note
4. (Optional) Link a scanned ticket from the Tickets tab
5. Watch the ring animate — green = on track, red = over budget

**Pro tips:**
- Swipe left on an expense to delete
- Currency is set in Settings → applies to all tabs
- Total spent / remaining shown below the ring

---

### 3. Tickets — Camera OCR & Gallery

**What it does:** Scan receipts/tickets → extract text via OCR → parse dates, amounts, venues.

| Feature | Details |
|---------|---------|
| **OCR Engine** | Tesseract.js (runs offline in browser) |
| **Fallback** | Gemini Vision API (cloud) for low-confidence scans |
| **Parsing** | Auto-extracts date, amount, venue name |
| **Storage** | Images in IndexedDB, metadata in Convex |
| **Gallery** | All scanned tickets with parsed data visible |

**How to use:**
1. Open the **Tickets** tab
2. Tap **Scan Ticket** → camera opens
3. Position receipt in frame, tap capture
4. Wait for OCR (shows progress spinner)
5. If confidence is high → auto-saves as ticket
6. If confidence is low → shows parsed preview with **Retry with Gemini** button
7. View all tickets in the gallery below

**Pro tips:**
- Good lighting = better OCR accuracy
- Hold phone steady; Tesseract works best on high-contrast text
- Gemini fallback uses your Convex backend (needs `GEMINI_API_KEY` in Convex env)
- Delete tickets by tapping the trash icon in gallery

---

### 4. Reminders — Scheduled Notifications

**What it does:** Create time-based reminders with repeat options + push notifications.

| Feature | Details |
|---------|---------|
| **Repeat Modes** | None, Daily, Weekly |
| **Push Notifications** | Works when app is closed (service worker) |
| **Days Counter** | Shows days since trip start (set in Settings) |
| **Timezone** | Stored in UTC, displays in local time |

**How to use:**
1. Open the **Reminders** tab
2. If prompted, tap **Enable** for push notifications
3. Tap **+ Add Reminder** → set title, optional body, date/time, repeat
4. Tap a reminder to toggle done/undone
5. Swipe left to delete

**Pro tips:**
- Enable notifications in Settings → Push Notifications for background delivery
- The Days Counter at top shows trip progress (configure Trip Start Date in Settings)
- Reminders fire via Convex cron (runs every minute)

---

### 5. Settings — Personalization & Accessibility

**What it does:** Configure app behavior, accessibility, and privacy.

| Setting | Options |
|---------|---------|
| **Display & Layout** | Instant per-device toggles: **Large text** (bigger fonts + touch targets), **Reduce motion** (stops float/shimmer animations), **High contrast** (brighter text, plainer background) |
| **Default Search Radius** | 10m, 100m, 500m, 1km, 5km, 10km, 20km+ |
| **Currency** | 12 currencies (see Budget) |
| **Push Notifications** | On/Off — enables background reminders |
| **Trip Start Date** | Date picker — drives Days Counter |
| **Reset to Defaults** | One-tap factory reset |
| **Exit App** | Tries to close the window; if the browser blocks it, shows an exit hint and returns to Explore |

**How to use:**
1. Open the **Settings** tab (gear icon)
2. Flip the **Display & Layout** toggles for accessibility — they apply instantly (WCAG AA, larger targets)
3. Adjust search radius for Explore tab
4. Pick your currency
5. Enable push notifications for reminders
6. Set trip start date for the counter
7. Tap **Save Settings**
8. Tap **Exit App** at the bottom to leave the app

**Pro tips:**
- Display prefs persist on this device (`mdf-display-prefs`) and apply on launch
- Reset button confirms before wiping — use if things feel off
- All settings tied to `deviceId` — no account needed

---

### 6. PWA Features — Install & Offline

| Feature | How to Access |
|---------|---------------|
| **Install Prompt** | Appears automatically on supported browsers (Chrome/Edge/Safari) |
| **Update Banner** | Shows when new version deployed — tap to refresh |
| **Offline Page** | Custom `/offline.html` shown when no network |
| **App Shortcuts** | Long-press app icon → quick actions (Explore, Budget, Scan) |

**Installation:**
- **Android (Chrome):** Menu → Install App / Add to Home Screen
- **iOS (Safari):** Share → Add to Home Screen
- **Desktop (Chrome/Edge):** Address bar install icon → Install

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Convex account (for backend) — [sign up free](https://convex.dev)

### Installation

```bash
# 1. Clone & enter
git clone <your-fork-url>
cd Mom'sDragonfly

# 2. Install dependencies
pnpm install

# 3. Set up Convex (first time only)
pnpm convex dev
# → Follow prompts to create/select a deployment
# → This creates .env.local with CONVEX_DEPLOYMENT

# 4. Configure environment variables
# Copy example and fill in your values
cp .env.local.example .env.local

# 5. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Variables

Create `.env.local` with:

```env
# Required — from `pnpm convex dev` output
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site

# Optional — for Gemini Vision OCR fallback
GEMINI_API_KEY=your-gemini-api-key

# Optional — for Google Places (New) API
GOOGLE_PLACES_API_KEY=your-google-places-api-key

# Optional — for Brave Search API
BRAVE_API_KEY=your-brave-api-key
```

> **Note:** The app works without API keys using OpenStreetMap (Overpass) only. Add keys for richer POI data.

### Convex Dashboard

After `pnpm convex dev`, open the printed dashboard URL to:
- View/edit database records
- Run mutations manually
- Inspect cron jobs
- Monitor function logs

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm test:lhci` | Run Lighthouse CI |
| `pnpm convex dev` | Start Convex dev backend |
| `pnpm convex deploy` | Deploy Convex to production |

---

## Project Structure

```
├── convex/                 # Convex backend (schema, queries, mutations, actions, crons, http)
├── convex-test/            # Convex backend integration test suite
├── public/                 # Icons, manifest, sw.js, offline.html, tesseract/ (self-hosted OCR)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (tabs)/         # Tab-based navigation pages (7 tabs)
│   │   │   ├── explore/    # POI exploration + map
│   │   │   ├── local/      # Local area highlights, dishes & phrasebook
│   │   │   ├── journal/    # Auto-recorded trip journal, notes & live share
│   │   │   ├── budget/     # Budget tracking + ring
│   │   │   ├── reminders/  # Reminders, countdown & push notifications
│   │   │   ├── tickets/    # Ticket OCR & gallery
│   │   │   └── settings/   # User preferences, display & device identity
│   │   ├── api/push/       # Web Push subscription route
│   │   ├── share/[token]/  # Public read-only shared trip journal view
│   │   ├── providers.tsx   # Convex, Toast, Network providers
│   │   └── layout.tsx      # Root layout + PWA metadata
│   ├── components/         # UI components (shell, map, poi, journal, ride, explore, budget, etc.)
│   ├── hooks/              # Custom React hooks (useGeolocation, useTripJournal, useActionData, etc.)
│   └── lib/                # Utilities (idb, images, journal, notify, push, ride, theme, tickets)
└── tests/                  # Unit (tests/unit/) and Playwright E2E (tests/e2e/) suites
```

---

## Key Implementation Details

### Self-Hosted Tesseract.js OCR

Tesseract.js runs 100% locally in the browser using self-hosted assets under `public/tesseract/` (`worker.min.js`, `tesseract-core-*.wasm`, and `eng.traineddata.gz`), avoiding CDN runtime fetches or bundler worker incompatibilities. When offline or when confidence is below threshold (`< 70%`), the user can optionally enrich the scan via Gemini Vision.

### Convex Backend

- **Schema:** `pois`, `userPrefs`, `locationHistory`, `journalNotes`, `cache` (plus legacy `highlightsCache`, `dishesCache`, `placeEnrichCache`), `expenses`, `budgets`, `reminders`, `tickets`
- **Actions:** Google Places (New), Overpass (OSM), Brave Search, Open-Meteo, Nominatim, Wikipedia/Wikimedia Commons, Gemini Vision & Local Dishes/Phrases
- **Crons:** Due reminder push notifications (every 5 min), expired POI cleanup (hourly), expired ticket cleanup (hourly), expired cache cleanup (daily)
- **Auth & Bounds:** Every public query/mutation validates `deviceId` via `validateDeviceId()`, strips `deviceId` from public projections, and bounds all list reads via `convex/limits.ts` (`MAX_*`).

### PWA Configuration

- Hand-rolled service worker (`public/sw.js`, cache `moms-dragonfly-v7`) with app-shell precaching, offline fallback (`/offline.html`), and Web Push (`push` + sanitized `notificationclick`) handlers
- Chrome-enforced Android install routing (`src/lib/utils/install.ts`) so Samsung Internet / OEM browsers never mint blocked WebAPKs
- Accessibility headers, WCAG AA contrast compliance across all 7 tabs
- Display & Layout prefs (`largeText`, `reduceMotion`, `highContrast`) stored per device in `localStorage` (`mdf-display-prefs`)

---

## Testing

```bash
# Unit tests (Vitest + jsdom)
pnpm test

# Convex backend integration tests (convex-test)
pnpm test:convex

# E2E tests (Playwright — run pnpm build first)
pnpm test:e2e

# Lighthouse CI
pnpm test:lhci
```

### Test Coverage

- **Unit tests:** 238 passing across 30 test files
- **Convex integration tests:** 37 passing across 4 test files
- **E2E tests:** 26 passing across 5 spec files (including axe-core WCAG AA across all tabs and large-text mode)
- **Lighthouse CI:** Enforced accessibility gate (`≥ 0.95`)

---

## Deployment

### Vercel & Convex Production

```bash
pnpm deploy:prod            # Deploy Convex production functions first
npx vercel --prod --yes     # Deploy Vercel frontend second
```

### Post-Deploy Checklist

- [ ] Confirm the newest production deployment is **Ready** (`npx vercel ls`)
- [ ] Verify `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` point to production
- [ ] `curl -I` `/tesseract/worker.min.js` and `/tesseract/eng.traineddata.gz` (expect 200)
- [ ] Test PWA install on mobile (Android Chrome, iOS Safari)
- [ ] Test offline mode (Airplane mode → refresh)
- [ ] Verify push notifications work (Reminders tab)
- [ ] Run `pnpm test:lhci`

---

## Troubleshooting

### "Location permission denied"
- **Fix:** Browser settings → Site permissions → Location → Allow for localhost

### "Convex connection failed"
- **Fix:** Check `.env.local` has correct `NEXT_PUBLIC_CONVEX_URL`
- **Fix:** Run `npx convex dev` to ensure backend is running

### "Tesseract.js error in production"
- **Fix:** Ensure `public/tesseract/` contains the full `node_modules/tesseract.js-core/` `.wasm` files plus `worker.min.js` and `eng.traineddata.gz`
- **Fix:** Use Gemini Vision enrichment fallback (`GEMINI_API_KEY` in Convex env)

### "Push notifications not working"
- **Fix:** Enable in Settings → Push Notifications
- **Fix:** Check browser supports Push API (Chrome/Edge/Firefox/Safari 16+)
- **Fix:** On iOS, must add to Home Screen first

### "Map not loading"
- **Fix:** Check network — Leaflet tiles load from OpenStreetMap
- **Fix:** Failed tiles automatically retry 3× with exponential backoff before showing a calm placeholder

### "TypeScript errors after pull"
- **Fix:** Run `pnpm install && pnpm typecheck`
- **Fix:** Convex schema changes need `npx convex dev` or `npx convex codegen` to regenerate types

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `pnpm lint && pnpm typecheck && pnpm test`
5. Submit a pull request

---

## Project Plan

See [Implementation Plan](docs/plans/2025-09-17-MomsDragonFly-Implementation.md) for detailed task breakdown and status.

---

## Adding Screenshots

To add real screenshots:

```bash
# 1. Run the app
pnpm dev

# 2. Open http://localhost:3000 on mobile/desktop
# 3. Take screenshots of each tab
# 4. Save as PNG to public/screenshots/
#    explore.png, budget.png, tickets.png, reminders.png, settings.png, settings-large-text.png

# 5. Commit and push
git add public/screenshots/
git commit -m "Add README screenshots"
```

Recommended dimensions: 390×844 (iPhone 12/13/14) or 360×800 (Android). Keep file sizes under 200KB each.

## Deployment Note (2026-10-14)

Due to a duplicate Convex project created on 2026-10-11, the default `pnpm convex deploy` targets the empty project (`tidy-hornet-430`) instead of the data-containing project (`rare-alpaca-711`).

To deploy to the correct production deployment (where the live app reads data), use:

```bash
CONVEX_DEPLOYMENT=dev:different-squid-155 pnpm convex deploy --prod
```

Alternatively, create a `.env.deploy` file with `CONVEX_DEPLOYMENT=dev:different-squid-155` and run:

```bash
pnpm convex deploy --prod --env-file .env.deploy
```

See the OpenViking memory `hermes-remember-5de588ea808b` for full provenance.
