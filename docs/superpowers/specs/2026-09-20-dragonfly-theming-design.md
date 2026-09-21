# Dragonfly Theming & Intro Video Redesign

**Date:** 2026-09-20
**Status:** Approved — ready for implementation planning
**Scope:** Full visual overhaul (intro flow + app-wide theming)

---

## 1. Overview

Transform Mom's Dragonfly from a functional dark-themed PWA into a cohesive, immersive dragonfly-themed travel companion. Two major workstreams:

1. **Intro flow**: Full-screen splash (intro.jpg) → tap-to-play fullscreen video (Intro.mp4) → main app
2. **App-wide theming**: Iridescent dragonfly color palette, living backgrounds, micro-interactions, dragonfly navigation avatar

Every launch shows the intro. Dragonfly motif lives throughout — not cosmetic, but structural.

---

## 2. Intro Flow

### 2.1 Splash Screen

- Full-screen `intro.jpg` as background (cover, centered)
- Centered: animated dragonfly SVG silhouette (wings flutter)
- Below dragonfly: "Mom's Dragonfly" text, subtle gold shimmer
- Tap anywhere → dragonfly "takes off" animation (scale 1→1.5, fade out, 400ms ease-out)
- Canvas ripple effect from tap point (optional — CSS fallback if canvas unavailable)
- After 400ms → transition to IntroVideoModal

### 2.2 IntroVideoModal

- Full-screen overlay (dark backdrop, z-index: 50)
- `<video>` element with `poster="intro.jpg"`, `preload="metadata"`
- Centered play button (dragonfly-gold-500, 64px, glow shadow)
- Tap play → video starts (muted by default)
- Top-right: "Skip" button (text, gold-400, 14px)
- Tap skip → dragonfly exits animation (flies to top-right, 300ms) → dismiss modal
- On video end → dragonfly returns animation (flies from top-right to bottom nav, 500ms) → dismiss modal
- Keyboard: Escape → skip, Space → toggle play/pause

### 2.3 Persistence

- `localStorage.setItem("mdf_intro_seen", Date.now().toString())` — analytics only
- **Always** show intro on every launch (no "don't show again" logic)

---

## 3. Dragonfly Color System

### 3.1 Tailwind Config: `dragonfly` Palette

```typescript
// tailwind.config.ts — extend.colors
dragonfly: {
  // Iridescent teal — primary interactive color
  teal: {
    50: "#e6fffa", 100: "#b2f5ea", 200: "#81e6d9", 300: "#4fd1c5",
    400: "#38b2ac", 500: "#319795", 600: "#2c7a7b", 700: "#285e61",
    800: "#234e52", 900: "#1d3f43", 950: "#0f2628"
  },
  // Iridescent cyan — accent
  cyan: {
    50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9",
    400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490",
    800: "#155e75", 900: "#164e63", 950: "#083344"
  },
  // Iridescent emerald — secondary
  emerald: {
    50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
    400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
    800: "#065f46", 900: "#064e3b", 950: "#022c22"
  },
  // Gold accent — rewards, active states
  gold: {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
    400: "#fbbf24", 500: "#D4AF37", 600: "#b8941f", 700: "#927414",
    800: "#785c12", 900: "#634a14", 950: "#3b2a0a"
  },
  // Deep navy — base background
  navy: {
    50: "#f0f4f8", 100: "#d9e2ec", 200: "#bcccdc", 300: "#9fb3c8",
    400: "#829ab1", 500: "#627d98", 600: "#486581", 700: "#334e68",
    800: "#243b53", 900: "#102a43", 950: "#061416"
  }
}
```

### 3.2 CSS Variables

