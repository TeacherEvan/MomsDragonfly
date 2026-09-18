# Mom's Dragonfly — CODEBASE_STATE.md

**Run ID:** `mdf-2026-09-18-001`  
**Generated:** 2026-09-18T18:42:00Z  
**Git Commit:** `(uncommitted - initial state)`

---

## 1. Run Metadata

| Field | Value |
|-------|-------|
| Workflow ID | `mdf-2026-09-18-001` |
| Run ID | `mdf-2026-09-18-001` |
| Started | 2026-09-18T18:30:00Z |
| Repo Root | `/home/leandi-duplessis/github/workspaces/Mom'sDragonfly` |
| Git Remote | `origin` (to be verified) |
| Branch | `main` (no commits yet) |

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 14.2.35 (App Router) |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | 3.4.1 |
| Package Manager | pnpm | 9.x |
| Backend | Convex | 1.45.0 |
| Database | Convex (realtime) | - |
| Maps | Leaflet + react-leaflet | 1.9.4 / 5.0.0 |
| Animation | Framer Motion | 13.3.0 |
| Virtualization | react-window | 2.3.1 |
| Offline Storage | idb-keyval | 6.3.0 |
| OCR | Tesseract.js | 7.0.0 |
| PWA | next-pwa (Workbox) | 5.6.0 |
| Push Notifications | web-push | 3.6.7 |
| Testing (unit) | Vitest + jsdom | 5.0.1 |
| Testing (E2E) | Playwright | 1.63.0 |
| Testing (a11y) | @axe-core/playwright | 4.13.0 |
| Lighthouse CI | @lhci/cli | 0.15.1 |
| Linting | ESLint + next/config | 8.x |

---

## 3. Relevant Structure

