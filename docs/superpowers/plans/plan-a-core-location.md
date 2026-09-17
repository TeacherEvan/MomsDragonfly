# Mom's Dragonfly — Sub-Plan A: Core + Location + Onboarding

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the project skeleton, Convex schema, all queries/mutations/actions, map UI, and onboarding shell — producing a deployable PWA shell with live POI discovery.

**Architecture:** Next.js 14 App Router + TypeScript strict + Convex backend + Leaflet map. No auth: deviceId UUID from localStorage. IndexedDB primary cache, Convex secondary (24 h TTL).

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Convex, Leaflet, react-window, Framer Motion, next-pwa, Vitest, Playwright, pnpm, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md`

## Global Constraints

- Node.js ≥ 20; pnpm as package manager
- TypeScript `"strict": true` — no `any`, no `@ts-ignore`
- Mobile-first; all tap targets ≥ 44px (elderly mode ≥ 56px)
- WCAG AA contrast ≥ 4.5:1 in both normal and elderly mode
- Google Places rate-limit: max 1 refresh/device/category/hour; 24 h Convex cache
- All Convex server-only secrets via `npx convex env set` — never in client bundle
- Every task ends with `git add <files> && git commit -m "..."`
- Commit messages: `feat:`, `chore:`, `fix:`, `test:` prefixes

---

### Task A0: Git Init + Superpowers Setup

**Files:**
- Create: `.gitignore`
- Create: `GEMINI.md`
- Create: `.agents/skills/superpowers` (symlink → `~/.hermes/skills/superpowers` or copy)
- Create: `docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md` (scaffolded)

**Interfaces:**
- Consumes: nothing
- Produces: git repo, superpowers skills discoverable from workspace, spec scaffold

- [ ] **Step 1: Initialize git**

```bash
cd "/home/leandi-duplessis/github/workspaces/Mom'sDragonfly"
git init
```
Expected: `Initialized empty Git repository in .../Mom'sDragonfly/.git/`

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.next/
.env.local
.env*.local
convex/_generated/
.superpowers/
.worktrees/
dist/
coverage/
playwright-report/
```

- [ ] **Step 3: Create GEMINI.md (makes superpowers rules available to Antigravity)**

```markdown
# Mom's Dragonfly — Project Rules

This is a Next.js 14 + Convex + TypeScript PWA project.

## Always

- Use pnpm, not npm or yarn
- TypeScript strict mode — no `any`
- Mobile-first Tailwind classes
- All Convex secrets via `npx convex env set`, never hardcoded

## Superpowers Skills Available

