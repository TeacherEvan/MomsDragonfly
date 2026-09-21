# Mom's Dragonfly — Task Status / Todos Sheet

> **Last updated:** 2026-09-21  
> **Source:** `docs/.scratch-audit/CODEBASE_STATE.md` + recent commit `7f588a7`  
> **Purpose:** Reflect what has been done and what still needs doing — no hidden gaps.

---

## 1. Overall Project Status

|| Metric | Value | Status |
||--------|-------|--------|
|| Framework version | Next.js 15.5.25 | ✅ Confirmed |
|| TypeScript | Strict mode | ✅ Confirmed |
|| Build (`npm run build`) | Passes (0 errors) | ✅ Confirmed |
|| Type check (`npm run typecheck`) | Passes | ✅ Confirmed |
|| Unit tests (`npm test`) | 48 passing (post-commit update) | ✅ Confirmed |
|| E2E tests (`npm run test:e2e`) | 15 passing | ✅ Confirmed |
|| Lint (`npm run lint`) | Passes (1 warning: tesseract-wrapper) | ✅ Confirmed |
|| Design system (dragonfly palette) | Implemented in `tailwind.config.ts` + `theme/dragonfly.ts` | ✅ Completed `7f588a7` |
|| Premium onboarding (Splash → Video → Slides) | Implemented (`IntroVideoModal`, `SplashScreen`) | ✅ Completed `7f588a7` |
|| BottomNav flying dragonfly indicator | Implemented (`BottomNav.tsx`) | ✅ Completed `7f588a7` |
|| BudgetRing shimmer + glow pulse | Implemented (`BudgetRing.tsx`) | ✅ Completed `7f588a7` |
|| Skeleton loaders | Implemented (`Skeleton.tsx`) | ✅ Completed `7f588a7` |
|| ParticleCanvas animated backgrounds | Implemented (`ParticleCanvas.tsx`) | ✅ Completed `7f588a7` |

---

## 2. Sub-Plan Status (A → E)

Based on `docs/plans/2025-09-17-MomsDragonFly-Implementation.md` and `CODEBASE_STATE.md`.

### Plan A: Core + Location + Onboarding (20 tasks)

|| Task | File / Evidence | Status | Notes |
||------|-----------------|--------|-------|
|| A1–A5 | `convex/schema.ts` (7 tables), `client.ts`, `deviceId.ts` | ✅ DONE | Schema complete |
|| A6–A10 | `queries.ts` (10 funcs), `mutations.ts` (11 funcs) | ✅ DONE | All guarded by `validateDeviceId()` |
|| A11–A15 | `actions/` (5 funcs), `crons.ts` (2) | ✅ DONE | `"use node"` directives added |
|| A16 | `explore/page.tsx` (POI list + map) | ✅ DONE | `h1` added, `aria-label`, keyboard nav |
|| A17 | `map/LeafletMap.tsx`, `POIMarker.tsx` | ✅ DONE | `role="region"`, focus styles |
|| A18 | `poi/POIList.tsx`, `POICard.tsx` | ✅ DONE | Semantic list, `aria-live` |
|| A19 | `onboarding/IntroVideoModal.tsx`, `SplashScreen.tsx`, `OnboardingSlides.tsx` | ✅ DONE | Premium onboarding redesign `7f588a7` |
|| A20 | `shell/BottomNav.tsx`, `CookieConsent.tsx`, `InstallPrompt.tsx` | ✅ DONE | Flying dragonfly indicator `7f588a7` |

### Plan B: Budget + Expenses (3 tasks)

|| Task | Evidence | Status | Notes |
||------|----------|--------|-------|
|| B1 | `expenses`, `budgets` tables in schema | ✅ DONE | Schema added |
|| B2 | `BudgetDashboard`, `ExpenseForm`, `BudgetRing`, `ExpenseList` | ✅ DONE | Ring shimmer + glow added `7f588a7` |
|| B3 | Unit + integration tests (`budget.test.ts`) | ✅ DONE | 5 tests passing |

**Pending / Needs Doing:**
- No pending tasks for B — feature complete.

### Plan C: Reminders + Days Counter (3 tasks)

|| Task | Evidence | Status | Notes |
||------|----------|--------|-------|
|| C1 | `reminders` table, `addReminder`, `toggleReminder`, `deleteReminder` mutations | ✅ DONE | Schema + mutations |
|| C2 | `ReminderList`, `ReminderForm`, `ReminderCard`, `DaysCounter`, `notify.ts` | ✅ DONE | `select` labels (`id`/`htmlFor`) verified |
|| C3 | Integration + E2E (`reminders.spec.ts`) | ✅ DONE | 2/2 PASS |

**Pending / Needs Doing:**
- Push notification delivery requires `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` set in Convex env (not set in dev). `sendDueReminders` action exists but keys missing.

### Plan D: Ticket Storage + OCR (3 tasks)

