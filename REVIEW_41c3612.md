## Review: 41c3612 — POIList a11y fix + reminders test + working tree delete

**Scope:** commit 41c3612 (`POIList.tsx`, `reminders.spec.ts`) + unstaged `public/intro.mp4` delete + untracked `convex-dev.log`.
**Verification:** `pnpm run build` ✅ · `pnpm run lint` ✅ · `pnpm run typecheck` ✅ · `pnpm run test` ✅ (21/21). E2E fails due to middleware runtime error unrelated to this change (`next` middleware `eval` disallowed). `public/intro.mp4` is actively referenced by `src/components/onboarding/IntroVideo.tsx`.

---

### Critical (must fix before merge or apply)

**1. `tests/e2e/reminders.spec.ts` — test no longer tests navigation**
- Previous: clicked the "Reminders" link in bottom nav and verified URL change (tests the feature).
- Current: navigates directly via `goto("/reminders")` with a comment saying "client-side nav may not work in test." The test name (`"can navigate to reminders via bottom nav"`) is now false advertising. The `waitForSelector('nav[aria-label="Main navigation"]')` and `toBeVisible()` are good additions, but they don't compensate for the lost behavior verification.
- **Remedy:** Restore the click + URL assertion. If client-side navigation is genuinely broken (likely the middleware runtime error seen in `test:e2e`), file a separate bug tracking the navigation failure rather than masking it in this test. If the failure is intermittent, use `expect.poll()` or retry logic, not a direct goto.

**2. `public/intro.mp4` unstaged delete breaks onboarding video**
- `src/components/onboarding/IntroVideo.tsx:37` references `/intro.mp4`. Deleting it without removing/replacing the `<video>` source creates a broken component. Not part of the commit diff, but present in the working tree.
- **Remedy:** Confirm whether the delete is intentional. If yes, also update `IntroVideo.tsx` (remove or replace with placeholder). If accidental, `git checkout -- public/intro.mp4`.

---

### Required (should fix; approve if explicitly deferred with justification)

**3. `src/components/poi/POIList.tsx` — `aria-labelledby` association lost when `<ul>` wrapper removed**
- Previous structure: `<ul role="list" aria-labelledby={liveRegionId}>` wrapped the virtualized list. This linked the list to the status announcement ("{count} places found...").
- The `react-window` `List` renders its own `role="list"` (verified in `node_modules/react-window/dist/react-window.js:876`), so removing the nested `<ul>` fixes a nested-role accessibility bug — that's the right direction. But `aria-labelledby` disappeared entirely.
- **Remedy:** Move `aria-labelledby={liveRegionId}` onto the `List` component props (it passes through `...I` to the inner `div` at line 876), or keep it on the parent container and add it back. Example:
  ```jsx
  {React.createElement(List as any, {
    ...existingProps,
    "aria-labelledby": liveRegionId,
  } as any, null)}
  ```
  This restores the association without reintroducing nested roles.

---

### Optional / Consider

**4. `POIList.tsx` — `any` casts still unaddressed**
- Lines 61-76 use explicit `any` casts (`List as any`, props `as any`) to suppress TypeScript errors with `react-window`. Not new to this commit, but the change touches this region and doesn't address it.
- **Remedy:** If the type mismatch is from `react-window`'s generic props, define a typed wrapper or add `// @ts-expect-error` with a comment instead of a broad `eslint-disable`. Not a blocker.

**5. `reminders.spec.ts` — trailing whitespace and missing newline at EOF**
- Minor. Clean up when revisiting the test.

---

### FYI

- `convex-dev.log` is untracked (1,023 bytes). Likely leftover from a dev server. Not a code issue, but clean it up (`git clean -f` or add to `.gitignore`) before it gets committed accidentally.
- The `POIList` change reduces DOM nesting (no `<ul>` wrapping a `<div role="list">`), which is structurally healthier. The live-region announcement (`{pois.length} places found...`) remains intact.
- No secrets, no injection surfaces, no input validation changes in this commit. Security axis: clear.
- Performance axis: removing the `<ul>` wrapper doesn't change the virtualized rendering path (`ITEM_HEIGHT`, `overscanCount`). No regression.

---

### Change Sizing & Architecture

- Diff: ~50 lines (2 files). Healthy size.
- The refactor removes a redundant wrapper but doesn't reduce the number of concepts a reader holds (`any` casts, `rowProps`, `POIRow`). That's fine — it fixes a structural issue rather than relocating complexity. No new abstractions needed.
- Feature logic (list rendering, live region) stays in its owning module (`POIList`). Good boundary.

---

### Verdict: **Request changes**

Two required actions before this can be approved:
1. Restore or explain the navigation test behavior in `reminders.spec.ts`. A direct `goto` that ignores the bottom nav isn't an acceptable substitute for the named test.
2. Confirm status of `public/intro.mp4` deletion — if intentional, update `IntroVideo.tsx`; if accidental, restore.

Optional: restore `aria-labelledby` association on the virtualized list to preserve accessibility linkage.

Once those are addressed, approve. Don't rubber-stamp; the navigation-test regression is real and the deleted binary breaks a component.