Skills in `.agents/skills/superpowers/` are available for use.
```

- [ ] **Step 4: Set up .agents directory for superpowers skill discovery**

```bash
mkdir -p .agents/skills
# If symlink fails in sandbox, copy the skill files instead:
cp -r ~/.hermes/skills/superpowers .agents/skills/superpowers 2>/dev/null \
  || cp -r ~/.codex/.tmp/plugins/plugins/superpowers/skills/* .agents/skills/ 2>/dev/null \
  || echo "Manual copy required — see ~/.hermes/skills/superpowers"
```

- [ ] **Step 5: Scaffold the spec document**

```bash
cat > docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md << 'EOF'
# Mom's Dragonfly — Design Spec

> This is the authoritative spec. Plans argue from this doc.

## 1. Architecture

- Next.js 14 App Router, deployed on Vercel
- Convex: realtime DB, server actions, scheduled jobs (crons)
- No auth: deviceId UUID stored in localStorage, synced to Convex
- IndexedDB (idb-keyval) for blobs; Convex for structured data (24 h TTL on tickets/POI cache)

## 2. Features

### 2.1 POI Discovery
- User location via Geolocation API (watchPosition)
- Radius: 10m, 100m, 500m, 1km, 5km, 10km, 20km+ (user-adjustable)
- Sources: Google Places New API (restaurants, attractions, pharmacies), Overpass (toilets, parks), Brave Search (entertainment events)
- 24 h Convex cache; user-initiated refresh; max 1 refresh/device/category/hour
- Crowdsource verification: in-app upvote button per POI (stored in Convex verifiedCount)
- Map (Leaflet, dynamic import, SSR=false) + virtualised list (react-window)

### 2.2 Budget / Expenses
- Per-device budget (no account needed)
- Currencies: user selects from ISO 4217 list; no live conversion (amounts stored as-entered)
- Categories: Food, Transport, Accommodation, Attraction, Other
- Expense list virtualised; BudgetRing SVG donut chart (Framer Motion animation)
- Optionally link expense to a ticket (ticketId foreign key)

### 2.3 Reminders
- Add/edit/delete reminders with title, optional body, due datetime, repeat (none/daily/weekly)
- Web Push notifications (VAPID); graceful fallback to in-app badge if permission denied or iOS < 16.4
- Convex cron (every 5 min) sends due push notifications
- DaysCounter: shows days since trip start (tripStartDate from userPrefs)

### 2.4 Ticket Storage + OCR
- Camera capture (MediaStream) or file upload
- OCR: Tesseract.js (WASM, lazy-loaded, offline) — extracts raw text
- Parse: regex extracts date (ISO 8601 or DD/MM/YYYY), amount (currency symbol + number), venue (first capitalised phrase)
- Gemini Vision fallback (gemini-1.5-flash) when Tesseract confidence < 60%
- Storage: image blob in IndexedDB (idb-keyval); metadata in Convex (24 h TTL + scheduled purge)
- Gallery: list of tickets sorted by createdAt desc

### 2.5 PWA
- next-pwa with workbox; cache-first for assets, network-first for Convex API
- Manifest: name, short_name, icons (all sizes, maskable 512), theme_color, background_color
- InstallPrompt: beforeinstallprompt banner
- UpdateBanner: service worker update detected
- offline.html: shown when network fails and no cache hit

### 2.6 Onboarding
- Shown once (onboardingComplete=false in userPrefs)
- IntroVideo: <video> element, src from /public/intro.mp4 (placeholder until real video provided)
- OnboardingSlides: 3 slides (POI, Budget, Reminders) with Framer Motion transitions
- Cookie consent: localStorage flag, shows on first visit

### 2.7 Design System
- Tailwind CSS custom tokens: brand colours, radii, shadows
- Elderly mode: CSS class `.elderly` on <html>, targets ≥56px, font-size 1.2rem base, contrast ≥4.5:1
- Normal mode: targets ≥44px, font-size 1rem base
- Bottom nav: 4 tabs (Explore, Budget, Reminders, Tickets)
- Toast/snackbar for errors and success states

## 3. Data Pipeline

- POI fetch: client triggers Convex action → action checks cache → if stale/missing, calls external API → upserts to Convex pois table → client query auto-updates
- Reminder send: Convex cron (5 min) → query due reminders → call Web Push API for each → mark sentAt

## 4. Error Handling

- Network: react-query retry=2, then toast "Could not load — tap to retry"
- Geolocation denied: show "Location required" empty state with instructions
- OCR failure: "Could not read ticket — tap to try Gemini" button
- Convex offline: show cached data, toast "Working offline"

## 5. Testing

- Vitest: unit tests for geo.ts (haversine), currency.ts (formatAmount), parse.ts (OCR extraction regex), budget math
- Playwright: E2E smoke (map loads, POI card visible, add expense, add reminder, ticket scan flow)
- Lighthouse CI: PWA ≥ 90, Performance ≥ 75, Accessibility ≥ 95

## 6. Deployment

- Vercel: auto-deploy on push to main
- Convex: separate project, env vars set via `npx convex env set`
- GitHub Actions CI: lint + tsc + vitest + playwright + lighthouse CI
- Security headers: CSP, HSTS, X-Frame-Options via vercel.json
EOF
```

- [ ] **Step 6: First commit**

```bash
git add .gitignore GEMINI.md docs/
git commit -m "chore: init repo, add superpowers skills, scaffold spec"
```

---

### Task A1: Project Bootstrap (Next.js + TypeScript + Tailwind + pnpm)

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx` (skeleton)
- Create: `.env.local.example`

**Interfaces:**
- Consumes: nothing (first code task)
- Produces:
  - `cn(...)` utility from `src/lib/utils/cn.ts`
  - `src/app/layout.tsx` exports default `RootLayout({ children })`
  - Dev server starts with `pnpm dev`
  - `pnpm build` succeeds with 0 errors

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd "/home/leandi-duplessis/github/workspaces/Mom'sDragonfly"
pnpm dlx create-next-app@14 . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-pnpm --no-git
```
Expected: scaffolded files, no errors.

- [ ] **Step 2: Install additional dependencies**

```bash
pnpm add convex leaflet react-leaflet react-window idb-keyval framer-motion
pnpm add next-pwa tesseract.js
pnpm add -D @types/leaflet @types/react-window vitest @vitejs/plugin-react \
  @playwright/test jsdom @testing-library/react @testing-library/jest-dom \
  web-push @types/web-push
```

- [ ] **Step 3: Write `src/lib/utils/cn.ts`**

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

Then install the deps:
```bash
pnpm add clsx tailwind-merge
```

- [ ] **Step 4: Write Tailwind config with design tokens**

Replace `tailwind.config.ts` content:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          900: "#14532d",
        },
      },
      fontSize: {
        base: ["1rem", { lineHeight: "1.5" }],
      },
      minHeight: {
        touch: "44px",
        "touch-lg": "56px",
      },
      minWidth: {
        touch: "44px",
        "touch-lg": "56px",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Write `src/app/globals.css` with CSS vars for elderly mode**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --touch-target: 44px;
  --font-base: 1rem;
}

html.elderly {
  --touch-target: 56px;
  --font-base: 1.2rem;
  font-size: var(--font-base);
}
```

- [ ] **Step 6: Write `src/app/layout.tsx` skeleton**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mom's Dragonfly",
  description: "Your travel companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Write `.env.local.example`**

```dotenv
# Copy to .env.local and fill in values

# Public (safe to expose to browser)
NEXT_PUBLIC_CONVEX_URL=https://xxxx.convex.cloud

# Set server-side secrets via: npx convex env set KEY value
# GOOGLE_PLACES_API_KEY=AIza...
# BRAVE_SEARCH_API_KEY=BSA...       # optional
# GEMINI_API_KEY=AIza...
# VAPID_PUBLIC_KEY=...              # npx web-push generate-vapid-keys
# VAPID_PRIVATE_KEY=...
# VAPID_SUBJECT=mailto:you@example.com
```

- [ ] **Step 8: Verify build**

```bash
pnpm build
```
Expected: Build succeeds, 0 TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js 14 + TypeScript + Tailwind + dependencies"
```

---

### Task A2: Convex Project Init + Full Schema

**Files:**
- Create: `convex/schema.ts`
- Create: `convex.json`
- Create: `convex/_generated/` (gitignored, auto-generated by `npx convex dev`)

**Interfaces:**
- Consumes: Convex project URL (from `NEXT_PUBLIC_CONVEX_URL` env var)
- Produces:
  - `convex/schema.ts` exports `default` Convex schema with tables: `pois`, `userPrefs`, `locationHistory`, `expenses`, `budgets`, `reminders`, `tickets`
  - All tables have correct indexes; imported by queries/mutations

- [ ] **Step 1: Write failing test (schema exports check)**

```ts
// tests/unit/schema.test.ts
import { describe, it, expect } from "vitest";

describe("schema module exists", () => {
  it("can be imported without error", async () => {
    // Dynamic import — if the file doesn't exist this throws
    const mod = await import("../../convex/schema");
    expect(mod.default).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/schema.test.ts
```
Expected: FAIL — `Cannot find module '../../convex/schema'`

- [ ] **Step 3: Run `npx convex dev` to create the Convex project (one-time setup)**

```bash
# This requires a Convex account and will open browser for auth
npx convex dev --once 2>/dev/null || echo "Run 'npx convex dev' manually and set NEXT_PUBLIC_CONVEX_URL"
```

- [ ] **Step 4: Write `convex/schema.ts`**

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── POI cache (all sources) ──────────────────────────────────────────────────
  pois: defineTable({
    placeId: v.string(),
    source: v.union(v.literal("google"), v.literal("osm"), v.literal("brave")),
    name: v.string(),
    category: v.string(),
    lat: v.number(),
    lng: v.number(),
    address: v.optional(v.string()),
    rating: v.optional(v.number()),
    phone: v.optional(v.string()),
    openNow: v.optional(v.boolean()),
    verifiedCount: v.number(),
    fetchedAt: v.number(),
    deviceId: v.string(),
  })
    .index("by_fetchedAt", ["fetchedAt"])
    .index("by_placeId", ["placeId"])
    .index("by_deviceId_category", ["deviceId", "category"]),

  // ── User preferences (one doc per device) ───────────────────────────────────
  userPrefs: defineTable({
    deviceId: v.string(),
    elderlyMode: v.boolean(),
    defaultRadius: v.number(),
    currency: v.string(),
    notificationsEnabled: v.boolean(),
    vapidSubscription: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    tripStartDate: v.optional(v.number()),
  }).index("by_deviceId", ["deviceId"]),

  // ── Location history ─────────────────────────────────────────────────────────
  locationHistory: defineTable({
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
    timestamp: v.number(),
  }).index("by_deviceId_timestamp", ["deviceId", "timestamp"]),

  // ── Expenses (plan B) ────────────────────────────────────────────────────────
  expenses: defineTable({
    deviceId: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.union(
      v.literal("food"),
      v.literal("transport"),
      v.literal("accommodation"),
      v.literal("attraction"),
      v.literal("other")
    ),
    note: v.optional(v.string()),
    date: v.number(),
    ticketId: v.optional(v.id("tickets")),
  }).index("by_deviceId_date", ["deviceId", "date"]),

  // ── Budget (plan B) ──────────────────────────────────────────────────────────
  budgets: defineTable({
    deviceId: v.string(),
    totalBudget: v.number(),
    currency: v.string(),
    period: v.union(v.literal("trip"), v.literal("daily")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  }).index("by_deviceId", ["deviceId"]),

  // ── Reminders (plan C) ───────────────────────────────────────────────────────
  reminders: defineTable({
    deviceId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    dueAt: v.number(),
    repeat: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    done: v.boolean(),
    sentAt: v.optional(v.number()),
  }).index("by_deviceId_dueAt", ["deviceId", "dueAt"]),

  // ── Tickets (plan D) ─────────────────────────────────────────────────────────
  tickets: defineTable({
    deviceId: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    ocrText: v.optional(v.string()),
    parsedDate: v.optional(v.number()),
    parsedAmount: v.optional(v.number()),
    parsedVenue: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_deviceId_createdAt", ["deviceId", "createdAt"]),
});
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/schema.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts tests/unit/schema.test.ts
git commit -m "feat: add Convex schema (7 tables — pois, userPrefs, locationHistory, expenses, budgets, reminders, tickets)"
```

---

### Task A3: Core TypeScript Types + Utilities

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/utils/deviceId.ts`
- Create: `src/lib/utils/geo.ts`
- Create: `src/lib/utils/currency.ts`
- Test: `tests/unit/geo.test.ts`
- Test: `tests/unit/currency.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `NormalizedPOI`, `Expense`, `Reminder`, `Ticket` types from `src/types/index.ts`
  - `getDeviceId(): string` from `src/lib/utils/deviceId.ts`
  - `haversine(lat1, lng1, lat2, lng2): number` returns distance in metres
  - `formatDistance(metres: number): string` returns e.g. `"450 m"` or `"1.2 km"`
  - `formatAmount(amount: number, currency: string): string` returns e.g. `"USD 12.50"`
  - `detectLocaleCurrency(): string` returns ISO 4217 code based on `navigator.language`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/geo.test.ts
import { describe, it, expect } from "vitest";
import { haversine, formatDistance } from "@/lib/utils/geo";

describe("haversine", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversine(1, 1, 1, 1)).toBe(0);
  });
  it("returns approx 111km per degree of latitude", () => {
    const d = haversine(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("formatDistance", () => {
  it("formats metres < 1000 as 'm'", () => {
    expect(formatDistance(450)).toBe("450 m");
  });
  it("formats metres ≥ 1000 as 'km'", () => {
    expect(formatDistance(1500)).toBe("1.5 km");
  });
});
```

```ts
// tests/unit/currency.test.ts
import { describe, it, expect } from "vitest";
import { formatAmount } from "@/lib/utils/currency";

describe("formatAmount", () => {
  it("formats USD amount", () => {
    expect(formatAmount(12.5, "USD")).toBe("USD 12.50");
  });
  it("formats zero", () => {
    expect(formatAmount(0, "EUR")).toBe("EUR 0.00");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run tests/unit/geo.test.ts tests/unit/currency.test.ts
```
Expected: FAIL — cannot find modules

- [ ] **Step 3: Write `src/types/index.ts`**

```ts
export type POISource = "google" | "osm" | "brave";
export type ExpenseCategory = "food" | "transport" | "accommodation" | "attraction" | "other";
export type ReminderRepeat = "none" | "daily" | "weekly";

export interface NormalizedPOI {
  id: string;
  placeId: string;
  source: POISource;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distanceMetres?: number;
  address?: string;
  rating?: number;
  phone?: string;
  openNow?: boolean;
  verifiedCount: number;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note?: string;
  date: number;
  ticketId?: string;
}

export interface Reminder {
  id: string;
  title: string;
  body?: string;
  dueAt: number;
  repeat: ReminderRepeat;
  done: boolean;
}

export interface Ticket {
  id: string;
  imageUrl?: string;
  ocrText?: string;
  parsedDate?: number;
  parsedAmount?: number;
  parsedVenue?: string;
  createdAt: number;
}
```

- [ ] **Step 4: Write `src/lib/utils/deviceId.ts`**

```ts
const KEY = "mdf_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

- [ ] **Step 5: Write `src/lib/utils/geo.ts`**

```ts
/** Haversine distance in metres between two lat/lng points. */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format a distance in metres for display. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
```

- [ ] **Step 6: Write `src/lib/utils/currency.ts`**

```ts
/** Format an amount with its ISO 4217 currency code. */
export function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Detect the user's likely currency from their browser locale.
 * Falls back to "USD" if detection fails.
 */