```css
:root {
  --color-bg: #061416;              /* dragonfly.navy.950 */
  --color-surface: #0a1f26;         /* dragonfly.navy.900 */
  --color-surface-elevated: #112d3a; /* dragonfly.navy.800 */
  --color-primary: #319795;         /* dragonfly.teal.500 */
  --color-primary-hover: #2c7a7b;   /* dragonfly.teal.600 */
  --color-accent: #06b6d4;          /* dragonfly.cyan.500 */
  --color-gold: #D4AF37;            /* dragonfly.gold.500 */
  --color-text: #f0f4f8;            /* dragonfly.navy.50 */
  --color-text-muted: #829ab1;      /* dragonfly.navy.400 */
  --color-border: #112d3a;          /* dragonfly.navy.800 */

  /* Iridescent gradients */
  --iridescent-1: linear-gradient(135deg, #06b6d4 0%, #319795 50%, #10b981 100%);
  --iridescent-2: linear-gradient(45deg, #22d3ee 0%, #06b6d4 30%, #319795 70%, #10b981 100%);
  --iridescent-shift: linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
  --gold-shimmer: linear-gradient(90deg, #D4AF37 0%, #fbbf24 50%, #D4AF37 100%);
}
```

### 3.3 Tailwind Utilities

```typescript
// tailwind.config.ts — extend utilities
backgroundImage: {
  'iridescent': 'var(--iridescent-1)',
  'iridescent-2': 'var(--iridescent-2)',
  'gold-shimmer': 'var(--gold-shimmer)',
}
animation: {
  'float': 'dragonfly-float 4s ease-in-out infinite',
  'wing-shimmer': 'wing-shimmer 2s ease-in-out infinite',
  'iridescent-shift': 'iridescent-shift 3s ease-in-out infinite',
}
```

---

## 4. Visual Motifs

### 4.1 Dragonfly SVG Silhouette

- Single SVG component (`DragonflySilhouette.tsx`)
- CSS animations: `dragonfly-float` (translateY ±8px, rotate ±2deg), `wing-shimmer` (opacity 0.3→0.6)
- `prefers-reduced-motion: reduce` → static, no animation
- Color: `currentColor` (inherits from parent)
- Sizes: `sm` (24px), `md` (40px), `lg` (64px), `xl` (128px)

### 4.2 Wing Pattern Background

- Repeating SVG pattern (subtle, low opacity)
- `opacity: 0.03`, `mix-blend-mode: screen`
- Applied via `<DragonflyBackground>` wrapper component
- CSS-only fallback: radial gradient with wing-like shapes

### 4.3 Living Canvas (DragonflyCanvas)

- Single `<canvas>` element, 3 modes:
  - **ambient**: 15-20 floating particles, Brownian motion, iridescent colors (teal/cyan/emerald)
  - **immersive**: Dragonfly hero follows pointer with spring physics (splash only)
  - **transition**: Dragonfly flies across screen on page change
- ~3KB gzipped, `requestAnimationFrame`, pauses off-screen (`IntersectionObserver`)
- Fallback: CSS-only particles (no canvas)

---

## 5. Navigation Dragonfly

### 5.1 Bottom Nav Perch

- Active tab: dragonfly silhouette perches on icon (wings glow via `box-shadow`)
- Tab switch: dragonfly animates (fly arc, 300ms) from old tab to new tab
- `prefers-reduced-motion` → instant position change, no fly animation

### 5.2 Page Transitions

- Dragonfly flies from outgoing page to incoming page (arc path, ~400ms)
- On complete: brief wing-flutter, then settles

### 5.3 Loading States

- Dragonfly hovers center, wings flutter faster (1s cycle vs normal 2s)
- `prefers-reduced-motion` → static spinner replacement

### 5.4 Empty States

- Dragonfly rests on empty list (perched on illustration)
- Subtle idle animation (gentle sway)

### 5.5 Success Celebrations

- Budget goal reached / reminder done: dragonfly darts upward with gold trail (8 particles, fade over 600ms)
- `prefers-reduced-motion` → static checkmark with gold glow

---

## 6. Micro-Interactions

### 6.1 Iridescent Buttons

```css
.btn-primary {
  background: var(--iridescent-1);
  background-size: 200% 100%;
  background-position: 0% 0%;
  transition: background-position 0.4s ease;
}
.btn-primary:hover {
  background-position: 100% 0%;
}
.btn-primary:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}
```

### 6.2 Iridescent Cards

