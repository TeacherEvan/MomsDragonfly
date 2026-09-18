# Mom's Dragonfly — Research Sources

**Run ID:** `mdf-2026-09-18-001`  
**Generated:** 2026-09-18T18:40:00Z  
**Freshness Policy:** ≤14 days for current practices; older authoritative standards remain valid

---

## 1. Next.js 14 Accessibility

| Source | Date | Type | Key Findings |
|--------|------|------|--------------|
| [Next.js 14 Accessibility Docs](https://nextjs.org/docs/14/architecture/accessibility) | 2023-12-15 | Official | Built-in route announcer, eslint-plugin-jsx-a11y, unique page titles required for client-side transitions |
| [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing) | 2024 | Official | @axe-core/playwright integration; scan full page or scoped; filter by impact (critical/serious/moderate/minor) |
| [Axe-core WCAG 2.1/2.2 Rules](https://github.com/dequelabs/axe-core/issues/4579) | 2024-09-14 | Issue | Color contrast rules for WCAG 2.0/2.1 A/AA; impact levels: critical, serious, moderate, minor |

---

## 2. Leaflet Map Accessibility

| Source | Date | Type | Key Findings |
|--------|------|------|--------------|
| [Leaflet Accessibility Guide](https://leafletjs.com/examples/accessibility) | Current | Official | Markers need `alt` or `title` for accessible name; keyboard operable by default; preserve defaults |
| [Accessible Maps WCAG 2.2](https://accessibility.build/guides/accessible-maps) | 2026-08-14 | Guide | **Critical**: Map cannot be only way to find data — pair with accessible list (1.1.1); markers must be real `<button>`/`<a>` not `<div>` (2.1.1); announce result changes; alt text must describe place not "map" |
| [Leaflet Issue #7479](https://github.com/Leaflet/Leaflet/issues/7479) | 2021-02-24 | Issue | DOM order: controls before markers; arrow key navigation for markers (focusgroup proposal); avoid 100+ tab stops to reach controls |
| [Minnesota.gov Map Accessibility](https://mn.gov/mnit/assets/Accessibility%20Guide%20for%20Interactive%20Web%20Maps_tcm38-403564.pdf) | 2024-10 | Gov Guide | WCAG 2.1 standard; keyboard-only nav; avoid keyboard traps; focus indicators; color contrast on map controls; tabindex=0 for map elements |

---

## 3. PWA Best Practices (2024)

| Source | Date | Type | Key Findings |
|--------|------|------|--------------|
| [next-pwa Documentation](https://github.com/shadowwalker/next-pwa) | Current | Repo | Workbox config; cache-first for assets, network-first for API; manifest with maskable icons; offline.html fallback |
| [Lighthouse CI PWA Audit](https://github.com/GoogleChrome/lighthouse-ci) | Current | Official | PWA ≥90, Performance ≥75, Accessibility ≥95 targets; installable criteria: manifest, service worker, HTTPS |

---

## 4. Web Push / VAPID

| Source | Date | Type | Key Findings |
|--------|------|------|--------------|
| [web-push npm](https://www.npmjs.com/package/web-push) | Current | Repo | `npx web-push generate-vapid-keys` for keys; VAPID subject required; graceful fallback for iOS <16.4 / denied permission |

---

## 5. OCR / Tesseract.js

| Source | Date | Type | Key Findings |
|--------|------|------|--------------|
| [Tesseract.js v7](https://github.com/naptha/tesseract.js) | 2024 | Repo | WASM lazy-loaded; offline capable; confidence scoring; language packs dynamic import |

---

## 6. Research Decisions

| Decision ID | Topic | Decision | Rationale |
|-------------|-------|----------|-----------|
| DEC-001 | Map accessibility | Add accessible POI list alongside map; markers as `<button>` with `aria-label`; keyboard arrow nav for markers | WCAG 2.1 1.1.1 + 2.1.1; Leaflet defaults + focusgroup pattern |
| DEC-002 | Elderly mode contrast | Ensure CSS variables for touch targets (44px/56px) and font sizes; test with `forcedColors: 'active'` in Playwright | WCAG 2.1 AA + forced-colors media query |
| DEC-003 | Axe-core config | Filter by `wcag2a`, `wcag2aa` tags; allow moderate/minor in CI for now; block critical only | Pragmatic rollout; critical = blockers |
| DEC-004 | Heading structure | Each page must have unique `<h1>` matching page title for route announcer + axe heading-order | Next.js route announcer + axe heading-order rule |
| DEC-005 | Test text matching | Update test expectations to match actual UI text ("No tickets saved" vs "No tickets yet") | Test accuracy; don't change UI to match brittle test |