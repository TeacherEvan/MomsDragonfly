# CODEBASE-STATE.md (Remediation Run)

## Run Metadata
- Date: 2026-09-21 (current session)
- Workflow: Remediation of production PWA errors
- Deployment URL: https://mom-s-dragonfly.vercel.app/
- New deployment URL: https://mom-s-dragonfly-g7wb04dcb-teacher-evans-projects.vercel.app/

## Baseline Errors (from user's pasted console log)
1. ChunkLoadError: chunk 550 (ed48eaa7.2f773bb538464812.js) - RESOLVED (rebuild + redeploy)
2. CSP block: `https://vercel.live` script blocked - RESOLVED (added to CSP in next.config.js + vercel.json)
3. ServiceWorker tile fetch rejection - FIXED (added `.catch()` to public/sw.js image branch)
4. Convex `fetchNearby` server error ([Request ID: eb3e15d6250ebd84]) - PENDING (keys present, transient suspected)
5. Source map 403 (`installHook.js.map`) - NOT ADDRESSED
6. OpenStreetMap tiles failing (client/network) - NOT A CODE BUG (service worker now handles gracefully)

## Tech Stack
Next.js 15.5.25, TypeScript strict, Convex, Tailwind, Vercel

## Gates Status
- Build (`npm run build`): PASS (2026-09-21 rebuild)
- Lint: PASS (1 warning: import/no-anonymous-default-export in tesseract-wrapper.js)
- Typecheck: PASS
- Tests: 21 vitest pass, 15 playwright pass (per AGENTS.md)

## Known Issues
- Source map 403 for `<anonymous code>` (installHook.js.map) - not yet investigated
- Convex `fetchNearby` action needs direct verification call
- Service worker fix needs live browser verification with tiles
- Previous deployment may have stale chunks; new deployment is fresh
