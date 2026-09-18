# Mom's Dragonfly — ARCHITECTURE.md

**Run ID:** `mdf-2026-09-18-001`  
**Generated:** 2026-09-18T18:45:00Z

---

## 1. Current → Target Architecture

### Current State (Implemented but Unverified)

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 APP                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │  /explore   │ │  /budget    │ │ /reminders  │ │ /tickets │  │
│  │  (MOCK POIs)│ │ (Dashboard) │ │  (Client)   │ │ (Client) │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────┬────┘  │
│         │               │               │             │        │
│         ▼               ▼               ▼             ▼        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              CONVEX CLIENT (ConvexReactClient)          │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                  │
│         ┌───────────────────┼───────────────────┐              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   Queries   │    │  Mutations  │    │   Actions   │       │
│  │  (10 funcs) │    │  (11 funcs) │    │  (5 funcs)  │       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    CONVEX BACKEND                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │   pois   │ │userPrefs │ │locationH.│ │  expenses  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ budgets  │ │reminders │ │ tickets  │ │  _storage  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                  │
│         ┌───────────────────┼───────────────────┐              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │Google Places│    │  Overpass   │    │ Brave/Gemini│       │
│  │   (API)     │    │   (API)     │    │   (API)     │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Target State (Post-Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 APP                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │  /explore   │ │  /budget    │ │ /reminders  │ │ /tickets │  │
│  │ (Live POIs) │ │ (Dashboard) │ │  (Client)   │ │ (Client) │  │
│  │ + Accessible│ │             │ │ + h1 heading│ │ + h1     │  │
│  │   List/Map  │ │             │ │             │ │ heading  │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────┬────┘  │
│         │               │               │             │        │
│         ▼               ▼               ▼             ▼        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              CONVEX CLIENT (ConvexReactClient)          │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                  │
│         ┌───────────────────┼───────────────────┐              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   Queries   │    │  Mutations  │    │   Actions   │       │
│  │  (10 funcs) │    │  (11 funcs) │    │  (5 funcs)  │       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    CONVEX BACKEND                        │  │
│  │  (7 tables + indexes + crons + internal functions)       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                  │
│         ┌───────────────────┼───────────────────┐              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │Google Places│    │  Overpass   │    │ Brave/Gemini│       │
│  │  (Cached,   │    │   (Cached)  │    │   (Fallback)│       │
│  │  Rate-limited)                │    │             │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │IndexedDB │      │  PWA SW  │
              │ (blobs)  │      │ (offline)│
              └──────────┘      └──────────┘
```

---

## 2. Areas Being Edited

| Area | Files | Change Type | AC Mapping |
|------|-------|-------------|------------|
| **Explore Page** | `src/app/(tabs)/explore/page.tsx` | Fix: Replace MOCK_POIS with live Convex query; add h1; wire POI list | AC-012, AC-013, AC-004 |
| **Map Accessibility** | `src/components/map/LeafletMap.tsx`, `POIMarker.tsx` | Fix: Markers as `<button>` with `aria-label`; keyboard nav; focus styles | AC-005, DEC-001, DEC-006 |
| **POI List** | `src/components/poi/POIList.tsx`, `POICard.tsx` | Fix: Semantic list; "Show on map" buttons; aria-live for filter changes | AC-012, DEC-007, DEC-008 |
| **Reminders Page** | `src/app/(tabs)/reminders/RemindersClient.tsx` | Fix: Add `<h1>Reminders</h1>` before "Your Schedule" h3 | AC-006, DEC-004 |
| **Tickets Page** | `src/app/(tabs)/tickets/TicketsClient.tsx` | Fix: Verify h1 structure; ensure semantic heading | AC-007, DEC-004 |
| **Ticket Gallery** | `src/components/tickets/TicketGallery.tsx` | Fix: Update empty state text OR update test expectation | AC-008, DEC-005 |
| **Elderly Mode CSS** | `src/app/globals.css`, `tailwind.config.ts` | Verify: Touch targets 56px, font 1.2rem, contrast ≥4.5:1 | AC-005, DEC-002, DEC-010 |
| **Convex Integration** | `src/app/(tabs)/explore/page.tsx` | Add: `useQuery(api.queries.poiQuery)` replace MOCK | AC-012, AC-013 |
| **Test Updates** | `tests/e2e/tickets.spec.ts` | Fix: Expect "No tickets saved" | AC-008, DEC-005 |

---

## 3. Interfaces / Dependencies

### Internal Interfaces

| Interface | Producer | Consumers |
|-----------|----------|-----------|
| `NormalizedPOI` | `src/types/index.ts` | ExplorePage, MapView, POIList, POICard, POIMarker |
| `Expense` | `src/types/index.ts` | BudgetDashboard, ExpenseForm, ExpenseList |
| `Reminder` | `src/types/index.ts` | RemindersClient, ReminderForm, ReminderList, ReminderCard |
| `Ticket` | `src/types/index.ts` | TicketsClient, TicketScanner, OCRResult, TicketGallery, TicketCard |
| `getDeviceId()` | `src/lib/utils/deviceId.ts` | All client components, Convex queries/mutations |
| `convexClient` | `src/lib/convex/client.ts` | Providers, all `useQuery`/`useMutation`/`useAction` |
| `haversine()` / `formatDistance()` | `src/lib/utils/geo.ts` | ExplorePage, POIMarker, POICard |

### External Dependencies

| Dependency | Purpose | Config Location |
|------------|---------|-----------------|
| Convex | Backend DB, functions, realtime | `NEXT_PUBLIC_CONVEX_URL`, `convex/*` |
| Google Places API | POI discovery (restaurants, attractions, pharmacies) | `GOOGLE_PLACES_API_KEY` (Convex env) |
| Overpass API | OSM toilets, parks, pharmacies | None (public) |
| Brave Search API | Entertainment events (optional) | `BRAVE_SEARCH_API_KEY` (Convex env) |
| Gemini Vision API | OCR fallback | `GEMINI_API_KEY` (Convex env) |
| Web Push (VAPID) | Push notifications | `VAPID_*` keys (Convex env + client) |
| Vercel | Hosting, CI/CD | `vercel.json`, GitHub Actions |
| Lighthouse CI | Performance/A11y/PWA auditing | `lighthouserc.json`, `.github/workflows/` |

---

## 4. Data / Control Flow

### POI Discovery Flow

```
User Location (Geolocation API)
        │
        ▼
ExplorePage: useQuery(api.queries.poiQuery, {deviceId, category})
        │
        ├── Cache hit (fetchedAt < 24h) ──▶ Return cached POIs
        │
        └── Cache miss / user refresh
                │
                ▼
        useAction(api.actions.fetchNearby, {deviceId, lat, lng, radius, category})
                │
                ├── Rate limit check (recentFetchCheck, 1hr window)
                │       └── If recent: return {cached: true}
                │
                └── Call Google Places API
                        │
                        ▼
                upsertPOIs mutation (deviceId, pois[])
                        │
                        ▼
                Convex pois table (24h TTL via cron)
                        │
                        ▼
                Reactive query updates UI
```

### Reminder Notification Flow

```
Convex Cron (every 5 min)
        │
        ▼
internal.actions.sendDueReminders
        │
        ▼
upcomingRemindersQuery (before: Date.now())
        │
        ▼
For each reminder:
        ├── get vapidSubscription from userPrefs
        ├── web-push.sendNotification(subscription, payload)
        └── toggleReminder mutation (sentAt = now)
```

### Ticket OCR Flow

```
User captures photo (TicketScanner)
        │
        ▼
runTesseract(blob) ──▶ {text, confidence}
        │
        ├── confidence ≥ 60% + parsed data ──▶ createTicket + saveTicketBlob
        │
        └── confidence < 60% OR no parsed data
                │
                ▼
        Show OCRResult with "Try Gemini" button
                │
                ▼
        geminiOCR action (base64 image) ──▶ {text}
                │
                ▼
        parseTicket(text) ──▶ createTicket + saveTicketBlob
```

---

## 5. Security Boundaries

| Boundary | Protection |
|----------|------------|
| **Client → Convex** | All secrets in Convex env vars; client only sees `NEXT_PUBLIC_CONVEX_URL` |
| **Convex → External APIs** | API keys only in Convex actions (server-side); never in client bundle |
| **IndexedDB** | Ticket image blobs only; no PII; 24h TTL via `expiresAt` + cron purge |
| **Web Push** | VAPID keys in Convex env; subscription stored per-device in userPrefs |
| **Device Identity** | UUID in localStorage only; no auth, no cross-device linking |
| **CSP/HSTS** | `vercel.json` headers: CSP, HSTS, X-Frame-Options |

---

## 6. AC Mapping

| AC-ID | Architecture Element | Verification |
|-------|---------------------|--------------|
| AC-001 | Next.js build pipeline | `pnpm build` exit 0 |
| AC-002 | Vitest + Convex types | `pnpm test` 21+ pass |
| AC-003 | Playwright + axe-core | `pnpm test:e2e` 14/14 pass |
| AC-004 | Lighthouse CI config | `pnpm test:lhci` thresholds met |
| AC-005 | Elderly mode CSS + axe-core | `/explore` elderly 0 critical |
| AC-006 | RemindersClient h1 | Playwright `getByRole('heading', {name: 'Reminders'})` |
| AC-007 | TicketsClient h1 | Playwright `getByRole('heading', {name: 'Tickets'})` |
| AC-008 | TicketGallery empty text | Playwright `getByText('No tickets saved')` |
| AC-009 | ElderlyModeToggle localStorage | DevTools `localStorage.mdf_elderly_mode` |
| AC-010 | CookieConsent localStorage | DevTools `localStorage.mdf_cookie_ok` |
| AC-011 | deviceId localStorage | DevTools `localStorage.mdf_device_id` |
| AC-012 | MapView + POIList live data | Visual + Convex query |
| AC-013 | Verify POI button | Click → Convex `verifiedCount` increment |
| AC-014 | BudgetRing animation | Visual + Framer Motion |
| AC-015 | Expense CRUD | Playwright + Convex dashboard |
| AC-016 | Reminder push | Cron log + Push API |
| AC-017 | OCR extraction | Unit test + visual regression |
| AC-018 | SW caches assets | Lighthouse PWA audit |
| AC-019 | Install prompt | beforeinstallprompt event |
| AC-020 | Update banner | SW lifecycle event |