```
Mom'sDragonfly/
├── convex/
│   ├── schema.ts                 # 7 tables: pois, userPrefs, locationHistory, expenses, budgets, reminders, tickets
│   ├── queries.ts                # 10 queries (poiQuery, prefsQuery, historyQuery, recentFetchCheck, expensesQuery, budgetQuery, remindersQuery, upcomingRemindersQuery, ticketsQuery)
│   ├── mutations.ts              # 11 mutations (upsertPOIs, savePrefs, saveLocation, purgeExpiredCache, verifyPOI, addExpense, updateExpense, deleteExpense, addBudget, addReminder, toggleReminder, deleteReminder, createTicket, deleteTicket)
│   ├── actions/
│   │   ├── fetchGooglePlaces.ts  # Rate-limited (1/hr/device/category)
│   │   ├── fetchOverpass.ts      # OSM toilets/parks/pharmacies
│   │   ├── fetchEntertainment.ts # Brave Search + OSM fallback
│   │   └── geminiOCR.ts          # Gemini Vision fallback
│   ├── crons.ts                  # purge-poi-cache (hourly), send-reminders (5min)
│   └── _generated/               # Auto-generated (gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with Providers
│   │   ├── providers.tsx         # ConvexProvider wrapper
│   │   ├── page.tsx              # Redirects to /explore
│   │   ├── (tabs)/
│   │   │   ├── layout.tsx        # BottomNav + CookieConsent
│   │   │   ├── explore/page.tsx  # Map + POI list (MOCK data)
│   │   │   ├── budget/page.tsx   # BudgetDashboard
│   │   │   ├── reminders/page.tsx # RemindersClient
│   │   │   ├── tickets/page.tsx  # TicketsClient
│   │   │   └── settings/page.tsx # SettingsClient
│   │   └── api/push/route.ts     # Web Push endpoint
│   ├── components/
│   │   ├── shell/
│   │   │   ├── BottomNav.tsx           # 4 tabs, CSS var touch targets
│   │   │   ├── ElderlyModeToggle.tsx   # Toggles .elderly on <html>
│   │   │   ├── CookieConsent.tsx       # localStorage flag
│   │   │   ├── InstallPrompt.tsx       # beforeinstallprompt
│   │   │   ├── UpdateBanner.tsx        # SW update detection
│   │   │   └── Toast.tsx               # Snackbar
│   │   ├── map/
│   │   │   ├── MapView.tsx             # Dynamic import LeafletMap
│   │   │   ├── LeafletMap.tsx          # MapContainer + TileLayer + Markers
│   │   │   └── POIMarker.tsx           # Popup content with verify button
│   │   ├── poi/
│   │   │   ├── POIList.tsx             # Virtualized list (react-window)
│   │   │   ├── POICard.tsx             # Card with verify button
│   │   │   └── POIFilter.tsx           # Category filter tabs
│   │   ├── budget/
│   │   │   ├── BudgetDashboard.tsx     # Ring + form + list
│   │   │   ├── BudgetRing.tsx          # SVG donut (Framer Motion)
│   │   │   ├── ExpenseForm.tsx         # Add/edit expense
│   │   │   └── ExpenseList.tsx         # Virtualized list
│   │   ├── reminders/
│   │   │   ├── ReminderForm.tsx        # Add/edit reminder
│   │   │   ├── ReminderList.tsx        # List with toggle/delete
│   │   │   └── ReminderCard.tsx        # Card component
│   │   ├── tickets/
│   │   │   ├── TicketScanner.tsx       # Camera capture
│   │   │   ├── OCRResult.tsx           # OCR result + Gemini retry
│   │   │   ├── TicketCard.tsx          # Gallery card
│   │   │   └── TicketGallery.tsx       # List + empty state
│   │   └── onboarding/
│   │       ├── IntroVideo.tsx          # <video> placeholder
│   │       ├── OnboardingSlides.tsx    # 3 slides (Framer Motion)
│   │       └── DaysCounter.tsx         # Days since trip start
│   ├── hooks/
│   │   └── useGeolocation.ts         # watchPosition hook
│   ├── lib/
│   │   ├── convex/client.ts          # ConvexReactClient singleton
│   │   ├── notify.ts                 # Web Push permission + subscription
│   │   ├── utils/
│   │   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   │   ├── geo.ts                # haversine, formatDistance
│   │   │   ├── currency.ts           # formatAmount, detectLocaleCurrency
│   │   │   ├── budget.ts             # Budget math utilities
│   │   │   └── deviceId.ts           # UUID in localStorage
│   │   ├── tickets/
│   │   │   ├── ocr.ts                # Tesseract.js runner
│   │   │   └── parse.ts              # Regex extraction (date/amount/venue)
│   │   └── idb/
│   │       └── tickets.ts            # IndexedDB blob storage
│   ├── types/
│   │   └── index.ts                  # NormalizedPOI, Expense, Reminder, Ticket types
│   └── middleware.ts                  # Next.js middleware (if any)
├── tests/
│   ├── unit/
│   │   ├── geo.test.ts               # haversine, formatDistance (4 tests)
│   │   ├── currency.test.ts          # formatAmount (2 tests)
│   │   ├── budget.test.ts            # Budget math (5 tests)
│   │   ├── parse.test.ts             # OCR parse (6 tests)
│   │   └── schema.test.ts            # Schema import (1 test)
│   ├── e2e/
│   │   ├── a11y.spec.ts              # Axe-core on all pages (normal + elderly)
│   │   ├── explore.spec.ts           # Explore page smoke
│   │   ├── reminders.spec.ts         # Reminders page load + nav
│   │   └── tickets.spec.ts           # Tickets page + gallery
│   └── setup.ts                      # @testing-library/jest-dom
├── public/
│   ├── icons/                        # PWA icons (to verify)
│   └── intro.mp4                     # Placeholder video
├── .github/workflows/
│   └── deploy.yml                    # CI/CD (to verify)
├── vitest.config.ts
├── playwright.config.ts
├── lighthouserc.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── vercel.json
```

---

