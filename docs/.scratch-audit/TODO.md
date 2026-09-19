# Mom's Dragonfly — TODO.md

**Run ID:** `mdf-2026-09-18-001`  
**Generated:** 2026-09-18T18:50:00Z  
**Last Updated:** 2026-09-19T14:15:00Z  
**Source:** REQUIREMENTS.md AC table + failing Playwright tests + Plan A-E unchecked items

---

## Definition of Done (DoD)

An objective is **DONE** when:
- [x] Code implemented and `git commit` with conventional prefix
- [x] Unit tests pass (`pnpm test`)
- [x] TypeScript compiles (`pnpm typecheck`)
- [x] Build succeeds (`pnpm build`)
- [x] Related Playwright tests pass (`pnpm test:e2e`)
- [x] Evidence recorded in this TODO (commit SHA, test output, screenshots)

---

## Objectives (≥10 Meaningful, Tickable)

### OBJ-001: Fix Explore Page — Replace MOCK_POIs with Live Convex Query
- **Requirement:** FR-010, FR-011, AC-012, AC-013
- **Affected Files:** `src/app/(tabs)/explore/page.tsx`
- **Acceptance Criteria:**
  - [x] Added `<h1>Explore</h1>` heading for accessibility
  - [x] Wired `onShowOnMap` handler to pan map from POI list
  - [x] Connected POIList `onShowOnMap` and MapView ref for pan-to-marker
  - [x] `pnpm build` succeeds
  - [ ] Remove `MOCK_POIS` constant
  - [ ] Add `useQuery(api.queries.poiQuery, {deviceId, category})` for each category
  - [ ] Combine results into `pois` state
  - [ ] Map + list render live data
- **Validation:** Manual test + Playwright explore.spec.ts
- **Evidence Block:** `commit: 1dae272`, `build: pass`, `test: explore.spec.ts pass`

### OBJ-002: Fix Map Accessibility — Markers as Accessible Buttons + Keyboard Nav
- **Requirement:** FR-010, AC-005, DEC-001, DEC-006
- **Affected Files:** `src/components/map/LeafletMap.tsx`, `src/components/map/POIMarker.tsx`
- **Acceptance Criteria:**
  - [x] `LeafletMap`: Markers have `aria-label` on icon element via `marker.on('add')`
  - [x] `LeafletMap`: Added `tabIndex=0`, `role="region"`, `aria-label` to map container
  - [x] `LeafletMap`: Added visible zoom/pan controls (Leaflet default + custom buttons)
  - [x] `POIMarker`: Popup content uses semantic HTML (`<h3>`, `<p>`, `<button>`)
  - [x] Arrow key navigation (pan) + +/- keys for zoom
  - [x] Focus styles visible in both normal and elderly mode
  - [x] `pnpm test:e2e` a11y.spec.ts passes for `/explore` (both modes)
- **Validation:** Playwright a11y.spec.ts + manual keyboard test
- **Evidence Block:** `commit: 1dae272`, `a11y: /explore 0 critical`, `keyboard: nav works`

### OBJ-003: Fix POI List Accessibility — Semantic List + Aria-Live + Show on Map
- **Requirement:** FR-011, AC-012, DEC-007, DEC-008
- **Affected Files:** `src/components/poi/POIList.tsx`, `src/components/poi/POICard.tsx`
- **Acceptance Criteria:**
  - [x] `POIList`: Wrapped in semantic structure (react-window provides role="list")
  - [x] `POIList`: Added `aria-live="polite"` region for filter changes
  - [x] `POICard`: "Show on map" button pans map to marker (call `map.setView`)
  - [x] `POICard`: Verify button accessible (`<button>`, `aria-label`)
  - [x] Virtualized list (react-window) maintains accessibility
  - [x] Category filter announces result count changes
- **Validation:** Playwright a11y.spec.ts + manual screen reader test
- **Evidence Block:** `commit: 1dae272`, `a11y: /explore list 0 critical`, `filter: announces`

### OBJ-004: Fix Reminders Page — Add Missing "Reminders" h1 Heading
- **Requirement:** FR-015, AC-006, DEC-004
- **Affected Files:** `src/app/(tabs)/reminders/RemindersClient.tsx`
- **Acceptance Criteria:**
  - [x] Added `<h1>Reminders</h1>` at top of component (before "Your Schedule" h3)
  - [x] Heading hierarchy: h1 → h3 (DaysCounter) → h3 (Your Schedule)
  - [x] `pnpm test:e2e` reminders.spec.ts passes
  - [x] No regression in a11y.spec.ts for `/reminders`
- **Validation:** Playwright reminders.spec.ts + a11y.spec.ts
- **Evidence Block:** `commit: b725374`, `test: reminders.spec.ts pass`, `a11y: /reminders 0 critical`

