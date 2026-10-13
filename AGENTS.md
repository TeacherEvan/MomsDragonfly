# Mom's Dragonfly — Agent Instructions

PWA travel companion (Next.js 15 + Convex + TypeScript). Offline-first, no auth — device identity is a UUID `deviceId` in localStorage.

## Dev Environment

```bash
pnpm install
cp .env.local.example .env.local    # NEXT_PUBLIC_CONVEX_URL + NEXT_PUBLIC_CONVEX_SITE_URL (+ VAPID public key)
npx convex dev                      # local backend at :3210 — needs Node 20/22/24 (see Pitfalls)
pnpm dev                            # Next.js dev server at :3000 (webpack; Turbopack opt-in via --turbopack)
```

## Commands (all re-verified 2026-10-13)

| Command | Status | Notes |
|---------|--------|-------|
| `pnpm build` | ✅ passes | Next.js 15.5.27, compiles in ~5 s; runs lint + typecheck inline |
| `pnpm lint` | ✅ passes | `next lint` (deprecation warning is expected — removed in Next 16); import sort enforced; covers `src`, `convex`, `convex-test`, `tests` |
| `pnpm typecheck` | ✅ passes | `tsc --noEmit` (root tsconfig covers `src`, `convex`, `tests`) |
| `pnpm test` | ✅ passes | 159 tests / 21 files (Vitest + jsdom), ~11 s |
| `pnpm test:convex` | ✅ passes | 23 tests / 2 files (convex-test), <1 s |
| `pnpm test:e2e` | ✅ passes | 22 Playwright tests, ~55 s (Pixel 5 emulation). Needs `pnpm build` first + a reachable Convex backend |
| `pnpm test:lhci` | ⚠️ needs a local flag | Lighthouse CI on the built app. Accessibility is the enforced gate (≥0.95, passing); performance is advisory (~0.54 vs 0.75 here). See Pitfalls |

## Project Structure

```
src/app/(tabs)/   explore, local, journal, budget, reminders, tickets, settings
src/components/   shell, map, poi, journal, ride, explore, budget, reminders, tickets, onboarding
src/hooks/        useGeolocation, useTripJournal, useDisplayPrefs
src/lib/          utils/* + idb, images, journal, notify, push, ride, theme, tickets
convex/           schema, queries, mutations, actions, crons, http (place-photo proxy); _generated/ is COMMITTED
convex-test/      integration harness — real functions against the real schema
tests/unit/       Vitest (jsdom)    ·    tests/e2e/  Playwright (chromium)
public/           icons, manifest, sw.js, offline.html, tesseract/ (self-hosted OCR)
android/          TWA shell (bubblewrap) — see android/README.md
```

## Key Conventions

