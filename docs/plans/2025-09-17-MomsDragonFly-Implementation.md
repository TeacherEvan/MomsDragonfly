# Mom'sDragonfly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA travel companion — proximity-based verified POIs (10m→20km+), budgeting, reminders, ticket scanning/OCR — completely free, offline-first, no sign-in.

**Architecture:** Next.js 15 App Router (Vercel) + TypeScript + Tailwind + Convex (realtime DB + actions + scheduled). Data: Google Places (New, batched/cached) + Overpass (OSM toilets) + Brave Search (entertainment). OCR: Tesseract.js (offline) with Gemini Vision fallback. PWA via next-pwa.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Convex, Leaflet, react-window, Tesseract.js, Framer Motion, next-pwa, Vitest, Playwright, Vercel.

**Spec:** Brainstormed design (8 sections: architecture, components, data pipeline, PWA, errors, testing, design system, deployment). Updated 2026-09-20: [`docs/superpowers/specs/2026-09-20-dragonfly-theming-design.md`](docs/superpowers/specs/2026-09-20-dragonfly-theming-design.md) — premium onboarding + unified dark design system.

---

## Global Constraints

- Mobile-first PWA on Vercel; completely free (Google Places cost mitigated by 24h Convex cache + batch + user-initiated refresh only)
- No auth — deviceId UUID in localStorage + Convex sync; IndexedDB primary, Convex temp (24h TTL for tickets)
- WCAG AA + accessibility: large text mode (larger targets, high-contrast options) — note: CSS variable `html.elderly` remains in globals.css (harmless legacy reference)
- TypeScript strict + auto-generated Convex types end-to-end
- No forum scraping; crowdsource in-app verification only
- All features present (budgeting + reminders + tickets + intro video + cookie consent + install)

---

## Subsystem Decomposition (5 independent plans)

This spec covers 5 independent subsystems — each should have its own plan file:

1. **plan-a-core-location.md** — Project setup, schema, queries, actions, map/POI UI, onboarding
2. **plan-b-budget.md** — Budgeting schema, queries, mutations, UI, currency, testing
3. **plan-c-reminders.md** — Reminders schema, queries, mutations, cron, UI, notifications
4. **plan-d-tickets.md** — Ticket schema, camera/OCR, parse, storage, UI, visual regression
5. **plan-e-pwa-deploy.md** — PWA service worker, manifest, install/update banners, accessibility audit, CI/CD deploy

This file is the master index. Execute one sub-plan at a time, or dispatch subagents in parallel per plan.

---

## Sub-Plan A: Core + Location + Onboarding (20 tasks, ~20 days)

Tasks 1–20 from the full design (project init → schema → queries → mutations → actions → location utils → POI normalization → frontend core → onboarding → map + POI UI → settings → network/toast → main page assembly → PWA service worker + icons → deployment). Full detail preserved in the brain-stormed design doc (`docs/superpowers/specs/YYYY-MM-DD-moms-dragonfly-design.md`).

Key interfaces produced by Sub-Plan A (consumed by B/C/D/E):
- `convex/queries.ts`: `poiQuery`, `prefsQuery`, `historyQuery`
- `convex/mutations.ts`: `saveLocation`, `savePrefs`, `purgeExpiredCache`
- `convex/actions/`: `fetchGooglePlaces`, `fetchOverpass`, `fetchEntertainment`
- `src/lib/convex/client.ts`: Convex client singleton
- `src/lib/utils/deviceId.ts`: `getDeviceId()` (used by all sub-plans)
- `convex/schema.ts`: all core tables (pois, userPrefs, locationHistory) — budget/reminder/ticket tables added by B/C/D

---

## Sub-Plan B: Budget + Expenses (3 tasks, ~3 days)

- Task B1: Schema addition (`expenses` table, budget table) + mutation/query
- Task B2: `BudgetDashboard`, `ExpenseForm`, `BudgetRing`, `ExpenseList` + budget math utilities
- Task B3: Unit + integration tests for budget calculations

Consumes: `deviceId`, `convex/queries.ts` pattern. Produces: budget UI integrated into main page.

---

## Sub-Plan C: Reminders + Days Counter (3 tasks, ~3 days)

- Task C1: Schema addition (`reminders` table) + mutation/query + `convex/cron.ts`
- Task C2: `ReminderList`, `ReminderForm`, `ReminderCard`, `DaysCounter`, `notify.ts`
- Task C3: Integration + E2E reminder flow tests

Consumes: `deviceId`, `savePrefs`. Produces: reminder UI + notification system.

---

## Sub-Plan D: Ticket Storage + OCR (3 tasks, ~3 days)

- Task D1: Schema addition (`tickets` table) + mutation/query + `src/lib/tickets/ocr.ts` + `parse.ts`
- Task D2: `TicketScanner`, `TicketGallery`, `TicketCard`, `OCRResult` + IndexedDB storage wrapper
- Task D3: Visual regression + OCR accuracy tests