export function detectLocaleCurrency(): string {
  if (typeof navigator === "undefined") return "USD";
  try {
    const locale = navigator.language || "en-US";
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
    }).format(0);
    // Extract currency code from the formatted string (rough heuristic)
    const match = formatted.match(/[A-Z]{3}/);
    return match ? match[0] : "USD";
  } catch {
    return "USD";
  }
}
```

- [ ] **Step 7: Configure Vitest**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/geo.test.ts tests/unit/currency.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 9: Commit**

```bash
git add src/types/ src/lib/utils/ tests/ vitest.config.ts
git commit -m "feat: add NormalizedPOI/Expense/Reminder/Ticket types + geo/currency/deviceId utils"
```

---

### Task A4: Convex Queries

**Files:**
- Create: `convex/queries.ts`
- Test: `tests/unit/queries-shape.test.ts` (import check)

**Interfaces:**
- Consumes: `convex/schema.ts` (table definitions)
- Produces (exact function names consumed by Tasks A5–A17 and sub-plans B/C/D):
  - `poiQuery(args: { deviceId: string; category: string }): NormalizedPOI[]`
  - `prefsQuery(args: { deviceId: string }): Doc<"userPrefs"> | null`
  - `historyQuery(args: { deviceId: string; limit: number }): Doc<"locationHistory">[]`
  - `recentFetchCheck(args: { deviceId: string; category: string; windowMs: number }): boolean`

- [ ] **Step 1: Write failing import test**

```ts
// tests/unit/queries-shape.test.ts
import { describe, it, expect } from "vitest";

