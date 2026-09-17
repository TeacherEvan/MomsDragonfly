# Mom's Dragonfly — Design Spec

> This is the authoritative spec. Plans argue from this doc.

## 1. Architecture

- Next.js 14 App Router, deployed on Vercel
- Convex: realtime DB, server actions, scheduled jobs (crons)
- No auth: deviceId UUID stored in localStorage, synced to Convex
- IndexedDB (idb-keyval) for blobs; Convex for structured data (24 h TTL on tickets/POI cache)

## 2. Features

### 2.1 POI Discovery
- User location via Geolocation API (watchPosition)
- Radius: 10m, 100m, 500m, 1km, 5km, 10km, 20km+ (user-adjustable)
- Sources: Google Places New API (restaurants, attractions, pharmacies), Overpass (toilets, parks), Brave Search (entertainment events)
- 24 h Convex cache; user-initiated refresh; max 1 refresh/device/category/hour
- Crowdsource verification: in-app upvote button per POI (stored in Convex verifiedCount)
- Map (Leaflet, dynamic import, SSR=false) + virtualised list (react-window)

### 2.2 Budget / Expenses
- Per-device budget (no account needed)
- Currencies: user selects from ISO 4217 list; no live conversion (amounts stored as-entered)
- Categories: Food, Transport, Accommodation, Attraction, Other
- Expense list virtualised; BudgetRing SVG donut chart (Framer Motion animation)
- Optionally link expense to a ticket (ticketId foreign key)

### 2.3 Reminders
- Add/edit/delete reminders with title, optional body, due datetime, repeat (none/daily/weekly)
- Web Push notifications (VAPID); graceful fallback to in-app badge if permission denied or iOS < 16.4
- Convex cron (every 5 min) sends due push notifications
- DaysCounter: shows days since trip start (tripStartDate from userPrefs)

### 2.4 Ticket Storage + OCR
- Camera capture (MediaStream) or file upload
- OCR: Tesseract.js (WASM, lazy-loaded, offline) — extracts raw text
- Parse: regex extracts date (ISO 8601 or DD/MM/YYYY), amount (currency symbol + number), venue (first capitalised phrase)
- Gemini Vision fallback (gemini-1.5-flash) when Tesseract confidence < 60%
- Storage: image blob in IndexedDB (idb-keyval); metadata in Convex (24 h TTL + scheduled purge)
- Gallery: list of tickets sorted by createdAt desc

### 2.5 PWA
- next-pwa with workbox; cache-first for assets, network-first for Convex API
- Manifest: name, short_name, icons (all sizes, maskable 512), theme_color, background_color
- InstallPrompt: beforeinstallprompt banner
- UpdateBanner: service worker update detected
- offline.html: shown when network fails and no cache hit

### 2.6 Onboarding
- Shown once (onboardingComplete=false in userPrefs)
- IntroVideo: <video> element, src from /public/intro.mp4 (placeholder until real video provided)
- OnboardingSlides: 3 slides (POI, Budget, Reminders) with Framer Motion transitions
- Cookie consent: localStorage flag, shows on first visit

### 2.7 Design System
- Tailwind CSS custom tokens: brand colours, radii, shadows
- Elderly mode: CSS class `.elderly` on <html>, targets ≥56px, font-size 1.2rem base, contrast ≥4.5:1
- Normal mode: targets ≥44px, font-size 1rem base
- Bottom nav: 4 tabs (Explore, Budget, Reminders, Tickets)
- Toast/snackbar for errors and success states

## 3. Data Pipeline

- POI fetch: client triggers Convex action → action checks cache → if stale/missing, calls external API → upserts to Convex pois table → client query auto-updates
- Reminder send: Convex cron (5 min) → query due reminders → call Web Push API for each → mark sentAt

## 4. Error Handling

- Network: react-query retry=2, then toast "Could not load — tap to retry"
- Geolocation denied: show "Location required" empty state with instructions
- OCR failure: "Could not read ticket — tap to try Gemini" button
- Convex offline: show cached data, toast "Working offline"

## 5. Testing

- Vitest: unit tests for geo.ts (haversine), currency.ts (formatAmount), parse.ts (OCR extraction regex), budget math
- Playwright: E2E smoke (map loads, POI card visible, add expense, add reminder, ticket scan flow)
- Lighthouse CI: PWA ≥ 90, Performance ≥ 75, Accessibility ≥ 95

## 6. Deployment

- Vercel: auto-deploy on push to main
- Convex: separate project, env vars set via `npx convex env set`
- GitHub Actions CI: lint + tsc + vitest + playwright + lighthouse CI
- Security headers: CSP, HSTS, X-Frame-Options via vercel.json
