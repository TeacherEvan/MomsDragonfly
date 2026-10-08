# Investigation 2026-10-08 — Surgical-Investigation (Project-Manager run)

Strategy: codebase-first + pattern-driven + targeted-docs + cve-driven (budget-trimmed full-sweep).

## Codebase audit findings

- No existing share/export infrastructure for journal (`locationHistory`, `journalNotes`) — net-new feature built this run.
- `userPrefs` was the natural home for `shareToken`/`shareEnabled`; all other tables are device-scoped via `validateDeviceId()`.
- CSP was missing `object-src`, `base-uri`, `form-action`, `frame-ancestors` — added.
- `next-pwa@5.6.0` installed but unused (manual `public/sw.js` is the only SW path) — removed from `package.json`.
- Dep currency watchlist (not yet verified against npm): eslint 8 (EOL), react 18 with Next 15/react-leaflet 5 (peer mismatch risk), framer-motion 13 (renamed `motion`), vitest 5 vs 3, tailwind 3 vs 4, @types/node 20. Recommend a follow-up `pnpm outdated` pass.

## Feature built

- Live read-only share view at `/share/[token]` via `shareView` query (token-gated; Convex reactive updates = live).
- `enableShare`/`disableShare` mutations on `userPrefs`; index `by_shareToken`.
- History export: GPX + GeoJSON from `src/lib/journal/share.ts`; Web Share API with clipboard fallback.
- Tests: `tests/unit/share.test.ts` (4), convex-test share block (3), `tests/e2e/share.spec.ts` (2).

## Verification

- `pnpm typecheck` clean, `pnpm lint` clean (autofix applied), 153 unit tests pass, 19 convex-test pass, `pnpm build` succeeds (`/share/[token]` ƒ route present).