describe("convex/queries module", () => {
  it("exports poiQuery", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.poiQuery).toBeDefined();
  });
  it("exports prefsQuery", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.prefsQuery).toBeDefined();
  });
  it("exports recentFetchCheck", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.recentFetchCheck).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/queries-shape.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write `convex/queries.ts`**

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const poiQuery = query({
  args: { deviceId: v.string(), category: v.string() },
  handler: async (ctx, { deviceId, category }) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return ctx.db
      .query("pois")
      .withIndex("by_deviceId_category", (q) =>
        q.eq("deviceId", deviceId).eq("category", category)
      )
      .filter((q) => q.gt(q.field("fetchedAt"), cutoff))
      .collect();
  },
});

export const prefsQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
  },
});

export const historyQuery = query({
  args: { deviceId: v.string(), limit: v.number() },
  handler: async (ctx, { deviceId, limit }) => {
    return ctx.db
      .query("locationHistory")
      .withIndex("by_deviceId_timestamp", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .take(limit);
  },
});

/** Returns true if a fetch was made within windowMs milliseconds. */
export const recentFetchCheck = query({
  args: { deviceId: v.string(), category: v.string(), windowMs: v.number() },
  handler: async (ctx, { deviceId, category, windowMs }) => {
    const cutoff = Date.now() - windowMs;
    const recent = await ctx.db
      .query("pois")
      .withIndex("by_deviceId_category", (q) =>
        q.eq("deviceId", deviceId).eq("category", category)
      )
      .filter((q) => q.gt(q.field("fetchedAt"), cutoff))
      .first();
    return recent !== null;
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/queries-shape.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/queries.ts tests/unit/queries-shape.test.ts
git commit -m "feat: add Convex queries (poiQuery, prefsQuery, historyQuery, recentFetchCheck)"
```

---

### Task A5: Convex Mutations

**Files:**
- Create: `convex/mutations.ts`

**Interfaces:**
- Consumes: `convex/schema.ts`
- Produces:
  - `upsertPOIs(args: { deviceId: string; pois: POIInput[] }): void`
  - `savePrefs(args: Partial<UserPrefsInput> & { deviceId: string }): void`
  - `saveLocation(args: { deviceId: string; lat: number; lng: number; accuracy: number }): void`
  - `purgeExpiredCache(): void` (called by cron — purges pois older than 24 h)
  - `verifyPOI(args: { placeId: string }): void` (increments verifiedCount)

- [ ] **Step 1: Write failing import test**

```ts
// tests/unit/mutations-shape.test.ts
import { describe, it, expect } from "vitest";

describe("convex/mutations module", () => {
  it("exports upsertPOIs", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.upsertPOIs).toBeDefined();
  });
  it("exports savePrefs", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.savePrefs).toBeDefined();
  });
  it("exports purgeExpiredCache", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.purgeExpiredCache).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/mutations-shape.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write `convex/mutations.ts`**

```ts
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const poiInputSchema = {
  placeId: v.string(),
  source: v.union(v.literal("google"), v.literal("osm"), v.literal("brave")),
  name: v.string(),
  category: v.string(),
  lat: v.number(),
  lng: v.number(),
  address: v.optional(v.string()),
  rating: v.optional(v.number()),
  phone: v.optional(v.string()),
  openNow: v.optional(v.boolean()),
  verifiedCount: v.number(),
  fetchedAt: v.number(),
};

export const upsertPOIs = mutation({
  args: {
    deviceId: v.string(),
    pois: v.array(v.object(poiInputSchema)),
  },
  handler: async (ctx, { deviceId, pois }) => {
    for (const poi of pois) {
      const existing = await ctx.db
        .query("pois")
        .withIndex("by_placeId", (q) => q.eq("placeId", poi.placeId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ...poi, fetchedAt: Date.now() });
      } else {
        await ctx.db.insert("pois", { ...poi, deviceId, fetchedAt: Date.now() });
      }
    }
  },
});

export const savePrefs = mutation({
  args: {
    deviceId: v.string(),
    elderlyMode: v.optional(v.boolean()),
    defaultRadius: v.optional(v.number()),
    currency: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    vapidSubscription: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    tripStartDate: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, ...updates }) => {
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("userPrefs", {
        deviceId,
        elderlyMode: updates.elderlyMode ?? false,
        defaultRadius: updates.defaultRadius ?? 1000,
        currency: updates.currency ?? "USD",
        notificationsEnabled: updates.notificationsEnabled ?? false,
        onboardingComplete: updates.onboardingComplete ?? false,
        ...updates,
      });
    }
  },
});

export const saveLocation = mutation({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("locationHistory", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const purgeExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stale = await ctx.db
      .query("pois")
      .withIndex("by_fetchedAt", (q) => q.lt("fetchedAt", cutoff))
      .collect();
    for (const poi of stale) {
      await ctx.db.delete(poi._id);
    }
  },
});

export const verifyPOI = mutation({
  args: { placeId: v.string() },
  handler: async (ctx, { placeId }) => {
    const poi = await ctx.db
      .query("pois")
      .withIndex("by_placeId", (q) => q.eq("placeId", placeId))
      .unique();
    if (poi) {
      await ctx.db.patch(poi._id, {
        verifiedCount: poi.verifiedCount + 1,
      });
    }
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/mutations-shape.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/mutations.ts tests/unit/mutations-shape.test.ts
git commit -m "feat: add Convex mutations (upsertPOIs, savePrefs, saveLocation, purgeExpiredCache, verifyPOI)"
```

---

### Task A6: Convex Action — Google Places

**Files:**
- Create: `convex/actions/fetchGooglePlaces.ts`

**Interfaces:**
- Consumes: `api.queries.recentFetchCheck`, `api.mutations.upsertPOIs`
- Produces:
  - `fetchNearby(args: { deviceId: string; lat: number; lng: number; radius: number; category: string }): { cached: boolean }`

- [ ] **Step 1: Write failing import test**

```ts
// tests/unit/actions-shape.test.ts
import { describe, it, expect } from "vitest";

describe("fetchGooglePlaces action", () => {
  it("module can be imported", async () => {
    const mod = await import("../../convex/actions/fetchGooglePlaces");
    expect(mod.fetchNearby).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/actions-shape.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write `convex/actions/fetchGooglePlaces.ts`**

```ts
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const fetchNearby = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
    category: v.string(),
  },
  handler: async (ctx, { deviceId, lat, lng, radius, category }) => {
    // Rate-limit: 1 refresh per device per category per hour
    const recent = await ctx.runQuery(api.queries.recentFetchCheck, {
      deviceId,
      category,
      windowMs: 3_600_000,
    });
    if (recent) return { cached: true };

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) throw new Error("GOOGLE_PLACES_API_KEY not set");

    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.location,places.rating,places.currentOpeningHours,places.formattedAddress,places.internationalPhoneNumber",
      },
      body: JSON.stringify({
        includedTypes: [category],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radiusMeters: radius,
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Google Places API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    await ctx.runMutation(api.mutations.upsertPOIs, {
      deviceId,
      pois: (data.places ?? []).map((p: Record<string, unknown>) => {
        const loc = p.location as { latitude: number; longitude: number };
        const name = p.displayName as { text: string } | undefined;
        return {
          placeId: p.id as string,
          source: "google" as const,
          name: name?.text ?? "Unknown",
          category,
          lat: loc.latitude,
          lng: loc.longitude,
          address: p.formattedAddress as string | undefined,
          rating: p.rating as number | undefined,
          phone: p.internationalPhoneNumber as string | undefined,
          openNow: (p.currentOpeningHours as { openNow?: boolean } | undefined)
            ?.openNow,
          verifiedCount: 0,
          fetchedAt: Date.now(),
        };
      }),
    });

    return { cached: false };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/actions-shape.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/actions/fetchGooglePlaces.ts tests/unit/actions-shape.test.ts
git commit -m "feat: add fetchGooglePlaces Convex action with rate-limiting"
```

---

### Task A7: Convex Actions — Overpass + Entertainment

**Files:**
- Create: `convex/actions/fetchOverpass.ts`
- Create: `convex/actions/fetchEntertainment.ts`
- Create: `convex/crons.ts`

**Interfaces:**
- Consumes: `api.mutations.upsertPOIs`, `internal.mutations.purgeExpiredCache`
- Produces:
  - `fetchOverpassNearby(args: { deviceId: string; lat: number; lng: number; radius: number }): { count: number }`
  - `fetchEntertainment(args: { deviceId: string; lat: number; lng: number; radius: number }): { count: number }`
  - Cron: purge expired POIs every hour; send due reminders every 5 min

- [ ] **Step 1: Write `convex/actions/fetchOverpass.ts`**

```ts
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/** Fetches public toilets + parks from OpenStreetMap Overpass API */
export const fetchOverpassNearby = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, { deviceId, lat, lng, radius }) => {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="toilets"](around:${radius},${lat},${lng});
        node["leisure"="park"](around:${radius},${lat},${lng});
        node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      );
      out body 20;
    `;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
    const data = await res.json();

    const elements: Array<{
      id: number;
      lat: number;
      lon: number;
      tags?: Record<string, string>;
    }> = data.elements ?? [];

    await ctx.runMutation(api.mutations.upsertPOIs, {
      deviceId,
      pois: elements.map((el) => ({
        placeId: `osm:${el.id}`,
        source: "osm" as const,
        name: el.tags?.name ?? el.tags?.amenity ?? el.tags?.leisure ?? "POI",
        category: el.tags?.amenity ?? el.tags?.leisure ?? "other",
        lat: el.lat,
        lng: el.lon,
        verifiedCount: 0,
        fetchedAt: Date.now(),
      })),
    });

    return { count: elements.length };
  },
});
```