## 4. Components Inventory

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| BottomNav | `src/components/shell/BottomNav.tsx` | ✅ Exists | 4 tabs, CSS var touch targets |
| ElderlyModeToggle | `src/components/shell/ElderlyModeToggle.tsx` | ✅ Exists | Toggles `.elderly` class, localStorage |
| CookieConsent | `src/components/shell/CookieConsent.tsx` | ✅ Exists | Shows once, localStorage flag |
| InstallPrompt | `src/components/shell/InstallPrompt.tsx` | ✅ Exists | beforeinstallprompt handler |
| UpdateBanner | `src/components/shell/UpdateBanner.tsx` | ✅ Exists | SW update detection |
| Toast | `src/components/shell/Toast.tsx` | ✅ Exists | Snackbar component |
| MapView | `src/components/map/MapView.tsx` | ✅ Exists | Dynamic import LeafletMap |
| LeafletMap | `src/components/map/LeafletMap.tsx` | ✅ Exists | Markers + Popups |
| POIMarker | `src/components/map/POIMarker.tsx` | ✅ Exists | Popup content with verify btn |
| POIList | `src/components/poi/POIList.tsx` | ✅ Exists | react-window virtualized |
| POICard | `src/components/poi/POICard.tsx` | ✅ Exists | Card with verify button |
| POIFilter | `src/components/poi/POIFilter.tsx` | ✅ Exists | Category filter tabs |
| BudgetDashboard | `src/components/budget/BudgetDashboard.tsx` | ✅ Exists | Ring + form + list |
| BudgetRing | `src/components/budget/BudgetRing.tsx` | ✅ Exists | SVG donut animated |
| ExpenseForm | `src/components/budget/ExpenseForm.tsx` | ✅ Exists | Add/edit expense |
| ExpenseList | `src/components/budget/ExpenseList.tsx` | ✅ Exists | Virtualized list |
| ReminderForm | `src/components/reminders/ReminderForm.tsx` | ✅ Exists | Add/edit reminder |
| ReminderList | `src/components/reminders/ReminderList.tsx` | ✅ Exists | List with toggle/delete |
| ReminderCard | `src/components/reminders/ReminderCard.tsx` | ✅ Exists | Card component |
| TicketScanner | `src/components/tickets/TicketScanner.tsx` | ✅ Exists | Camera capture |
| OCRResult | `src/components/tickets/OCRResult.tsx` | ✅ Exists | OCR result + Gemini retry |
| TicketCard | `src/components/tickets/TicketCard.tsx` | ✅ Exists | Gallery card |
| TicketGallery | `src/components/tickets/TicketGallery.tsx` | ✅ Exists | List + "No tickets saved" |
| IntroVideo | `src/components/onboarding/IntroVideo.tsx` | ✅ Exists | <video> placeholder |
| OnboardingSlides | `src/components/onboarding/OnboardingSlides.tsx` | ✅ Exists | 3 slides Framer Motion |
| DaysCounter | `src/components/onboarding/DaysCounter.tsx` | ✅ Exists | Days since trip start |

---

## 5. Convex Functions Inventory

### Queries (10)
| Function | File | Args | Returns |
|----------|------|------|---------|
| poiQuery | queries.ts | `{deviceId, category}` | POI[] |
| prefsQuery | queries.ts | `{deviceId}` | UserPrefs \| null |
| historyQuery | queries.ts | `{deviceId, limit}` | LocationHistory[] |
| recentFetchCheck | queries.ts | `{deviceId, category, windowMs}` | boolean |
| expensesQuery | queries.ts | `{deviceId}` | Expense[] |
| budgetQuery | queries.ts | `{deviceId}` | Budget \| null |
| remindersQuery | queries.ts | `{deviceId}` | Reminder[] |
| upcomingRemindersQuery | queries.ts | `{before}` | Reminder[] |
| ticketsQuery | queries.ts | `{deviceId}` | Ticket[] |

### Mutations (11)
| Function | File | Args | Purpose |
|----------|------|------|---------|
| upsertPOIs | mutations.ts | `{deviceId, pois[]}` | Bulk upsert POIs |
| savePrefs | mutations.ts | `{deviceId, ...updates}` | Upsert userPrefs |
| saveLocation | mutations.ts | `{deviceId, lat, lng, accuracy}` | Insert locationHistory |
| purgeExpiredCache | mutations.ts | `{}` | Delete POIs >24h |
| verifyPOI | mutations.ts | `{placeId}` | Increment verifiedCount |
| addExpense | mutations.ts | `{deviceId, amount, currency, category, note?, date, ticketId?}` | Insert expense |
| updateExpense | mutations.ts | `{id, ...updates}` | Patch expense |
| deleteExpense | mutations.ts | `{id}` | Delete expense |
| addBudget | mutations.ts | `{deviceId, totalBudget, currency, period, startDate, endDate?}` | Insert budget |
| addReminder | mutations.ts | `{deviceId, title, body?, dueAt, repeat, done}` | Insert reminder |
| toggleReminder | mutations.ts | `{id}` | Toggle done |
| deleteReminder | mutations.ts | `{id}` | Delete reminder |
| createTicket | mutations.ts | `{deviceId, ocrText?, parsedDate?, parsedAmount?, parsedVenue?, createdAt, expiresAt}` | Insert ticket |
| deleteTicket | mutations.ts | `{id}` | Delete ticket |