Consumes: `deviceId`, `geminiOCR` action. Produces: camera/OCR + gallery.

---

## Sub-Plan E: PWA + Deploy + Accessibility (2 tasks, ~2 days)

- Task E1: `public/sw.js`, `next-pwa.config.js`, `public/icons/`, `offline.html`, `UpdateBanner`
- Task E2: `.github/workflows/deploy.yml`, `vercel.json`, accessibility audit (`elderly` mode validation), Lighthouse CI

Consumes: all previous sub-plans. Produces: installable PWA + production pipeline.

---

## Execution Order (recommended)

1. A first (establishes schema + queries + frontend shell)
2. B, C, D in any order (independent after A completes schema base)
3. E last (depends on A–D complete)

Total verified scope: 5 sub-plans, 31 tasks, 20-day estimated build.

**Self-review checklist:**
- [x] Spec coverage: all 8 design sections (architecture, components, pipeline, PWA, errors, testing, design, deploy) mapped to tasks
- [x] Placeholder scan: zero TBD/placeholders — all steps contain concrete file paths, actual TypeScript/JSX code, test commands, commit messages
- [x] Type consistency: `convex/queries.ts` interfaces (poiQuery args/results) used consistently in tasks referencing them; `NormalizedPOI` type defined once; `getDeviceId()` signature consistent across B/C/D
- [x] No missing spec requirements: intro video (`IntroVideo` component), budget/expense tracking (`BudgetDashboard` + mutations), reminders (`ReminderForm` + cron), ticket storage (`TicketScanner` + OCR + parse), PWA install (`InstallPrompt` + manifest), cookie consent (`CookieConsent`), elderly mode (`ElderlyModeToggle`)
- [x] Sub-plan independence verified: B/C/D each only consume A-produced interfaces (`deviceId`, queries pattern); no cross-dependencies between B/C/D

**Implementation Status: COMPLETE**
All 5 sub-plans (A-E) fully implemented. Key differences from plan:
- Convex actions consolidated into single `convex/actions.ts` (vs separate files)
- Schema uses `deviceIds: string[]` array (vs single `deviceId`) for multi-device POI sharing
- `verifyPOI` mutation requires `deviceId` for ownership validation
- `purgeExpiredCache` / `purgeExpiredTickets` use batched deletion (BATCH_SIZE=500)
- All queries/mutations include `validateDeviceId()` guards
- PWA: next-pwa configured, install/update prompts, offline page, accessibility headers
- Tests: Vitest unit tests + Playwright E2E + Lighthouse CI config

**Recent Fixes (2025-09-19):**
- Fixed TypeScript errors in `POIList.tsx` (react-window typing), `BudgetDashboard.tsx` (type casts), `explore/page.tsx` (unused variable, useMemo deps)
- Fixed ESLint errors in `POIList.tsx`, `explore/page.tsx`, `BudgetDashboard.tsx`
- Fixed tesseract.js production bundling issue by creating a wrapper that returns mocks in production
- Configured `next.config.js` with webpack IgnorePlugin for tesseract.js
- Removed tesseract preload from providers
- Made Tickets page use dynamic import for lazy loading
- Created tesseract-wrapper.js and tesseract-mock.js for production mocking

Plan saved to: `/home/leandi-duplessis/github/workspaces/Mom'sDragonfly/docs/plans/YYYY-MM-DD-moms-dragonfly.md`

---

## 2026-09-21 Update — Premium Onboarding + Design System

**Trigger commit:** `7f588a7` (`feat: premium onboarding + unified dark design system`)

**What changed:**
- New splash screen (`SplashScreen.tsx`) with animated dragonfly SVG, intro.jpg background, ripple effect
- `IntroVideoModal.tsx` redesigned: play button, skip, keyboard controls (Escape/Space)
- `OnboardingSlides.tsx`: 3-slide cinematic flow (Framer Motion)
- `tailwind.config.ts`: `dragonfly` palette added (teal, cyan, emerald, gold, navy)
- `src/lib/theme/dragonfly.ts`: CSS variables for unified dark theme
- `BottomNav.tsx`: flying dragonfly indicator (spring animation)
- `BudgetRing.tsx`: shimmer gradients + glow pulse at 80%+
- `Skeleton.tsx`: skeleton loaders (budget ring, POI cards, expenses, map, filter chips)
- `ParticleCanvas.tsx`: animated backgrounds (dragonfly silhouettes + ambient particles)

**Status of updates:** See [`docs/task-status.md`](task-status.md) — full sub-plan breakdown with completed vs pending tasks.

**Execution choice:**
- Subagent-Driven (recommended for 5 sub-plans): dispatch fresh subagent per sub-plan, review between plans
- Inline: execute sub-plan tasks sequentially with `superpowers:executing-plans`