- [ ] **Step 2: Write `convex/actions/fetchEntertainment.ts`**

```ts
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * Fetches entertainment events nearby.
 * Uses Brave Search API if key is available, else falls back to Overpass
 * (theaters, cinemas, nightclubs).
 */
export const fetchEntertainment = action({
  args: {
    deviceId: v.string(),
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, { deviceId, lat, lng, radius }) => {
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;

    if (braveKey) {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/local/pois?q=entertainment+events&latitude=${lat}&longitude=${lng}&count=20`,
        { headers: { "Accept-Encoding": "gzip", "X-Subscription-Token": braveKey } }
      );
      if (res.ok) {
        const data = await res.json();
        const results: Array<{
          id: string;
          name: string;
          coordinates?: { lat: number; lon: number };
          address?: { street_address: string };
        }> = data.results ?? [];
        await ctx.runMutation(api.mutations.upsertPOIs, {
          deviceId,
          pois: results.map((r) => ({
            placeId: `brave:${r.id}`,
            source: "brave" as const,
            name: r.name,
            category: "entertainment",
            lat: r.coordinates?.lat ?? lat,
            lng: r.coordinates?.lon ?? lng,
            address: r.address?.street_address,
            verifiedCount: 0,
            fetchedAt: Date.now(),
          })),
        });
        return { count: results.length };
      }
    }

    // Fallback: Overpass theaters + cinemas
    const q = `
      [out:json][timeout:25];
      (
        node["amenity"="theatre"](around:${radius},${lat},${lng});
        node["amenity"="cinema"](around:${radius},${lat},${lng});
        node["amenity"="nightclub"](around:${radius},${lat},${lng});
      );
      out body 20;
    `;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(q)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!res.ok) throw new Error(`Overpass fallback error: ${res.status}`);
    const data = await res.json();
    const elements: Array<{
      id: number;
      lat: number;
      lon: number;
      tags?: Record<string, string>;
    }> = data.elements ?? [];
    await ctx.runMutation(api.mutations.upsertPOIs, {
      deviceId,
      pois: elements.map((el) => ({
        placeId: `osm:${el.id}`,
        source: "osm" as const,
        name: el.tags?.name ?? el.tags?.amenity ?? "Entertainment",
        category: "entertainment",
        lat: el.lat,
        lng: el.lon,
        verifiedCount: 0,
        fetchedAt: Date.now(),
      })),
    });
    return { count: elements.length };
  },
});
```

- [ ] **Step 3: Write `convex/crons.ts`**

```ts
import { cronJobs } from "convex/server";
import { internal, api } from "./_generated/api";