- **Identity & client**: `getDeviceId()` (`src/lib/utils/deviceId.ts`) — UUID in localStorage, no auth; Convex client created in `src/app/providers.tsx`.
- **Path aliases / TS**: `@/*` → `src/*`; strict mode in both tsconfigs.
- **Import order**: enforced by `simple-import-sort` (`.eslintrc.json`). Never hand-sort — autofix with `pnpm lint -- --fix`. `convex/_generated/` is exempt: its exact ordering comes from codegen and must never be re-sorted.
- **PWA**: hand-rolled service worker at `public/sw.js` (no next-pwa dependency). It skips cross-origin requests entirely (map tiles go straight to the network); app shell + intro media cached.
- **CSP / headers**: single source of truth is `next.config.js` (`headers()` applies on Vercel and `next start`). Don't re-add duplicate header config. Loopback Convex origins (:3210/:3211) are permitted via env-derived logic — without it local dev cards stay empty.
- **Place photos**: proxied by the Convex HTTP route `GET /place-photo` (`convex/http.ts`, site deployment): the Google key stays server-side and `ref` is regex-validated (not an open proxy).
- **Push notifications**: Settings → `src/lib/notify.ts` → `POST/DELETE /api/push` (validated in `src/lib/push/request.ts`) → `userPrefs.vapidSubscription` → cron `sendDueReminders` via `web-push` (prunes dead endpoints, honors `notificationsEnabled`). Needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + Convex env `VAPID_*`.
- **Tesseract OCR**: fully self-hosted under `public/tesseract/` — worker, core, `eng.traineddata.gz`. No mock, no bundler alias; keep the asset dir in sync (see Pitfalls).
- **Map**: react-leaflet; inline-SVG `L.divIcon` pins (no external marker images); failed tiles retry ×3 with backoff, then a calm placeholder. `trail` prop = journal polyline (orange) + start/end markers + fit-bounds.
- **Trip Journal**: auto-records device-scoped pins after `prefs.tripStartDate` (`src/hooks/useTripJournal.ts`; sampling policy in `src/lib/journal/stats.ts` — ≥150 m movement, ≥10 min check-in, 2 min jitter guard). UI = `JournalClient.tsx` (day-grouped timeline + trail map).
- **Journal sharing**: `shareEnabled`/`shareToken` (+`shareTokenCreatedAt`) with `enableShare`/`disableShare`/`rotateShare`; public read-only `shareView` is token-gated, strips `deviceId`, and uses bounded takes. Live view at `/share/[token]`; GPX/GeoJSON export in `src/lib/journal/share.ts`.
- **Location highlights**: `actions.getHighlights` (Open-Meteo + Nominatim + Brave) cached ~30 min per ~1 km cell in `highlightsCache`; UI = `HighlightsCard.tsx`.
- **Local dishes**: `actions.getLocalDishes` (Gemini) — pure parsing + curated fallbacks in `convex/dishHelpers.ts` (unit-tested in `tests/unit/dishes.test.ts`), Wikipedia imagery via `convex/wikiHelpers.ts`, cached in `dishesCache`.
- **Ride requests**: clipboard-copy the destination first, then launch Bolt via `buildBoltLaunch(ua)` (`src/lib/ride/links.ts`) — Android Chromium gets an assetlinks-verified `intent://`; iOS/desktop/Firefox get `bolt.eu`. Google Maps directions as fallback. Bolt publishes no consumer booking API — don't promise prefilled rides.
- **Display prefs**: `mdf-display-prefs` in localStorage (`largeText`/`reduceMotion`/`highContrast`) applied as `html` classes by `useDisplayPrefs`; UI = Settings → Display & Layout. `html.elderly` is a legacy cosmetic alias for large text.
- **Icons**: regenerate with `node generate-dragonfly-icons.js && node convert-icons.mjs` (sharp).
- **Design system**: `dragonfly` palette in `tailwind.config.ts` + `src/lib/theme/dragonfly.ts`; orange is the accent for active nav, ride CTAs, journal trail.
- **Currency**: always derive from `userPrefs.currency` via `resolveCurrency()` (`src/lib/utils/currency.ts`). A budget doc's own `currency` field is legacy fallback only — never read it directly for display.

## Convex Backend

- **Schema**: `convex/schema.ts` — pois, userPrefs, locationHistory, journalNotes, highlightsCache, dishesCache, placeEnrichCache, expenses, budgets, reminders, tickets.
- **Guards & bounds**: `validateDeviceId()` on every public query/mutation. Cron/cache-only functions are `internalQuery` (`upcomingRemindersQuery`, `getHighlightsCache`, `getDishesCache`, `getPlaceEnrichCache`). List reads are bounded via `convex/limits.ts` (`MAX_*`) — never reintroduce unbounded `.collect()`. Public queries must never return raw docs containing `deviceId` — allow-list fields (see `shareView`).
- **Actions**: `convex/actions.ts` (`"use node"`) — Google Places, Overpass, Brave, Gemini.
- **Crons**: `convex/crons.ts` — purge POIs hourly, send due reminders every 5 min, purge tickets hourly (BATCH_SIZE=500).
- **Env secrets** (via `npx convex env set`): `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, `BRAVE_SEARCH_API_KEY` (optional), `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`, `GEMINI_MODEL`. Read `convex/_generated/ai/guidelines.md` before editing Convex code.

## Testing Notes

- Unit: `tests/setup.ts` (jsdom + Testing Library). Convex: `convex-test/helpers.ts` calls the REAL functions against the REAL schema — never fork a schema copy; the module map is explicit because `import.meta.glob` isn't available in externalized deps.
- E2E: `playwright.config.ts` — Pixel 5, single chromium project; its webServer runs `npm run start` on :3000. `app-load` and `dashboards` assert zero console errors, so a reachable Convex backend is required or they fail on WebSocket connection-refused.
- CI: `.github/workflows/ci.yml` runs lint, typecheck, unit tests, build, chromium E2E, and Lighthouse.

## Pitfalls

- **`pnpm dev` destroys the production build**: `next dev` replaces `.next`, so a later `pnpm start` / `pnpm test:e2e` / `pnpm test:lhci` fails with `Could not find a production build`. Re-run `pnpm build` after using the dev server.
- **`convex dev` push under Node v26**: this machine's default Node is v26 and "use node" actions require Node 20/22/24 — the push fails with `DeploymentNotConfiguredForNodeActions`. Fix: `PATH=/usr/bin:$PATH npx convex dev` (v22 lives at /usr/bin/node). Already-deployed functions keep serving either way.
- **LHCI needs a local Chrome flag**: the browser it detects (Brave) aborts under Ubuntu's AppArmor userns restriction — run `pnpm test:lhci -- --collect.settings.chromeFlags=--no-sandbox`. Accessibility (≥0.95) is the enforced gate and passes; performance is advisory (`warn`) because this hardware scores ~0.54. `lighthouserc.json` no longer asserts `categories:pwa` — Lighthouse 12 removed that category.
- **pnpm overrides live in `pnpm-workspace.yaml`** (security floors: postcss, source-map-js), NOT package.json's `pnpm` field — pnpm 11+/12 ignores it there while Vercel builds on pnpm 10; mixing them broke deploys with frozen-lockfile mismatches.
- **Missing API keys**: dev Convex deployment has no `GOOGLE_PLACES_API_KEY`/`GEMINI_API_KEY` — actions return mock data. Push needs VAPID keys (not configured in dev).
- **Tesseract assets**: everything loads from `public/tesseract/` — keep it synced with the FULL `node_modules/tesseract.js-core/` contents (missing `.wasm` siblings = console 404s); `curl -I` after deploy.
- **Hydration**: the intro video reads localStorage behind a `mounted` state pattern to avoid SSR/client mismatch.
- **Vite config warning**: `vitest.config.ts` uses ESM syntax in CommonJS — suppress with `VITE_CONFIG_NATIVE_IGNORE_WARNING=true`.
- **PWA installs must go through Chrome on Android**: Samsung Internet/OEM browsers mint WebAPKs that Play Protect blocks; `src/lib/utils/install.ts` classifies the environment and `InstallPrompt` routes users to Chrome (never offer the native prompt elsewhere). Covered by `tests/unit/install.test.ts`.
- **`convex/_generated/` is committed on purpose**: git-triggered Vercel builds fail with `Module not found: ../../convex/_generated/api` when it's missing, and the alias silently stays on the old build. Keep it in sync (`npx convex dev` / `npx convex codegen`) and commit; don't re-add to `.gitignore` or re-sort its imports.

## Deployment

```bash
pnpm deploy:prod            # Convex production — pins CONVEX_DEPLOYMENT=prod:rare-alpaca-711
npx vercel --prod --yes     # Vercel production — run AFTER Convex
```

Deploy order matters: Convex first, then Vercel. Pushing to GitHub also deploys when the Vercel git integration is connected.

## Android App (TWA)

- `android/` — Trusted Web Activity project (bubblewrap). Package `app.vercel.mom_s_dragonfly.twa`, targetSdk 36 — required so Play Protect doesn't block it. Never distribute browser-minted WebAPKs (Samsung Internet / OEM browsers) — they get blocked.
- Keystore + passwords are gitignored (`android/android.keystore`, `android/keystore-passwords.txt`); backup at `~/Android/keystores/momsdragonfly/`. Never commit them.
- Rebuild: `cd android && bubblewrap update --skipVersionUpgrade && bubblewrap build` with `BUBBLEWRAP_KEYSTORE_PASSWORD`/`BUBBLEWRAP_KEY_PASSWORD` set from `keystore-passwords.txt`. Full notes in `android/README.md`.
- `public/.well-known/assetlinks.json` holds the signing fingerprint for fullscreen mode — update it if the signing key changes, then redeploy.

## Post-Deploy Checklist

- [ ] Confirm the newest production deployment is **Ready** (`npx vercel ls`) — a failed git build leaves the previous build live
- [ ] Verify `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` point at production
- [ ] `curl -I` a few `/tesseract/` assets (expect 200)
- [ ] Test PWA install on mobile (Android Chrome, iOS Safari) and offline mode (airplane mode → refresh)
- [ ] Verify push notifications (Reminders tab)
- [ ] Run `pnpm test:lhci` (accessibility gate ≥0.95 — performance is advisory)

## Useful References

- Implementation plan: `docs/plans/2025-09-17-MomsDragonFly-Implementation.md`
- Task status: `docs/task-status.md` · review follow-ups: `docs/plans/2026-10-13-review-followups-plan.md`
- Design specs: `docs/superpowers/specs/`
- Convex AI guidelines: `convex/_generated/ai/guidelines.md`
- Env setup commands: `.env.setup.md`

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