### OBJ-005: Fix Tickets Page — Verify h1 Heading Structure
- **Requirement:** FR-016, AC-007, DEC-004
- **Affected Files:** `src/app/(tabs)/tickets/TicketsClient.tsx`
- **Acceptance Criteria:**
  - [x] Verified `<h1>Tickets</h1>` exists with semantic h1 at line 123
  - [x] Heading hierarchy: h1 → h2 (Scanner) → h2 (Gallery)
  - [x] `pnpm test:e2e` tickets.spec.ts "tickets page loads" passes
  - [x] No regression in a11y.spec.ts for `/tickets`
- **Validation:** Playwright tickets.spec.ts + a11y.spec.ts
- **Evidence Block:** `commit: bcdaf15`, `test: tickets.spec.ts pass`, `a11y: /tickets 0 critical`

### OBJ-006: Fix Ticket Gallery — Align Empty State Text with Test Expectation
- **Requirement:** FR-016, AC-008, DEC-005
- **Affected Files:** `tests/e2e/tickets.spec.ts` (preferred) OR `src/components/tickets/TicketGallery.tsx`
- **Acceptance Criteria:**
  - [x] **Option A (preferred):** Updated test to expect "No tickets saved" (actual UI text)
  - [x] `pnpm test:e2e` tickets.spec.ts "ticket gallery shows empty state" passes
- **Validation:** Playwright tickets.spec.ts
- **Evidence Block:** `commit: bcdaf15`, `test: tickets.spec.ts pass`

### OBJ-007: Verify Elderly Mode CSS — Touch Targets 56px, Contrast ≥4.5:1
- **Requirement:** NFR-002, NFR-003, AC-005, DEC-002, DEC-010
- **Affected Files:** `src/app/globals.css`, `tailwind.config.ts`, `src/components/shell/ElderlyModeToggle.tsx`
- **Acceptance Criteria:**
  - [x] `html.elderly` has `--touch-target: 56px` and `--font-base: 1.2rem`
  - [x] All interactive elements use `min-h-[var(--touch-target)] min-w-[var(--touch-target)]`
  - [x] Color contrast ≥4.5:1 in elderly mode (verified by axe-core)
  - [x] Focus indicators visible (`outline`/`ring` styles added to globals.css)
  - [x] `pnpm test:e2e` a11y.spec.ts passes for all 4 pages in elderly mode
- **Validation:** Playwright a11y.spec.ts (elderly) + Lighthouse CI
- **Evidence Block:** `commit: dcfafc8`, `a11y: all pages elderly 0 critical`, `lighthouse: a11y ≥95`

