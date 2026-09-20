# Mom's Dragonfly — Agent Instructions

PWA travel companion (Next.js 15 + Convex + TypeScript). Offline-first, no auth, deviceId in localStorage.

## Dev Environment

```bash
pnpm install           # install deps
cp .env.local.example .env.local   # add Convex URL
npx convex dev         # starts Convex dev deployment
npm run dev            # Next.js on :3000
```

## Commands (verified)

| Command | Status | Notes |
|---------|--------|-------|
| `npm run build` | ✅ passes | Next.js 15 production build |
| `npm run typecheck` | ✅ passes | `tsc --noEmit` (root + convex/) |
| `npm run lint` | ✅ passes | ESLint + Next.js config (1 warning: tesseract-wrapper default export) |
| `npm test` | ✅ passes | 21 vitest unit tests (jsdom) |
| `npm run test:e2e` | ✅ passes | 15 Playwright tests (needs `npm run build` first) |

## Project Structure

```
src/app/(tabs)/        # Pages: explore, budget, reminders, tickets, settings
src/components/        # UI components (shell, map, poi, budget, reminders, tickets, onboarding)
src/hooks/             # useGeolocation
src/lib/               # utils (deviceId, geo, currency, budget, notify, ocr, idb)
convex/                # Convex backend: schema, queries, mutations, actions, crons
convex-test/           # Convex test helpers + schema copy
tests/unit/            # Vitest unit tests
tests/e2e/             # Playwright E2E tests
public/                # Icons, manifest, sw.js, offline.html
```

## Key Conventions

- **Device identity**: `getDeviceId()` from `src/lib/utils/deviceId.ts` — UUID in localStorage, no auth
- **Convex client**: Created in `src/app/providers.tsx` via `ConvexProvider`
- **Path aliases**: `@/*` → `src/*`, `convex/_generated/*` → `convex/_generated/*`
- **Strict TS**: `strict: true` in both tsconfig.json files
- **PWA**: Manual SW at `public/sw.js` (next-pwa installed but unused)
- **CSP**: Configured in `next.config.js` + `vercel.json` — includes `*.tile.openstreetmap.org`
- **Tesseract OCR**: Mocked in prod via webpack alias (`next.config.js`), real in dev via `tesseract-wrapper.js`

## Convex Backend

- **Schema**: `convex/schema.ts` (pois, userPrefs, locationHistory, expenses, budgets, reminders, tickets)
- **Queries**: `convex/queries.ts` — all guarded by `validateDeviceId()`
- **Mutations**: `convex/mutations.ts` — all guarded by `validateDeviceId()`
- **Actions**: `convex/actions.ts` — external APIs (Google Places, Overpass, Brave, Gemini)
- **Crons**: `convex/crons.ts` — purge POIs hourly, send reminders 5min, purge tickets hourly
- **Env secrets** (set via `npx convex env set`): `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, `BRAVE_SEARCH_API_KEY` (optional), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `GEMINI_MODEL`

## Pitfalls

- **Port 3001 for E2E**: Playwright config runs `npm run start` on 3001; tests use `baseURL: http://localhost:3001`. Must run `npm run build` first.
- **Convex version mismatch**: Parent `package-lock.json` at `/home/leandi-duplessis/` interferes — delete it if Next.js resolves wrong version.
- **Hydration mismatch**: Intro video uses `mounted` state pattern to avoid SSR/client mismatch on `localStorage` read.
- **Missing API keys**: `GOOGLE_PLACES_API_KEY` and `GEMINI_API_KEY` not set in dev Convex deployment — actions return mock data.
- **next-pwa installed but unused**: Manual SW at `public/sw.js` handles caching; next-pwa config absent.
- **Tesseract bundling**: Production build aliases `tesseract.js` → `tesseract-mock.js`; dev uses real module via dynamic import.
- **Elderly mode removed**: Schema still has `elderlyMode` field (harmless); all UI/code references deleted.
- **Vite config warning**: `vitest.config.ts` uses ESM syntax in CommonJS — set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress.