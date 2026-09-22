# Mom's Dragonfly — Agent Instructions

PWA travel companion (Next.js 15 + Convex + TypeScript). Offline-first, no auth, deviceId in localStorage.

## Dev Environment

```bash
pnpm install           # install deps
cp .env.local.example .env.local   # add Convex URL
npx convex dev         # starts Convex dev deployment
pnpm dev               # Next.js on :3000 (Turbopack)
```

## Commands (verified)

| Command | Status | Notes |
|---------|--------|-------|
| `pnpm build` | ✅ passes | Next.js 15 production build |
| `pnpm typecheck` | ✅ passes | `tsc --noEmit` (root + convex/) |
| `pnpm lint` | ✅ passes | ESLint + Next.js config |
| `pnpm test` | ✅ passes | 52 vitest unit tests in 10 files (jsdom) |
| `pnpm test:e2e` | ✅ passes | 15 Playwright tests (needs `pnpm build` first) |
| `pnpm test:lhci` | ⚠️ untested | Lighthouse CI (requires production URL) |

## Project Structure

```
src/app/(tabs)/        # Pages: explore, budget, reminders, tickets, settings
src/components/        # UI components (shell, map, poi, budget, reminders, tickets, onboarding)
src/hooks/             # useGeolocation
src/lib/               # utils (deviceId, geo, currency, budget, notify, ocr, idb, theme)
convex/                # Convex backend: schema, queries, mutations, actions, crons, auth
convex-test/           # Convex test helpers + schema copy
tests/unit/            # Vitest unit tests
tests/e2e/             # Playwright E2E tests
public/                # Icons, manifest, sw.js, offline.html, tesseract/ (self-hosted OCR)
```

## Key Conventions

- **Device identity**: `getDeviceId()` from `src/lib/utils/deviceId.ts` — UUID in localStorage, no auth
- **Convex client**: Created in `src/app/providers.tsx` via `ConvexProvider`
- **Path aliases**: `@/*` → `src/*`, `convex/_generated/*` → `convex/_generated/*`
- **Strict TS**: `strict: true` in both tsconfig.json files
- **PWA**: Manual SW at `public/sw.js` (next-pwa installed but unused; no next-pwa config). SW skips cross-origin requests entirely — external assets (map tiles) go straight to the network; app shell + intro media are cached.
- **CSP**: Configured in `next.config.js` + `vercel.json` — includes `*.tile.openstreetmap.org`
- **Tesseract OCR**: Real OCR in production — fully self-hosted under `public/tesseract/` (worker, core `.wasm.js` + raw `.wasm` variants, `eng.traineddata.gz`). `next.config.js` serves the dir with immutable caching. No mock or bundler alias.
- **Map**: react-leaflet; pins are self-hosted inline-SVG `L.divIcon` (no external marker images); failed tiles retry ×3 with backoff, then show a calm placeholder.
- **Design system**: `dragonfly` palette in `tailwind.config.ts` + `src/lib/theme/dragonfly.ts`; CSS vars in `globals.css`

## Convex Backend

- **Schema**: `convex/schema.ts` (pois, userPrefs, locationHistory, expenses, budgets, reminders, tickets)
- **Queries**: `convex/queries.ts` — all guarded by `validateDeviceId()`
- **Mutations**: `convex/mutations.ts` — all guarded by `validateDeviceId()`
- **Actions**: `convex/actions.ts` — external APIs (Google Places, Overpass, Brave, Gemini) — `"use node"` directives
- **Crons**: `convex/crons.ts` — purge POIs hourly, send reminders 5min, purge tickets hourly (batched, BATCH_SIZE=500)
- **Env secrets** (set via `npx convex env set`): `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, `BRAVE_SEARCH_API_KEY` (optional), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `GEMINI_MODEL`
- **Convex auth guidelines**: Read `convex/_generated/ai/guidelines.md` before editing Convex code

## Pitfalls

- **E2E port**: Playwright config runs `npm run start` on 3000; tests use `baseURL: http://localhost:3000`. Must run `pnpm build` first.
- **Convex version mismatch**: Parent `package-lock.json` at `/home/leandi-duplessis/` interferes — delete it if Next.js resolves wrong version.
- **Hydration mismatch**: Intro video uses `mounted` state pattern to avoid SSR/client mismatch on `localStorage` read.
- **Missing API keys**: `GOOGLE_PLACES_API_KEY` and `GEMINI_API_KEY` not set in dev Convex deployment — actions return mock data.
- **Tesseract assets**: The worker loads everything from `public/tesseract/` — missing files (e.g. `tesseract-core-relaxedsimd*.wasm` siblings) surface as console 404s. Keep the dir synced with the FULL `node_modules/tesseract.js-core/` contents and curl-verify after deploy.
- **Elderly mode removed**: Fully deleted (no schema field, no UI) — ignore stale references.
- **Vite config warning**: `vitest.config.ts` uses ESM syntax in CommonJS — set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress.
- **Push notifications**: Require VAPID keys in Convex env; not configured in dev.

## Testing Notes

- Unit tests: `tests/setup.ts` configures jsdom + Testing Library
- E2E tests: `playwright.config.ts` uses Pixel 5 mobile emulation, single chromium project
- Convex tests: `convex-test/` helpers for integration testing Convex functions

## Deployment

```bash
# Convex production
npx convex deploy --yes     # non-interactive OK with --yes

# Vercel production
npx vercel --prod --yes     # non-interactive OK with --yes
```

Pushing to GitHub also works when the Vercel git integration is connected.

## Post-Deploy Checklist

- [ ] Verify `NEXT_PUBLIC_CONVEX_URL` points to production deployment
- [ ] Verify `NEXT_PUBLIC_CONVEX_SITE_URL` is correct
- [ ] `curl -I` a few `/tesseract/` assets (expect 200)
- [ ] Test PWA install on mobile (Android Chrome, iOS Safari)
- [ ] Test offline mode (Airplane mode → refresh)
- [ ] Verify push notifications work (Reminders tab)
- [ ] Run `pnpm test:lhci` against production URL

## Useful References

- Implementation plan: `docs/plans/2025-09-17-MomsDragonFly-Implementation.md`
- Task status: `docs/task-status.md`
- Design specs: `docs/superpowers/specs/`
- Convex AI guidelines: `convex/_generated/ai/guidelines.md`
- Env setup commands: `.env.setup.md`