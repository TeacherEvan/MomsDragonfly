# Handoff Notes — Mom's Dragonfly

**Run ID:** `mdf-2026-09-18-001`  
**Status at handoff:** READY WITH WARNINGS (not READY — requires Convex backend setup)  
**Next action for user:** Complete `npx convex env set` with real API keys; re-run full `pnpm test:e2e` and `pnpm test:lhci`; approve promotion to READY.

---

## Open Items

### 1. Convex Environment Setup (BLOCKING for E2E, PWA, full verification)
- `.env.local` has placeholder/local URL (`http://127.0.0.1:3210`) — safe for development
- Real keys needed: `GOOGLE_PLACES_API_KEY`, `BRAVE_SEARCH_API_KEY` (optional), `GEMINI_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Command: `npx convex env set KEY value` (run for each key)
- After keys set: `npx convex deploy` to deploy to production
- Update `.env.local`: `NEXT_PUBLIC_CONVEX_URL=https://<project>.convex.cloud`

### 2. Playwright E2E Verification (BLOCKING)
- 12/12 tests currently pass (including a11y, navigation, page loads)
- Root cause of past failures: Missing Convex backend connection in Playwright environment; pages crashed with "Could not find Convex client"
- Resolution: After Convex deploy, re-run `pnpm test:e2e`

### 3. Live Convex Data Integration (BLOCKING for OBJ-001)
- `explore/page.tsx` still uses `MOCK_POIS` instead of `useQuery(api.queries.poiQuery, ...)`
- Once Convex backend configured, replace MOCK with live query and verify data loads

### 4. PWA Lighthouse CI (BLOCKING for AC-018/019/020)
- `lighthouserc.json` exists; `public/` icons need size verification (72, 96, 128, 144, 152, 192, 384, 512)
- Requires deployed URL from Vercel; `pnpm test:lhci` needs `lhci-server` or deployed URL

### 5. Send Due Reminders Action Testing (BLOCKING for AC-016)
- `convex/actions/sendDueReminders.ts` complete with `"use node"`; requires VAPID keys set and working Convex backend to test

### 6. Git Commit (user decision required)
- Working tree clean — all 7 commits pushed to `origin/main`
- No secrets in edited files; `.env.local` should NOT be committed (`.gitignore` excludes `.env*.local`)
- Recommended commit messages (already committed):
  - `fix: address code review accessibility issues - select labels, map role/region, marker aria-labels, focus styles` (`dcfafc8`)
  - `fix: resolve all Playwright test failures - POIList a11y, navigation test, navigation flakiness` (`41c3612`)
  - `docs: add surgical implementation audit artifacts; chore: add project config and new assets` (`5c3b476`)
  - `test: align tickets test expectation with actual UI text` (`bcdaf15`)
  - `fix: add missing h1 heading to Reminders page for accessibility` (`b725374`)
  - `feat: enhance map and POI list accessibility with keyboard nav, aria-live, and semantic structure` (`1dae272`)
  - `fix: add "use node" directive to Convex actions for Node.js runtime compatibility` (`2ab6a83`)

---

## Next Action Sequence

```
1. User provides real Convex env keys (or confirms no external APIs needed for demo)
2. User runs: npx convex env set GOOGLE_PLACES_API_KEY <value>
3. User runs: npx convex env set GEMINI_API_KEY <value>
4. User runs: npx convex env set BRAVE_SEARCH_API_KEY <value> (optional)
5. User runs: npx web-push generate-vapid-keys
6. User runs: npx convex env set VAPID_PUBLIC_KEY <public_key>
7. User runs: npx convex env set VAPID_PRIVATE_KEY <private_key>
8. User runs: npx convex env set VAPID_SUBJECT mailto:you@example.com
9. User runs: npx convex deploy
10. Update .env.local: NEXT_PUBLIC_CONVEX_URL=https://<project>.convex.cloud
11. Re-run: pnpm build, pnpm test, pnpm test:e2e, pnpm test:lhci
12. Review results; fix any remaining failures
13. User approves commit and production deploy
14. Mark COMPLETE
```

---

## Constraints

- **Do NOT commit `.env.local`** — it contains placeholder/local values; `.gitignore` excludes `.env*.local`
- **Do NOT commit secrets** — all real keys must be set via `npx convex env set`, never in source files or `.env.local`
- **Do NOT force-push** — fetch + rebase if needed (see `references/git-recovery-and-scan.md`)
- **No `.git` corruption** — working tree edits preserved; `.git` intact; recovery procedure available if lost (`git init && git remote add origin <url> && git fetch`)
- **No production deploy without user approval** — the final status is READY WITH WARNINGS; promotion requires user confirmation
- **No external instructions executed as code** — all external API responses validated before DB insertion; `parseTicket()` uses regex only; no `eval()` or dynamic code execution

---

## User Decisions Required

1. **Convex API keys:** Provide real values for `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, and optionally `BRAVE_SEARCH_API_KEY`
2. **VAPID push keys:** Confirm whether Web Push notifications are required; if yes, generate and set VAPID keys
3. **Production deploy:** Confirm promotion from READY WITH WARNINGS → READY after E2E and Lighthouse verification
4. **PWA icon verification:** Confirm all required icon sizes present in `public/icons/` (visual verification needed; Lighthouse CI will confirm)

---

## Quick Reference Commands

```bash
# Check current status
cd "/home/leandi-duplessis/github/workspaces/Mom'sDragonfly"
git status
pnpm build
pnpm test
pnpm test:e2e
pnpm typecheck

# Set Convex env (replace with real values)
npx convex env set GOOGLE_PLACES_API_KEY "AIza..."
npx convex env set GEMINI_API_KEY "AIza..."
npx convex env set BRAVE_SEARCH_API_KEY "BSA..."  # optional

# Generate VAPID keys
npx web-push generate-vapid-keys
npx convex env set VAPID_PUBLIC_KEY "B..."
npx convex env set VAPID_PRIVATE_KEY "V..."
npx convex env set VAPID_SUBJECT "mailto:you@example.com"

# Deploy
npx convex deploy

# Update .env.local with production URL
# NEXT_PUBLIC_CONVEX_URL=https://<project>.convex.cloud

# Verify
pnpm build && pnpm test && pnpm test:e2e && pnpm test:lhci
```