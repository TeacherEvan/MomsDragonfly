# Codebase State

## Run metadata
- Date: 2026-10-11
- Repository: Mom'sDragonfly
- Branch: main
- Commit: e6e15af
- Workflow version: 2.x.x

## Technology
- Language / runtime: TypeScript / Node.js 26.7.0
- Framework: Next.js 15.5.25 (App Router)
- Package manager: pnpm 12.4.2
- Database: Convex (realtime + actions + cron)
- Test tooling: Vitest (unit), Playwright (E2E), Lighthouse CI

## Baseline file inventory
| Path | Purpose | Relevance to this task |
|---|---|---|
| src/app/(tabs)/explore/page.tsx | Main explore page with POI list, map, onboarding | Core feature surface |
| src/app/(tabs)/local/page.tsx | Local tab (news/weather + dishes) | Recent feature |
| src/app/(tabs)/journal/page.tsx | Trip journal page | Recent feature |
| src/app/(tabs)/budget/page.tsx | Budget/expenses | Core feature |
| src/app/(tabs)/reminders/page.tsx | Reminders/days counter | Core feature |
| src/app/(tabs)/tickets/page.tsx | Ticket OCR + gallery | Core feature |
| src/app/(tabs)/settings/page.tsx | Settings + display prefs | Core feature |
| convex/schema.ts | Database schema (14 tables) | Backend foundation |
| convex/actions.ts | External API actions (Places, Overpass, Brave, OCR) | Backend actions |
| convex/queries.ts | Query functions | Data layer |
| convex/mutations.ts | Mutation functions | Data layer |
| convex/crons.ts | Scheduled functions | Background jobs |
| src/components/poi/POIList.tsx | Virtualized POI list | Core UI |
| src/components/poi/POICard.tsx | Individual POI card | Core UI |
| src/components/poi/PlaceDetailsSheet.tsx | Place detail modal | Recent feature |
| src/components/local/LocalClient.tsx | Local tab client | Recent feature |
| src/components/journal/JournalClient.tsx | Journal UI | Recent feature |
| src/components/ui/ConfirmDialog.tsx | Replaces native confirm/alert | Quality fix |
| src/components/ui/Icon.tsx | SVG icon system | Design system |

## Gate commands + exit codes
| Command | Purpose | Exit code | Notes |
|---|---|---|---|
| `pnpm typecheck` | TypeScript strict check | 0 | baseline clean |
| `pnpm lint` | ESLint check | 0 | 1 warning (tesseract-wrapper) |
| `pnpm test` | Unit tests | 0 | 153 tests passing |
| `pnpm build` | Production build | 0 | Clean build |
| `pnpm test:e2e` | Playwright E2E | 0 | 15 tests passing |

## Test counts
- Unit: 153 passing / 153 total
- Integration: 0 (included in unit)
- E2E (Playwright): 15 passing / 15 total
- Baseline conclusion: GREEN

## Git state
- Working tree: dirty (6 modified, 3 untracked)
- Untracked files: convex/_generated/ai/, scripts/deploy*.py
- Uncommitted changes: .agents/, .claude/, AGENTS.md, package.json, pnpm-lock.yaml, skills-lock.json
- Remote ahead/behind: 1 ahead (main has e6e15af not on origin/main)

## Dependencies / configuration
| Dependency / config | Version / value (non-secret) | Note |
|---|---|---|
| Next.js | 15.5.25 | |
| React | 18 | |
| Convex | 1.46.0 | |
| Tailwind CSS | 3.4.1 | |
| tesseract.js | 7.0.0 | Self-hosted assets in public/tesseract/ |
| Framer Motion | 13.3.0 | |
| Leaflet | 1.9.4 | |
| react-window | 2.3.1 | Virtualization |
| Vitest | 5.0.1 | |
| Playwright | 1.63.0 | |

## Known issues
- KI-002: Explore page uses MOCK_POIS locally (needs Convex deploy with env vars)
- KI-011: CI/CD workflow not verified against production
- KI-012: Convex project env vars need GOOGLE_PLACES_API_KEY, GEMINI_API_KEY, VAPID_* keys
- KI-015: PWA manifest/icons not fully verified on mobile
- KI-016: Design palette consistency audit needed (some components may use default Tailwind colors)
- Push notification keys (VAPID) not set in Convex dev env

## Initial risks
- Local dev points at stale Convex deployment (different-squid-155)
- Production Convex has invalid GEMINI_API_KEY (falls back to curated dishes for Pretoria/Bangkok)
- Bolt deep-link only works on Android Chrome (iOS falls back to website + clipboard)
- Self-hosted tesseract assets must be maintained manually