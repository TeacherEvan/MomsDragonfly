# Requirement Traceability Matrix

**Run ID:** `mdf-2026-09-18-001`

| Objective | Requirement | Test / Evidence | Evidence Reference | Status |
|-----------|-------------|-----------------|-------------------|--------|
| OBJ-004 | FR-015, AC-006 | `RemindersClient.tsx` h1 added; build/type/unit pass | `docs/.scratch-audit/debrief.md` §6 | DONE |
| OBJ-005 | FR-016, AC-007 | `TicketsClient.tsx` h1 verified (line 123); build pass | `debrief.md` §6 | DONE |
| OBJ-006 | FR-016, AC-008 | `tests/e2e/tickets.spec.ts` updated to `"No tickets saved"`; build pass | `debrief.md` §6 | DONE |
| OBJ-007 | NFR-002/003, AC-005 | `globals.css` elderly variables verified; tailwind config verified; 30+ components use `var(--touch-target)` | `debrief.md` §6 | DONE |
| OBJ-002 | FR-010, AC-005 | `LeafletMap.tsx` updated (alt/title, keyboard nav, zoom controls); `POIMarker.tsx` semantic; build pass | `debrief.md` §6 | DONE |
| OBJ-003 | FR-011, AC-012 | `POIList.tsx` semantic list + aria-live; `POICard.tsx` show-on-map button; build pass | `debrief.md` §6 | DONE |
| OBJ-001 | FR-010/011, AC-012/013 | `explore/page.tsx` updated (h1, map ref, onShowOnMap); mock data preserved (live Convex blocked); build pass | `debrief.md` §6 | PARTIAL |
| OBJ-008 | FR-002-007, AC-001-003 | `convex/actions/*.ts` fixed (`"use node"`); `.env.local` has local Convex URL; `convex/dev` started; build/type pass | `debrief.md` §6 | PARTIAL (needs real keys) |
| OBJ-009 | FR-015, AC-016 | `convex/actions/sendDueReminders.ts` exists; `convex/crons.ts` has cron; `"use node"` added; blocked by backend | `debrief.md` §6 | PARTIAL |
| OBJ-010 | FR-017, AC-018-020 | Icons directory exists; `next-pwa.config.js` present; Lighthouse CI not run (blocked) | `debrief.md` §6 | PARTIAL |
| OBJ-011 | FR-019, AC-001/004 | `.github/workflows/deploy.yml` exists; `vercel.json` present; not verified (blocked) | `debrief.md` §6 | PARTIAL |
| OBJ-012 | All AC-001-020 | Unit/build/type PASS; E2E BLOCKED (Convex); Lighthouse BLOCKED; final gate incomplete | `debrief.md` §9/§10 | BLOCKED |

## Rule Verification

- Every completed objective (OBJ-002, 003, 004, 005, 006, 007) has evidence in `debrief.md` (§6) with file references.
- Every partial/blocked objective (OBJ-001, 008, 009, 010, 011, 012) has evidence showing what's complete and what's blocked.
- No requirement (FR-001 through FR-019) is marked satisfied without evidence.
- All 12 objectives trace to at least one REQUIREMENTS entry (see `ARCHITECTURE.md` AC Mapping and `TODO.md` Traceability).
