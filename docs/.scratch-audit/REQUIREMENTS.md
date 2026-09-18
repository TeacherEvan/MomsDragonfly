# Mom's Dragonfly — REQUIREMENTS.md

**Run ID:** `mdf-2026-09-18-001`  
**Generated:** 2026-09-18T18:35:00Z  
**Source:** Master plan (`docs/plans/2025-09-17-MomsDragonFly-Implementation.md`) + sub-plans + current test results

---

## 1. Request Restatement

Build a mobile-first PWA travel companion ("Mom's Dragonfly") with:
- Proximity-based verified POIs (10m → 20km+ radius) from Google Places, OSM Overpass, Brave Search
- Budget/expense tracking with multi-currency support
- Reminders with Web Push notifications (VAPID) + Convex cron
- Ticket/receipt storage with OCR (Tesseract.js offline + Gemini Vision fallback)
- Onboarding: intro video, slides, cookie consent, elderly mode toggle
- PWA: installable, offline-first, service worker, update banners
- **Completely free, no sign-in** — deviceId UUID in localStorage + Convex sync (24h TTL)
- WCAG AA + elderly mode (larger targets ≥56px, high contrast)

---

## 2. Functional Requirements

| ID | Requirement | Source | Acceptance Criteria |
|----|-------------|--------|---------------------|
| FR-001 | Project bootstrap: Next.js 14 + TS + Tailwind + pnpm + Convex | Plan A Task A1 | `pnpm build` succeeds, 0 TS errors |
| FR-002 | Convex schema with 7 tables (pois, userPrefs, locationHistory, expenses, budgets, reminders, tickets) | Plan A Task A2 | Schema exports; Vitest import test passes |
| FR-003 | Core types + utilities (NormalizedPOI, Expense, Reminder, Ticket, deviceId, geo, currency) | Plan A Task A3 | Unit tests pass (haversine, formatDistance, formatAmount) |
| FR-004 | Convex queries: poiQuery, prefsQuery, historyQuery, recentFetchCheck, expensesQuery, budgetQuery, remindersQuery, ticketsQuery | Plan A Task A4 + Plan B/C/D | Import tests pass; queries return correct types |
| FR-005 | Convex mutations: upsertPOIs, savePrefs, saveLocation, purgeExpiredCache, verifyPOI, addExpense, addBudget, addReminder, toggleReminder, deleteReminder, createTicket, deleteTicket | Plan A Task A5 + Plan B/C/D | Import tests pass; mutations execute |
| FR-006 | Convex actions: fetchGooglePlaces (rate-limited), fetchOverpass, fetchEntertainment, geminiOCR | Plan A Task A6/A7 + Plan D | Import tests pass; actions handle rate limits |
| FR-007 | Convex crons: purge POI cache hourly, send reminders every 5min | Plan A Task A7 + Plan C | Cron exports; interval config correct |
| FR-008 | Convex client + Providers wrapper | Plan A Task A8 | `convexClient` singleton; layout wraps children |
| FR-009 | Shell components: BottomNav (4 tabs), ElderlyModeToggle, CookieConsent, InstallPrompt, UpdateBanner, Toast | Plan A Task A9 + Plan E | Components render; toggle persists; consent stores flag |
| FR-010 | Map view: Leaflet + geolocation hook + POI markers with verify button | Plan A Task A10 | Map loads; markers show; verify increments count |
| FR-011 | POI list + filter + virtualized list (react-window) | Plan A Task A11/A12 | List renders; filter works; virtualized |
| FR-012 | Onboarding: IntroVideo, OnboardingSlides (3 slides), cookie consent, deviceId | Plan A Task A13/A14 | Intro plays once; slides animate; consent works |
| FR-013 | Settings page: elderly toggle, radius, currency, notifications | Plan A Task A15 | Settings persist to Convex userPrefs |
| FR-014 | Budget dashboard: BudgetRing (SVG donut), ExpenseForm, ExpenseList, budget math | Plan B Tasks B1-B3 | Ring animates; expenses CRUD; math tests pass |
| FR-015 | Reminders: ReminderForm, ReminderList, ReminderCard, DaysCounter, Web Push (VAPID) | Plan C Tasks C1-C3 | Reminders CRUD; cron sends push; days counter works |
| FR-016 | Tickets: TicketScanner (camera), OCR (Tesseract.js), parse (regex), Gemini fallback, TicketGallery, IndexedDB blobs | Plan D Tasks D1-D3 | Scan→OCR→parse→save; gallery shows; visual regression tests |
| FR-017 | PWA: next-pwa config, service worker, manifest (icons, maskable), offline.html, InstallPrompt, UpdateBanner | Plan E Tasks E1-E2 | Lighthouse PWA ≥90; install works; update banner shows |
| FR-018 | Accessibility: WCAG AA normal + elderly mode; Lighthouse a11y ≥95 | Plan E Task E2 + a11y tests | 0 critical violations on all pages (normal + elderly) |
| FR-019 | Testing: Vitest unit, Playwright E2E smoke, Lighthouse CI | Plan A Task A17 + Plan E | All tests pass; CI pipeline configured |

---

