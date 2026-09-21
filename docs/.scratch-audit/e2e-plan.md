# E2E Remediation Plan — Playwright Tests

## Requirements (derived from code inspection)
- Tests must reference current component structure (SplashScreen, IntroVideoModal, BottomNav, headings)
- Tests must be executable against deployed site (`https://mom-s-dragonfly.vercel.app`) via `playwright.prod.config.ts`
- Tests must not rely on `localhost:3000` unless server is running
- All text expectations must match current JSX content

## Artifacts
- Source of truth: `tests/e2e/*.spec.ts`
- Component files: `src/components/*`, `src/app/(tabs)/*`


## Implementation Evidence (2026-09-21)
- Fixed tests/e2e/debug.spec.ts: updated 'Welcome to Mom' → 'Mom\'s Dragonfly', added splash overlay check
- Fixed tests/e2e/app-load.spec.ts: splash selector updated to [data-testid="splash-overlay"], video selector updated to [data-testid="video-modal-overlay"]
- Verified tests/e2e/reminders.spec.ts: 'Reminders' heading matches RemindersClient.tsx line 47
- Verified tests/e2e/tickets.spec.ts: 'Tickets' heading + 'No tickets saved' match source
- Verified tests/e2e/dashboards.spec.ts: all headings match BudgetDashboard (Trip Budget Tracker) + other pages
- Note: E2E tests require server (npm run start) or deployed URL (playwright.prod.config.ts) to execute fully
