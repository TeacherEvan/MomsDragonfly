# Mom's Dragonfly — Research Findings

**Run ID:** `mdf-2026-09-18-001`  
**Generated:** 2026-09-18T18:40:00Z

---

## Key Findings Summary

### Accessibility (WCAG 2.1/2.2 AA)

1. **Map accessibility requires parallel list** — The map cannot be the only way to access POI data. Screen reader users need a semantic HTML list (table/ul) with "Show on map" buttons that pan the map. This satisfies 1.1.1 Non-text Content and 2.1.1 Keyboard.

2. **Markers must be real interactive elements** — `<div>` with click handlers fails 2.1.1. Markers need to be `<button>` or `<a>` with accessible name (place name), focusable, and keyboard activatable (Enter/Space).

3. **Heading hierarchy critical** — Each page needs unique `<h1>` matching document title for Next.js route announcer and axe `heading-order` rule. Current explore page has h2 "Nearby Places" but no h1.

4. **Color contrast in elderly mode** — Must test with `forcedColors: 'active'` media query. CSS variables for touch targets (44px normal, 56px elderly) and font sizes (1rem/1.2rem) are correct approach.

5. **Axe-core impact levels** — Critical (blockers), Serious (high), Moderate (medium), Minor (low). CI should gate on critical only initially.

### Leaflet-Specific

1. **Default keyboard support** — Leaflet map container and markers are keyboard operable by default. Don't disable `scrollWheelZoom` without providing alternative zoom controls.

2. **Marker labeling** — Use `alt` option on `L.marker({alt: 'Place Name'})` or custom `divIcon` with semantic HTML for accessible names.

3. **DOM order issue** — Controls should come before markers in tab order (Leaflet issue #7479). Consider focusgroup pattern for arrow-key marker navigation.

### PWA

1. **next-pwa config** — Cache-first for static assets, network-first for Convex API calls. Manifest needs all icon sizes including 512px maskable.

2. **Lighthouse CI thresholds** — PWA ≥90, Performance ≥75, Accessibility ≥95 are achievable targets for this app scope.

### Current Test Failures Root Causes

| Failure | Root Cause | Fix |
|---------|------------|-----|
| `/explore` elderly a11y violations | Missing h1, map markers not accessible, contrast issues in elderly mode | Add h1, make markers accessible buttons, verify elderly CSS |
| Reminders "Reminders" heading missing | Page has h3 "Your Schedule" not h1 "Reminders" | Add h1 "Reminders" to RemindersClient |
| Tickets "Tickets" heading missing | h1 exists but may not have `role="heading"` or aria-level | Verify h1 structure; ensure semantic heading |
| "No tickets yet" vs "No tickets saved" | Test expects "No tickets yet", UI shows "No tickets saved" | Update test to match actual UI text (more accurate) |