const crons = cronJobs();

// Purge stale POI cache every hour
crons.interval(
  "purge-poi-cache",
  { hours: 1 },
  internal.mutations.purgeExpiredCache
);

// Send due push notification reminders every 5 minutes
// (action added in plan-c-reminders.md Task C3)
// crons.interval("send-reminders", { minutes: 5 }, internal.actions.sendDueReminders);

export default crons;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add convex/actions/ convex/crons.ts
git commit -m "feat: add fetchOverpass, fetchEntertainment Convex actions + cron setup"
```

---

### Task A8: Convex Client + App Providers

**Files:**
- Create: `src/lib/convex/client.ts`
- Modify: `src/app/layout.tsx` (add ConvexProvider + font)

**Interfaces:**
- Consumes: `NEXT_PUBLIC_CONVEX_URL` env var
- Produces:
  - `convexClient` singleton exported from `src/lib/convex/client.ts`
  - `layout.tsx` wraps all children in `<ConvexProvider client={convexClient}>`

- [ ] **Step 1: Write `src/lib/convex/client.ts`**

```ts
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

export const convexClient = new ConvexReactClient(convexUrl);
```

- [ ] **Step 2: Update `src/app/layout.tsx` with providers**

```tsx
"use client";
// Note: ConvexProvider requires client component wrapper

import type { Metadata } from "next";
import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convex/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mom's Dragonfly",
  description: "Your travel companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <ConvexProvider client={convexClient}>{children}</ConvexProvider>
      </body>
    </html>
  );
}
```

> **Note:** Next.js App Router requires a separate `providers.tsx` client component for the ConvexProvider. Create `src/app/providers.tsx`:

```tsx
"use client";
import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convex/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
```

Then update `layout.tsx` (remove "use client", import Providers):

```tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mom's Dragonfly",
  description: "Your travel companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/convex/ src/app/layout.tsx src/app/providers.tsx