### Actions (5)
| Function | File | Purpose |
|----------|------|---------|
| fetchNearby | actions/fetchGooglePlaces.ts | Google Places New API (rate-limited) |
| fetchOverpassNearby | actions/fetchOverpass.ts | OSM Overpass (toilets, parks, pharmacies) |
| fetchEntertainment | actions/fetchEntertainment.ts | Brave Search + OSM fallback |
| geminiOCR | actions/geminiOCR.ts | Gemini Vision fallback |
| sendDueReminders | (planned) | Web Push via cron |

### Crons (2)
| Cron | Interval | Function |
|------|----------|----------|
| purge-poi-cache | 1 hour | internal.mutations.purgeExpiredCache |
| send-reminders | 5 min | internal.actions.sendDueReminders (planned) |

---

## 6. Baseline Tests

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| Unit (geo) | tests/unit/geo.test.ts | 4 | ✅ PASS |
| Unit (currency) | tests/unit/currency.test.ts | 2 | ✅ PASS |
| Unit (budget) | tests/unit/budget.test.ts | 5 | ✅ PASS |
| Unit (parse) | tests/unit/parse.test.ts | 6 | ✅ PASS |
| Unit (schema) | tests/unit/schema.test.ts | 1 | ✅ PASS |
| **Total Unit** | | **21** | **✅ 21/21 PASS** |
| E2E (a11y) | tests/e2e/a11y.spec.ts | 8 (4 pages × 2 modes) | ❌ 1 FAIL (`/explore` elderly) |
| E2E (explore) | tests/e2e/explore.spec.ts | 2 | ✅ PASS |
| E2E (reminders) | tests/e2e/reminders.spec.ts | 2 | ❌ 1 FAIL (heading) |
| E2E (tickets) | tests/e2e/tickets.spec.ts | 2 | ❌ 2 FAIL (heading + text) |
| **Total E2E** | | **14** | **❌ 4 FAIL, 10 PASS** |

---

## 7. Dependencies (No Secrets)

| Package | Purpose | Version |
|---------|---------|---------|
| convex | Backend client + server | 1.45.0 |
| next-pwa | PWA service worker | 5.6.0 |
| tesseract.js | OCR (WASM) | 7.0.0 |
| web-push | VAPID push notifications | 3.6.7 |
| leaflet + react-leaflet | Interactive maps | 1.9.4 / 5.0.0 |
| react-window | Virtualized lists | 2.3.1 |
| framer-motion | Animations | 13.3.0 |
| idb-keyval | IndexedDB wrapper | 6.3.0 |
| clsx + tailwind-merge | Class utilities | 2.1.1 / 3.7.0 |

**Secrets (not in repo, set via `npx convex env set`):**
- `GOOGLE_PLACES_API_KEY`
- `BRAVE_SEARCH_API_KEY` (optional)
- `GEMINI_API_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

---

## 8. Known Issues / Risks

| ID | Issue | Severity | Impact |
|----|-------|----------|--------|
| KI-001 | No git commits yet | Medium | No history baseline |
| KI-002 | Explore page uses MOCK_POIS (not live Convex data) | High | POI discovery not wired |
| KI-003 | Map markers not accessible (div not button, no aria-label) | Critical | WCAG 2.1 2.1.1 failure |
| KI-004 | Explore page missing h1 heading | Critical | WCAG heading-order, route announcer |
| KI-005 | Reminders page missing "Reminders" h1 | Critical | Playwright test failure + a11y |
| KI-006 | Tickets page heading structure unclear | High | Playwright test failure |
| KI-007 | TicketGallery empty text mismatch ("saved" vs "yet") | Low | Playwright test failure |
| KI-008 | Elderly mode a11y violations on /explore | Critical | Playwright a11y test failure |
| KI-009 | sendDueReminders action not implemented | Medium | Plan C Task C3 incomplete |
| KI-010 | PWA icons/manifest not verified | Medium | Lighthouse PWA score risk |
| KI-011 | CI/CD workflow not verified | Medium | Deploy pipeline risk |
| KI-012 | Convex project not linked (no .env.local with URL) | High | Backend not connected |

---

## 9. Initial Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Map accessibility requires significant refactor | High | High | Prioritize DEC-001/006/007 implementation |
| Convex deployment/env setup blocks integration testing | Medium | High | Set up Convex project early |
| Tesseract.js WASM loading in CI/Playwright | Low | Medium | Test in CI environment |
| VAPID push on iOS/Safari limitations | Medium | Low | Graceful fallback implemented in notify.ts |
| Lighthouse CI flakiness | Medium | Low | Run multiple times, median |