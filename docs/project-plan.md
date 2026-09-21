# Mom's Dragonfly — Project Plan

> **Status:** Created 2026-09-21 to satisfy documentation-maintenance checklist. Prior absence noted explicitly.
> **Trigger:** Recent feature commit `7f588a7` (`feat: premium onboarding + unified dark design system`) changed design behavior and UI components.

---

## 1. Project Overview

Mobile-first PWA travel companion — proximity-based verified POIs, budgeting, reminders, ticket OCR — completely free, offline-first, no sign-in.

**Framework:** Next.js 15 App Router (Vercel)  
**Database:** Convex (realtime + actions + scheduled functions)  
**Design system:** Dragonfly palette (teal, cyan, emerald, gold, navy) — unified in `tailwind.config.ts` and `src/lib/theme/dragonfly.ts`  
**Accessibility:** WCAG AA + Large Text Mode (CSS variable `html.elderly` remains as harmless legacy reference)

---

## 2. Recent Feature Changes (as of 2026-09-21)

| Change | Commit | Impacted Files |
|--------|--------|----------------|
| Premium onboarding (Splash → Video → Slides) | `7f588a7` | `IntroVideoModal.tsx`, `SplashScreen.tsx`, `layout.tsx` |
| Unified dark design system (dragonfly palette) | `7f588a7` | `tailwind.config.ts`, `globals.css`, `theme/dragonfly.ts` |
| BottomNav flying dragonfly indicator | `7f588a7` | `BottomNav.tsx` |
| BudgetRing shimmer gradients + glow pulse | `7f588a7` | `BudgetDashboard.tsx`, `BudgetRing.tsx` |
| Skeleton loaders | `7f588a7` | `Skeleton.tsx`, `POICard`, budget components |
| ParticleCanvas animated backgrounds | `7f588a7` | `ParticleCanvas.tsx` |

---

## 3. Implementation Plan Reference

Full task breakdown: [`docs/plans/2025-09-17-MomsDragonFly-Implementation.md`](docs/plans/2025-09-17-MomsDragonFly-Implementation.md)  
Sub-plan specs (superpowers):
- A — Core + Location: [`docs/superpowers/plans/plan-a-core-location.md`](docs/superpowers/plans/plan-a-core-location.md)
- B — Budget: [`docs/superpowers/plans/plan-b-budget.md`](docs/superpowers/plans/plan-b-budget.md)
- C — Reminders: [`docs/superpowers/plans/plan-c-reminders.md`](docs/superpowers/plans/plan-c-reminders.md)
- D — Tickets: [`docs/superpowers/plans/plan-d-tickets.md`](docs/superpowers/plans/plan-d-tickets.md)
- E — PWA + Deploy: [`docs/superpowers/plans/plan-e-pwa-deploy.md`](docs/superpowers/plans/plan-e-pwa-deploy.md)

Design specs:
- 2026-09-17 base design: [`docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md`](docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md)
- 2026-09-20 theming/onboarding redesign: [`docs/superpowers/specs/2026-09-20-dragonfly-theming-design.md`](docs/superpowers/specs/2026-09-20-dragonfly-theming-design.md)

---

## 4. Key Interfaces

- `NormalizedPOI` (`src/types/index.ts`) — consumed by ExplorePage, MapView, POIList, POICard
- `Expense` / `Budget` (`convex/schema.ts`) — consumed by BudgetDashboard, ExpenseForm, ExpenseList
- `Reminder` (`convex/schema.ts`) — ReminderList, ReminderForm, DaysCounter
- `Ticket` (`convex/schema.ts`) — TicketScanner, TicketGallery, OCRResult
- `getDeviceId()` (`src/lib/utils/deviceId.ts`) — used by all components; no auth
- `convexClient` (`src/lib/convex/client.ts`) — singleton used by providers and all queries/mutations

---

## 5. Dependencies & License

- MIT License — see [`LICENSE`](LICENSE)
- No dependency change in recent feature commit; `next` at 15.5.25 (see `.repomedic_report.md`)
- No `NOTICE` file present; no additional license footprint from new design/theme code

---

## 6. Cross-Reference Check

- [x] Plan sync: this file references `docs/plans/` and superpower specs
- [x] Content docs: README updated; `docs/superpowers/specs/` linked
- [x] Legal/compliance: MIT unchanged; dependency note included
- [x] Scaffolding: `docs/index.md` created (see below)
- [x] Cross-reference: links between plans, specs, README, `docs/task-status.md` confirmed
- [ ] Verification: links render at deploy time (no production server available in this session — gap documented)