git commit -m "feat: add ConvexReactClient singleton + Providers wrapper in layout"
```

---

### Task A9: Shell Components (BottomNav + ElderlyModeToggle + CookieConsent)

**Files:**
- Create: `src/components/shell/BottomNav.tsx`
- Create: `src/components/shell/ElderlyModeToggle.tsx`
- Create: `src/components/shell/CookieConsent.tsx`
- Create: `src/app/(tabs)/layout.tsx`
- Create: `src/app/(tabs)/explore/page.tsx` (stub)
- Create: `src/app/(tabs)/budget/page.tsx` (stub)
- Create: `src/app/(tabs)/reminders/page.tsx` (stub)
- Create: `src/app/(tabs)/tickets/page.tsx` (stub)
- Create: `src/app/page.tsx` (redirect to /explore)

**Interfaces:**
- Consumes: `cn()` from `@/lib/utils/cn`
- Produces:
  - `<BottomNav />` — 4-tab bottom navigation (Explore, Budget, Reminders, Tickets)
  - `<ElderlyModeToggle />` — toggles `.elderly` class on `<html>`, persists to localStorage
  - `<CookieConsent />` — shows once, stores `mdf_cookie_ok` in localStorage

- [ ] **Step 1: Write `src/components/shell/BottomNav.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/explore", label: "Explore", icon: "🗺️" },
  { href: "/budget", label: "Budget", icon: "💰" },
  { href: "/reminders", label: "Reminders", icon: "🔔" },
  { href: "/tickets", label: "Tickets", icon: "🎟️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50"
      aria-label="Main navigation"
    >
      <ul className="flex">
        {tabs.map(({ href, label, icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center justify-center py-2 text-xs",
                "min-h-[var(--touch-target)] w-full",
                pathname.startsWith(href)
                  ? "text-brand-600 font-semibold"
                  : "text-gray-500"
              )}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              <span className="text-2xl" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Write `src/components/shell/ElderlyModeToggle.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

const KEY = "mdf_elderly_mode";

export function ElderlyModeToggle() {
  const [elderly, setElderly] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY) === "true";
    setElderly(stored);
    document.documentElement.classList.toggle("elderly", stored);
  }, []);

  const toggle = () => {
    const next = !elderly;
    setElderly(next);
    localStorage.setItem(KEY, String(next));
    document.documentElement.classList.toggle("elderly", next);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
        "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
        elderly
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-gray-700 border-gray-300"
      )}
      aria-pressed={elderly}
      aria-label="Toggle large-text mode"
    >
      {elderly ? "Large Mode ON" : "Large Mode"}
    </button>
  );
}
```

- [ ] **Step 3: Write `src/components/shell/CookieConsent.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";

const KEY = "mdf_cookie_ok";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-16 inset-x-0 mx-4 bg-gray-800 text-white rounded-xl p-4 z-50 shadow-lg"
    >
      <p className="text-sm mb-3">
        We store your preferences locally on your device. No data is shared with
        third parties.
      </p>
      <button
        onClick={accept}
        className="w-full bg-brand-500 text-white rounded-lg py-2 font-semibold min-h-[var(--touch-target)]"
      >
        Got it
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write tab stubs and layout**

`src/app/(tabs)/layout.tsx`:
```tsx
import { BottomNav } from "@/components/shell/BottomNav";
import { CookieConsent } from "@/components/shell/CookieConsent";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-16">{children}</main>
      <BottomNav />
      <CookieConsent />
    </>
  );
}
```

`src/app/(tabs)/explore/page.tsx`:
```tsx
export default function ExplorePage() {
  return <div className="p-4"><h1 className="text-xl font-bold">Explore</h1></div>;
}
```

Repeat for `budget/page.tsx`, `reminders/page.tsx`, `tickets/page.tsx` (same pattern, different titles).

`src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/explore");
}
```

- [ ] **Step 5: Verify build**

```bash
pnpm build
```
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/components/shell/ src/app/
git commit -m "feat: add BottomNav, ElderlyModeToggle, CookieConsent + tab layout stubs"
```

---

### Task A10: Map View (Leaflet + Geolocation Hook)

**Files:**
- Create: `src/hooks/useGeolocation.ts`
- Create: `src/components/map/MapView.tsx`
- Create: `src/components/map/POIMarker.tsx`

**Interfaces:**
- Consumes: `NormalizedPOI` from `@/types`, `haversine` + `formatDistance` from `@/lib/utils/geo`
- Produces:
  - `useGeolocation(): { lat: number | null; lng: number | null; accuracy: number | null; error: string | null }`
  - `<MapView pois={NormalizedPOI[]} onVerify={(placeId: string) => void} />` — Leaflet map with POI markers, SSR=false
  - `<POIMarker poi={NormalizedPOI} onVerify={() => void} />` — marker with popup

- [ ] **Step 1: Write `src/hooks/useGeolocation.ts`**

```ts
"use client";
import { useState, useEffect } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
        }),
      (err) =>
        setState((s) => ({
          ...s,
          error:
            err.code === 1
              ? "Location access denied — please enable in browser settings"
              : "Could not get location",
        })),
      { enableHighAccuracy: true, maximumAge: 30_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
```

- [ ] **Step 2: Write `src/components/map/POIMarker.tsx`**

```tsx
import type { NormalizedPOI } from "@/types";
import { formatDistance } from "@/lib/utils/geo";
import { Marker, Popup } from "react-leaflet";

interface POIMarkerProps {
  poi: NormalizedPOI;
  onVerify: () => void;
}

export function POIMarker({ poi, onVerify }: POIMarkerProps) {
  return (
    <Marker position={[poi.lat, poi.lng]}>
      <Popup>
        <div className="min-w-[200px]">
          <h3 className="font-semibold text-base">{poi.name}</h3>
          {poi.address && <p className="text-sm text-gray-600">{poi.address}</p>}
          {poi.distanceMetres !== undefined && (
            <p className="text-sm text-brand-600">
              {formatDistance(poi.distanceMetres)} away
            </p>
          )}
          {poi.rating !== undefined && (
            <p className="text-sm">⭐ {poi.rating.toFixed(1)}</p>
          )}
          <button
            onClick={onVerify}
            className="mt-2 w-full bg-brand-500 text-white rounded py-1 text-sm"
          >
            ✓ Verify ({poi.verifiedCount})
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
```

- [ ] **Step 3: Write `src/components/map/MapView.tsx` (dynamic import, SSR=false)**

```tsx
"use client";
import dynamic from "next/dynamic";
import type { NormalizedPOI } from "@/types";

// Leaflet must not be imported server-side
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

interface MapViewProps {
  pois: NormalizedPOI[];
  center?: [number, number];
  onVerify: (placeId: string) => void;
}

export function MapView({ pois, center, onVerify }: MapViewProps) {
  return (
    <div className="w-full h-64 rounded-xl overflow-hidden">
      <LeafletMap pois={pois} center={center} onVerify={onVerify} />
    </div>
  );
}
```