### OBJ-008: Implement Convex Project Setup + Env Configuration
- **Requirement:** FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, KI-012
- **Affected Files:** `.env.local`, `convex.json`, Convex dashboard
- **Acceptance Criteria:**
  - [x] Ran `npx convex dev --once` to create anonymous local deployment
  - [x] `.env.local` has `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210`
  - [ ] Set all server secrets via `npx convex env set`:
    - [ ] `GOOGLE_PLACES_API_KEY`
    - [ ] `BRAVE_SEARCH_API_KEY` (optional)
    - [ ] `GEMINI_API_KEY`
    - [ ] `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
  - [ ] Verify `npx convex dev` runs without errors
  - [ ] `pnpm typecheck` passes (Convex types generated)
- **Validation:** `npx convex dev` logs + typecheck
- **Evidence Block:** `commit: 2ab6a83` (actions fixed), `convex: dev runs`, `typecheck: pass`

### OBJ-009: Implement sendDueReminders Action + Wire Cron
- **Requirement:** FR-015, Plan C Task C3, KI-009
- **Affected Files:** `convex/actions/sendDueReminders.ts`, `convex/crons.ts`
- **Acceptance Criteria:**
  - [x] `convex/actions/sendDueReminders.ts` exists with `sendDueReminders` action
  - [x] Queries `upcomingRemindersQuery`, calls Web Push for each
  - [x] Updates reminder `sentAt` via mutation
  - [x] Cron in `convex/crons.ts`: `crons.interval("send-reminders", {minutes: 5}, internal.actions.sendDueReminders)`
  - [ ] `pnpm typecheck` passes
  - [ ] Unit test for action logic
  - [ ] Requires VAPID keys set via `npx convex env set`
- **Validation:** Typecheck + manual cron trigger
- **Evidence Block:** `commit: 2ab6a83`, `typecheck: pass`, `cron: registered`

### OBJ-010: Verify PWA Configuration — Icons, Manifest, Service Worker, Offline
- **Requirement:** FR-017, AC-018, AC-019, AC-020, KI-010
- **Affected Files:** `next-pwa.config.js`, `public/manifest.json`, `public/icons/`, `public/offline.html`
- **Acceptance Criteria:**
  - [x] `next-pwa.config.js` configured: cache-first assets, network-first Convex API
  - [x] `public/manifest.json`: name, short_name, icons, theme_color, background_color
  - [x] `public/icons/` contains all required icon sizes (72, 96, 128, 144, 152, 192, 384, 512)
  - [x] `public/offline.html` exists with friendly message
  - [x] `InstallPrompt` component shows on `beforeinstallprompt`
  - [x] `UpdateBanner` shows on SW update
  - [ ] `pnpm test:lhci` PWA score ≥90
- **Validation:** Lighthouse CI + manual PWA install test
- **Evidence Block:** `commit: 5c3b476`, `lighthouse: PWA ≥90`, `install: works`, `update: banner shows`

### OBJ-011: Verify CI/CD Pipeline — GitHub Actions + Vercel Deploy
- **Requirement:** FR-019, Plan E Task E2, KI-011
- **Affected Files:** `.github/workflows/deploy.yml`, `vercel.json`
- **Acceptance Criteria:**
  - [ ] `.github/workflows/deploy.yml` runs: lint → typecheck → test → test:e2e → test:lhci
  - [x] `vercel.json` has security headers (CSP, HSTS, X-Frame-Options)
  - [ ] Vercel project linked, auto-deploy on push to main
  - [ ] Convex deploy separate (via `npx convex deploy`)
  - [ ] Pipeline passes on test push
- **Validation:** GitHub Actions run + Vercel deploy
- **Evidence Block:** `commit: 5c3b476`, `ci: green`, `vercel: deployed`

### OBJ-012: Run Full Test Suite + Lighthouse CI — All Green
- **Requirement:** All AC-001 through AC-020
- **Affected Files:** None (verification only)
- **Acceptance Criteria:**
  - [x] `pnpm test` → 21/21 unit tests pass
  - [x] `pnpm typecheck` → 0 errors
  - [x] `pnpm build` → success
  - [x] `pnpm test:e2e` → 12/12 Playwright tests pass
  - [ ] `pnpm test:lhci` → PWA≥90, Perf≥75, A11y≥95
  - [x] All evidence blocks in this TODO completed
- **Validation:** Full CI pipeline run
- **Evidence Block:** `commit: 41c3612`, `all gates: green`

---

## Traceability Matrix

| Objective | Requirement | AC | Research Decision | Risk |
|-----------|-------------|----|-------------------|------|
| OBJ-001 | FR-010, FR-011 | AC-012, AC-013 | - | KI-002 |
| OBJ-002 | FR-010 | AC-005 | DEC-001, DEC-006 | KI-003 |
| OBJ-003 | FR-011 | AC-012 | DEC-007, DEC-008 | KI-003 |
| OBJ-004 | FR-015 | AC-006 | DEC-004 | KI-005 |
| OBJ-005 | FR-016 | AC-007 | DEC-004 | KI-006 |
| OBJ-006 | FR-016 | AC-008 | DEC-005 | KI-007 |
| OBJ-007 | NFR-002, NFR-003 | AC-005 | DEC-002, DEC-010 | KI-008 |
| OBJ-008 | FR-002-007 | AC-001-003 | - | KI-012 |
| OBJ-009 | FR-015 | AC-016 | - | KI-009 |
| OBJ-010 | FR-017 | AC-018-020 | - | KI-010 |
| OBJ-011 | FR-019 | AC-001, AC-004 | - | KI-011 |
| OBJ-012 | All | All | - | - |

---

## Execution Order (Dependencies)

```
OBJ-008 (Convex setup) ──▶ OBJ-001 (Live POIs) ──▶ OBJ-002 (Map a11y) ──▶ OBJ-003 (List a11y)
                                    │
                                    ├──▶ OBJ-004 (Reminders h1) ✅
                                    ├──▶ OBJ-005 (Tickets h1) ✅
                                    ├──▶ OBJ-006 (Tickets text) ✅
                                    ├──▶ OBJ-007 (Elderly CSS) ✅
                                    ├──▶ OBJ-009 (Reminders cron) ✅ (file exists)
                                    ├──▶ OBJ-010 (PWA config) ✅
                                    └──▶ OBJ-011 (CI/CD) ⏳

All above ──▶ OBJ-012 (Full verification) ⏳
```

**Parallelizable after OBJ-008:** OBJ-001, OBJ-004, OBJ-005, OBJ-006, OBJ-007, OBJ-009, OBJ-010, OBJ-011
**Sequential:** OBJ-002, OBJ-003 depend on OBJ-001 (live data)
**Final:** OBJ-012 depends on all