|| Task | Evidence | Status | Notes |
||------|----------|--------|-------|
|| D1 | `tickets` table, `ocr.ts`, `parse.ts` | ✅ DONE | Schema + parsing |
|| D2 | `TicketScanner`, `TicketGallery`, `TicketCard`, `OCRResult` | ✅ DONE | Gallery + scanner |
|| D3 | Visual regression + OCR accuracy (`tests/unit/parse.test.ts`) | ✅ DONE | 6 tests passing |

**Pending / Needs Doing:**
- No pending tasks for D — feature complete.

### Plan E: PWA + Deploy + Accessibility (2 tasks)

|| Task | Evidence | Status | Notes |
||------|----------|--------|-------|
|| E1 | `public/sw.js`, `public/icons/`, `offline.html`, `manifest` | ⚠️ PARTIAL | Icons present; `public/sw.js` manual (next-pwa installed but config absent); `offline.html` present |
|| E2 | `.github/workflows/deploy.yml`, `vercel.json`, accessibility audit | ⚠️ PARTIAL | Workflow present (`deploy.yml`); `vercel.json` present; Lighthouse CI config (`lighthouserc.json`) present but not verified against production |

**Pending / Needs Doing:**
- Confirm `next-pwa` configuration (`next-pwa.config.js` not found) or verify manual SW works in production.
- Verify PWA install on mobile (post-deploy checklist item).
- Confirm Lighthouse PWA ≥ 90 score on production URL.
- Accessibility: `elderly` CSS variable (`html.elderly`) remains as harmless legacy; all UI/code references deleted per `AGENTS.md`. Large Text Mode active.

---

## 3. Recent Feature Changes (`7f588a7`) — Done vs Needs Doing

|| Change Area | What Was Done (`7f588a7`) | What Needs Doing |
||---------------|---------------------------|------------------|
|| Premium onboarding | `SplashScreen` (intro.jpg → tap → animation), `IntroVideoModal` (video + play/skipping), slides with Framer Motion | Verify video playback race condition fix works across browsers; confirm `localStorage.setItem("mdf_intro_seen")` analytics only (no suppression logic) |
|| Dark design system | `dragonfly` palette added to `tailwind.config.ts`; CSS variables (`--color-bg`, `--color-primary`, etc.) set; `theme/dragonfly.ts` created | Confirm all components use new palette (some components may still use default Tailwind colors — audit needed) |
|| BottomNav | Flying dragonfly indicator with spring animation (`motion.div`) | Ensure indicator works on mobile (touch targets ≥ 56px verified by CSS variables) |
|| BudgetRing | Gold/amber shimmer gradients, glow pulse at 80%+ budget usage | Confirm SVG rendering performance on low-end devices |
|| Skeleton loaders | `Skeleton.tsx` component; applied to `BudgetRing`, `POICard`, `ExpenseForm`, map, filter chips | Verify skeleton states load correctly for all components |
|| ParticleCanvas | `ParticleCanvas.tsx` (267 lines); animated dragonfly silhouettes + ambient particles | Confirm Canvas performance; add fallback for browsers without Canvas |
|| Tests | `BottomNav.test.ts` updated for `motion.div`-based nav | Confirm all E2E tests pass with new motion components (last verified: 48/48) |

---

## 4. Critical Pending Items (From Scratch Audit)

These are from `CODEBASE_STATE.md` §8 (Known Issues / Risks) and verified against current code.

|| ID | Issue | Status | Action Needed | Owner |
||----|-------|--------|---------------|-------|
|| KI-002 | Explore page uses MOCK_POIS | ⏳ PENDING | Needs Convex deploy (`npx convex dev` + env vars set) + live data from `fetchNearby` action | User / Evan (Convex setup) |
|| KI-011 | CI/CD workflow not verified | ⏳ PENDING | Confirm `.github/workflows/deploy.yml` runs on push; verify Vercel deploy triggers | User / Deployment |
|| KI-012 | Convex project not linked | ⏳ PENDING | `npx convex env set` for `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, `VAPID_*` keys; `pnpm convex deploy` | User / Evan |
|| KI-015 (new) | PWA manifest/icons not fully verified | ⚠️ PARTIAL | Confirm `manifest.webmanifest` valid; test install on mobile (Android Chrome, iOS Safari) | Post-deploy verification |
|| KI-016 (new) | Design palette consistency audit | ⚠️ PARTIAL | Confirm all components use `dragonfly` colors; replace any remaining default Tailwind colors | Developer audit |

---

## 5. Cross-References

- Full implementation plan: [`docs/plans/2025-09-17-MomsDragonFly-Implementation.md`](docs/plans/2025-09-17-MomsDragonFly-Implementation.md)
- Design spec (base): [`docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md`](docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md)
- Design spec (theming/onboarding): [`docs/superpowers/specs/2026-09-20-dragonfly-theming-design.md`](docs/superpowers/specs/2026-09-20-dragonfly-theming-design.md)
- Scratch audit: [`docs/.scratch-audit/CODEBASE_STATE.md`](docs/.scratch-audit/CODEBASE_STATE.md)
- Project overview: [`docs/project-plan.md`](project-plan.md)
