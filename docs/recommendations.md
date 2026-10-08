# Recommendations log

## 2026-10-08 — Surgical-Investigation run

### Done this run
- **Journal sharing (built)**: live token link (`/share/[token]`), GPX/GeoJSON export, Web Share API. Effort: ~1 day. Unblocks: travellers sharing trips with family.
- **CSP hardening**: added `object-src`, `base-uri`, `form-action`, `frame-ancestors`. Low effort, closes audit gaps.
- **Removed `next-pwa`**: unmaintained dep unused at runtime; reduces audit noise and install weight.

### Recommended next
- **Run `pnpm outdated` / `pnpm audit` pass** (eslint 8 EOL, react 18 vs Next 15 peer mismatch, framer-motion→motion rename, vitest 5, tailwind 4). Effort: 2–4 hours for the safe subset.
- **Token rotation/expiry for share links**: currently one persistent token per device, revocable only via disable. Add `shareTokenCreatedAt` + UI to rotate. Effort: half day.
- **Rate-limit / cap `shareView` payload** (now 500 points/50 notes, fine at current scale); revisit if public links get hammered.
- **E2E coverage for the share happy path** (enable share in UI → visit link shows trail). Needs seeded locationHistory. Effort: half day.
- **Deploy pipeline**: this run's convex codegen uploaded functions to dev; production deploy (`npx convex deploy --yes`) and Vercel redeploy still pending owner sign-off.