Create `src/components/map/LeafletMap.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { NormalizedPOI } from "@/types";
import { POIMarker } from "./POIMarker";
import L from "leaflet";

// Fix Leaflet default icon in webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

interface LeafletMapProps {
  pois: NormalizedPOI[];
  center?: [number, number];
  onVerify: (placeId: string) => void;
}

export default function LeafletMap({ pois, center, onVerify }: LeafletMapProps) {
  const defaultCenter: [number, number] = center ?? [0, 0];
  return (
    <MapContainer center={defaultCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {center && <RecenterMap center={center} />}
      {pois.map((poi) => (
        <POIMarker
          key={poi.placeId}
          poi={poi}
          onVerify={() => onVerify(poi.placeId)}
        />
      ))}
    </MapContainer>
  );
}
```

- [ ] **Step 4: Verify build (Leaflet must not break SSR)**

```bash
pnpm build
```
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/hooks/ src/components/map/
git commit -m "feat: add useGeolocation hook + Leaflet MapView (SSR=false) + POIMarker"
```

---

### Task A11: POI List + Filter (Virtualised)

**Files:**
- Create: `src/components/poi/POICard.tsx`
- Create: `src/components/poi/POIList.tsx`
- Create: `src/components/poi/POIFilter.tsx`

**Interfaces:**
- Consumes: `NormalizedPOI` type, `formatDistance` from geo utils
- Produces:
  - `<POICard poi={NormalizedPOI} onVerify={() => void} />` — card with name, distance, category badge, verify button
  - `<POIList pois={NormalizedPOI[]} onVerify={(placeId) => void} />` — react-window FixedSizeList, row height 96px
  - `<POIFilter category={string} onChange={(cat: string) => void} />` — horizontal scroll pill filter

- [ ] **Step 1: Write `src/components/poi/POICard.tsx`**

```tsx
import type { NormalizedPOI } from "@/types";
import { formatDistance } from "@/lib/utils/geo";
import { cn } from "@/lib/utils/cn";

interface POICardProps {
  poi: NormalizedPOI;
  onVerify: () => void;
}

export function POICard({ poi, onVerify }: POICardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border-b border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{poi.name}</p>
        {poi.address && (
          <p className="text-sm text-gray-500 truncate">{poi.address}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            "bg-brand-50 text-brand-600"
          )}>
            {poi.category}
          </span>
          {poi.distanceMetres !== undefined && (
            <span className="text-xs text-gray-400">
              {formatDistance(poi.distanceMetres)}
            </span>
          )}
          {poi.rating && (
            <span className="text-xs text-gray-400">⭐ {poi.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
      <button
        onClick={onVerify}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border",
          "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
          "border-brand-500 text-brand-600 hover:bg-brand-50"
        )}
        aria-label={`Verify ${poi.name}`}
      >
        ✓ {poi.verifiedCount}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/poi/POIList.tsx`**

```tsx
"use client";
import { FixedSizeList } from "react-window";
import type { NormalizedPOI } from "@/types";
import { POICard } from "./POICard";

interface POIListProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  height?: number;
}

const ROW_HEIGHT = 96;

export function POIList({ pois, onVerify, height = 400 }: POIListProps) {
  if (pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p className="text-4xl mb-2">📍</p>
        <p className="text-sm">No places found nearby</p>
      </div>
    );
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={pois.length}
      itemSize={ROW_HEIGHT}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <POICard
            poi={pois[index]}
            onVerify={() => onVerify(pois[index].placeId)}
          />
        </div>
      )}
    </FixedSizeList>
  );
}
```

- [ ] **Step 3: Write `src/components/poi/POIFilter.tsx`**

```tsx
"use client";
import { cn } from "@/lib/utils/cn";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "restaurant", label: "🍽 Food" },
  { value: "toilets", label: "🚻 Toilets" },
  { value: "pharmacy", label: "💊 Pharmacy" },
  { value: "attraction", label: "🏛 Attractions" },
  { value: "entertainment", label: "🎭 Events" },
  { value: "park", label: "🌳 Parks" },
] as const;

interface POIFilterProps {
  category: string;
  onChange: (cat: string) => void;
}

export function POIFilter({ category, onChange }: POIFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-4 scrollbar-hide">
      {CATEGORIES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap",
            "min-h-[var(--touch-target)]",
            category === value
              ? "bg-brand-600 text-white border-brand-600"
              : "bg-white text-gray-600 border-gray-300"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/poi/
git commit -m "feat: add POICard, POIList (virtualised), POIFilter components"
```

---

### Tasks A12–A21 (Summary — full details in living document)

> **Note to agentic executors:** Tasks A12–A21 follow the exact same TDD pattern (failing test → implement → pass → commit). They are:

| Task | Deliverable | Key files |
|------|-------------|-----------|
| A12 | Onboarding (IntroVideo, OnboardingSlides, DaysCounter) | `src/components/onboarding/` |
| A13 | InstallPrompt + UpdateBanner (PWA hooks) | `src/components/shell/` |
| A14 | Explore page: wire location → action → query → MapView + POIList | `src/app/(tabs)/explore/page.tsx` |
| A15 | Settings sheet (radius, currency, elderly mode, notifications) | `src/components/shell/SettingsSheet.tsx` |
| A16 | Toast/error system | `src/components/ui/Toast.tsx`, `src/hooks/useToast.ts` |
| A17 | Vitest config + unit tests for geo, currency, deviceId | `vitest.config.ts`, `tests/unit/` |
| A18 | Playwright config + E2E smoke (map loads, POI visible) | `playwright.config.ts`, `tests/e2e/smoke.spec.ts` |
| A19 | `pnpm build` + `pnpm tsc --noEmit` clean | CI validation |
| A20 | `git tag v0.1.0-core` | Tag for sub-plans B/C/D to branch from |
| A21 | Deploy to Vercel preview + verify Convex connected | Deployment |

Full bite-sized steps for A12–A21 are in the living document at `docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md`. Add them here as each task is written during execution.

---

**Sub-Plan A Complete.** Proceed to Sub-Plans B, C, D in parallel (or sequentially).
