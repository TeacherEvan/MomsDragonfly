# Mom's Dragonfly — Research Decisions

**Run ID:** `mdf-2026-09-18-001`  
**Generated:** 2026-09-18T18:40:00Z

---

## Recorded Decisions

| DEC-ID | Topic | Decision | Rationale | Evidence |
|--------|-------|----------|-----------|----------|
| DEC-001 | Map accessibility | Add accessible POI list alongside map; markers as `<button>` with `aria-label`; keyboard arrow nav for markers | WCAG 2.1 1.1.1 + 2.1.1; Leaflet defaults + focusgroup pattern | [Leaflet Accessibility](https://leafletjs.com/examples/accessibility), [Accessible Maps Guide](https://accessibility.build/guides/accessible-maps) |
| DEC-002 | Elderly mode contrast | Ensure CSS variables for touch targets (44px/56px) and font sizes; test with `forcedColors: 'active'` in Playwright | WCAG 2.1 AA + forced-colors media query | [Playwright A11y Testing](https://playwright.dev/docs/accessibility-testing) |
| DEC-003 | Axe-core config | Filter by `wcag2a`, `wcag2aa` tags; allow moderate/minor in CI for now; block critical only | Pragmatic rollout; critical = blockers | [Axe-core Rules](https://github.com/dequelabs/axe-core/issues/4579) |
| DEC-004 | Heading structure | Each page must have unique `<h1>` matching page title for route announcer + axe heading-order | Next.js route announcer + axe heading-order rule | [Next.js A11y](https://nextjs.org/docs/14/architecture/accessibility) |
| DEC-005 | Test text matching | Update test expectations to match actual UI text ("No tickets saved" vs "No tickets yet") | Test accuracy; don't change UI to match brittle test | Current test failure analysis |
| DEC-006 | Map keyboard navigation | Add visible zoom/pan buttons; ensure map container focusable; arrow keys for marker navigation | WCAG 2.1 2.1.1 Keyboard; Leaflet defaults | [Leaflet Issue #7479](https://github.com/Leaflet/Leaflet/issues/7479) |
| DEC-007 | POI list as source of truth | Build list first, wire map to it; "Show on map" buttons pan to marker | Accessible Maps guide pattern | [Accessible Maps Guide](https://accessibility.build/guides/accessible-maps) |
| DEC-008 | Announce result changes | Use `aria-live` region for POI list updates when filter/category changes | WCAG 2.1 4.1.3 Status Messages | [Axe-core](https://github.com/dequelabs/axe-core) |
| DEC-009 | Alt text for map | Describe what map tells user in context (place + location), not "map" | WCAG 1.1.1 Non-text Content | [Accessible Maps Guide](https://accessibility.build/guides/accessible-maps) |
| DEC-010 | Focus indicators | Enhanced focus styles for elderly mode; visible on all interactive elements | WCAG 2.1 2.4.7 Focus Visible | [Playwright A11y](https://playwright.dev/docs/accessibility-testing) |

---

## Decisions Requiring Implementation

1. **DEC-001, DEC-006, DEC-007, DEC-008, DEC-009** → Map/POI accessibility overhaul (ExplorePage, MapView, LeafletMap, POIMarker, POIList)
2. **DEC-004** → Add h1 to RemindersClient, verify TicketsClient h1
3. **DEC-002, DEC-010** → Verify elderly mode CSS, add focus styles
4. **DEC-003** → Configure axe-core in Playwright tests (already using tags)
5. **DEC-005** → Update tickets.spec.ts expectation