## 3. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | TypeScript strict mode | 0 `any`, 0 `@ts-ignore` |
| NFR-002 | Mobile-first tap targets | ≥44px normal, ≥56px elderly |
| NFR-003 | Contrast ratio | ≥4.5:1 both modes |
| NFR-004 | Google Places rate limit | ≤1 refresh/device/category/hour |
| NFR-005 | Convex cache TTL | 24 hours for POIs/tickets |
| NFR-006 | Build time | <60s on Vercel |
| NFR-007 | Bundle size (First Load JS) | <150 kB shared |
| NFR-008 | Lighthouse PWA score | ≥90 |
| NFR-009 | Lighthouse Performance | ≥75 |
| NFR-010 | Lighthouse Accessibility | ≥95 |
| NFR-011 | No secrets in client bundle | All server secrets via `npx convex env set` |

---

## 4. Constraints & Assumptions

| ID | Constraint / Assumption |
|----|-------------------------|
| C-001 | Node.js ≥20, pnpm package manager |
| C-002 | No authentication — deviceId only |
| C-003 | IndexedDB primary for blobs; Convex secondary (24h TTL) |
| C-004 | Google Places New API (batched, cached) |
| C-005 | Overpass API for OSM toilets/parks/pharmacies |
| C-006 | Brave Search optional for entertainment |
| C-007 | Tesseract.js WASM lazy-loaded for offline OCR |
| C-008 | Gemini Vision fallback when Tesseract confidence <60% |
| C-009 | Web Push VAPID keys generated via `npx web-push generate-vapid-keys` |
| C-010 | All Convex server secrets via env vars, never in code |
| C-011 | Each plan task ends with `git add <files> && git commit -m "..."` |
| C-012 | Commit prefixes: `feat:`, `chore:`, `fix:`, `test:` |
| C-013 | Sub-plan order: A → (B, C, D parallel) → E |

---

## 5. Acceptance Criteria Table (AC-XXX)

| AC-ID | Requirement | Verification Method | Evidence Required |
|-------|-------------|---------------------|-------------------|
| AC-001 | `pnpm build` succeeds | Build command exit code 0 | Build log |
| AC-002 | `pnpm test` (Vitest) passes | 21+ unit tests pass | Vitest output |
| AC-003 | `pnpm test:e2e` (Playwright) passes | 12/12 E2E tests pass | Playwright report |
| AC-004 | `pnpm test:lhci` passes | PWA≥90, Perf≥75, A11y≥95 | Lighthouse CI report |
| AC-005 | No critical a11y violations on `/explore` (elderly) | AxeBuilder with wcag2aa | Axe results |
| AC-006 | Reminders page shows "Reminders" heading | Playwright `getByRole('heading', {name: 'Reminders'})` | Screenshot |
| AC-007 | Tickets page shows "Tickets" heading | Playwright `getByRole('heading', {name: 'Tickets'})` | Screenshot |
| AC-008 | Empty ticket gallery shows "No tickets yet" | Playwright `getByText('No tickets yet')` | Screenshot |
| AC-009 | Elderly mode toggle persists | localStorage `mdf_elderly_mode` | DevTools inspection |
| AC-010 | Cookie consent shows once | localStorage `mdf_cookie_ok` | DevTools inspection |
| AC-011 | DeviceId generated on first visit | localStorage `mdf_device_id` | DevTools inspection |
| AC-012 | Map loads with POI markers | Visual + Playwright | Screenshot |
| AC-013 | Verify POI button increments count | Click + query `verifiedCount` | Convex dashboard |
| AC-014 | Budget ring animates on load | Visual + Framer Motion | Screenshot |
| AC-015 | Expense CRUD works | Playwright + Convex query | Convex dashboard |
| AC-016 | Reminder push notification sent | Cron log + Push API | Convex logs |
| AC-017 | Ticket OCR extracts date/amount/venue | Unit test + visual regression | Test output |
| AC-018 | Service worker caches assets | Lighthouse PWA audit | Lighthouse report |
| AC-019 | Install prompt appears | beforeinstallprompt event | DevTools |
| AC-020 | Update banner on SW update | Service worker lifecycle | DevTools |

---

## 6. Current Test Status (Baseline)

| Test Suite | Status | Pass | Fail | Notes |
|------------|--------|------|------|-------|
| Vitest (unit) | ✅ PASS | 21 | 0 | All passing |
| Playwright (E2E) | ❌ FAIL | 8 | 4 | 4 failures (see below) |
| Lighthouse CI | ⏳ PENDING | - | - | Not yet run |

### Playwright Failures (to fix):

1. **a11y.spec.ts:15** — `/explore` in elderly mode has critical accessibility violations
2. **reminders.spec.ts:3** — Reminders page missing "Reminders" heading (has "Your Schedule" h3)
3. **tickets.spec.ts:3** — Tickets page missing "Tickets" heading (h1 exists but not role=heading?)
4. **tickets.spec.ts:8** — Empty gallery shows "No tickets saved" not "No tickets yet"

---

## 7. Traceability

Each AC maps to plan tasks:
- AC-001→003 → Plan A Tasks A1-A3
- AC-004 → Plan A Task A17, Plan E Task E2
- AC-005 → Plan E Task E2 (accessibility audit)
- AC-006→008 → Plan A Task A11/A12, Plan D Task D2
- AC-009→011 → Plan A Task A9, A13
- AC-012→013 → Plan A Task A10, A11
- AC-014→015 → Plan B Tasks B1-B3
- AC-016 → Plan C Tasks C1-C3
- AC-017 → Plan D Tasks D1-D3
- AC-018→020 → Plan E Tasks E1-E2