```css
.card {
  background: linear-gradient(var(--color-surface), var(--color-surface)) padding-box,
              var(--iridescent-1) border-box;
  border: 1px solid transparent;
  transition: box-shadow 0.3s ease;
}
.card:hover {
  box-shadow: 0 0 20px rgba(49, 151, 149, 0.15);
}
.card:focus-within {
  background: linear-gradient(var(--color-surface), var(--color-surface)) padding-box,
              var(--gold-shimmer) border-box;
}
```

### 6.3 Toggle Switches

- Track: `dragonfly.navy.700` off, iridescent gradient on
- Thumb: gold-500, slight scale on active

### 6.4 Focus Rings

- Gold-500 ring (consistent with brand), `ring-offset-2` on navy.950

---

## 7. Accessibility

| Concern | Approach |
|---------|----------|
| `prefers-reduced-motion` | All animations disabled → static patterns, instant transitions |
| Canvas particles | CSS-only fallback, no motion |
| Video | Standard `<video>` controls, aria-label, skip button keyboard-accessible |
| Focus management | Modal traps focus, Escape closes, focus returns to trigger |
| Color contrast | navy.50 on navy.950 = 14.5:1, teal.500 on navy.950 = 5.2:1, gold.500 on navy.950 = 8.1:1 |
| Screen readers | ARIA labels on dragonfly icons (decorative: `aria-hidden="true"`), skip nav support |

---

## 8. File Structure

### New Files (6)

```
src/components/onboarding/
  SplashScreen.tsx          # Full-screen splash, canvas ripple, dragonfly entry
  IntroVideoModal.tsx       # Video overlay, play/skip, dragonfly exit

src/components/ui/
  DragonflyCanvas.tsx       # Single canvas, 3 modes (ambient/immersive/transition)
  DragonflySilhouette.tsx   # SVG + CSS animations (float, wing-shimmer)

src/lib/theme/
  dragonfly.ts              # Design tokens, color helpers, gradient builders
  dragonfly.css.ts          # CSS-in-JS for dynamic gradient declarations
```

### Modified Files (8)

```
tailwind.config.ts                    # dragonfly palette, custom utilities, animations
src/app/globals.css                   # CSS variables, wing pattern, keyframes
src/app/(tabs)/explore/page.tsx       # SplashScreen + IntroVideoModal integration
src/app/(tabs)/budget/page.tsx        # Celebration burst on goal
src/app/(tabs)/reminders/page.tsx     # Dragonfly delivery animation
src/app/(tabs)/tickets/page.tsx       # Dragonfly scan animation
src/app/(tabs)/settings/page.tsx      # Wing pattern background, toggle theming
src/components/shell/BottomNav.tsx    # Dragonfly perch + tab switch animation
src/app/providers.tsx                 # DragonflyCanvas provider
```

---

## 9. Testing

| Type | Coverage |
|------|----------|
| Unit | SplashScreen tap handler, IntroVideoModal play/skip/dismiss, DragonflySilhouette render |
| Integration | Full intro flow (splash → video → app), localStorage persistence |
| E2E | Cold start intro on every launch, skip works, video plays to end |
| Visual | DragonflyBackground modes, iridescent gradients, card/button hover states |
| Accessibility | `prefers-reduced-motion` verified, keyboard nav, focus management, ARIA |
| Performance | Canvas FPS (target: 60fps), bundle size delta (<5KB), lazy loading |

---

## 10. Implementation Order

1. **Theme foundation**: `dragonfly.ts` tokens, `tailwind.config.ts`, `globals.css` variables
2. **Core components**: `DragonflySilhouette`, `DragonflyBackground`, `DragonflyCanvas`
3. **Intro flow**: `SplashScreen`, `IntroVideoModal`, explore page integration
4. **Navigation**: `BottomNav` dragonfly perch, tab switch animation
5. **App-wide theming**: Apply dragonfly tokens to all pages, cards, buttons
6. **Micro-interactions**: Iridescent buttons, cards, toggles, focus rings
7. **Success celebrations**: Budget goal burst, reminder done, ticket scan
8. **Accessibility audit**: `prefers-reduced-motion`, keyboard, screen readers
9. **Testing**: Unit, integration, E2E, visual, performance
