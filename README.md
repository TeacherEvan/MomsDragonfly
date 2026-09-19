# Mom's Dragonfly

A mobile-first PWA travel companion — proximity-based verified POIs (10m→20km+), budgeting, reminders, ticket scanning/OCR — completely free, offline-first, no sign-in.

## Tech Stack

- **Framework:** Next.js 14 App Router (Vercel)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database:** Convex (realtime DB + actions + scheduled functions)
- **Maps:** Leaflet + react-leaflet
- **OCR:** Tesseract.js (offline) with Gemini Vision fallback
- **PWA:** next-pwa
- **Testing:** Vitest (unit), Playwright (E2E), Lighthouse CI
- **Deployment:** Vercel

## Features

- **Explore:** Proximity-based POIs (restaurants, toilets, pharmacies, attractions, entertainment, parks) with offline caching
- **Budget:** Expense tracking with currency support, visual budget ring
- **Reminders:** Scheduled notifications with days counter
- **Tickets:** Camera capture + OCR (Tesseract.js offline, Gemini Vision fallback) + IndexedDB storage
- **PWA:** Install prompts, update banners, offline support, accessibility (WCAG AA + elderly mode)
- **Privacy:** No auth, deviceId-based, IndexedDB primary storage

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Convex account (for backend)

### Installation

```bash
# Install dependencies
pnpm install

# Set up Convex (first time only)
pnpm convex dev

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm test:lhci` | Run Lighthouse CI |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (tabs)/            # Tab-based navigation pages
│   │   ├── explore/       # POI exploration
│   │   ├── budget/        # Budget tracking
│   │   ├── reminders/     # Reminders & notifications
│   │   ├── tickets/       # Ticket OCR & gallery
│   │   └── settings/      # User preferences
│   ├── providers.tsx      # Convex, Toast, Network providers
│   └── layout.tsx         # Root layout
├── components/
│   ├── map/               # Leaflet map components
│   ├── poi/               # POI list, filter, card
│   ├── budget/            # Budget dashboard, ring, forms
│   ├── reminders/         # Reminder list, forms, days counter
│   ├── tickets/           # Scanner, gallery, OCR results
│   ├── shell/             # BottomNav, InstallPrompt, UpdateBanner, CookieConsent
│   └── onboarding/        # IntroVideo, DaysCounter
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── actions.ts         # External API calls (Google Places, Overpass, Brave, Gemini)
│   ├── mutations.ts       # Database mutations
│   ├── queries.ts         # Database queries
│   ├── crons.ts           # Scheduled functions (reminders, cleanup)
│   └── auth.ts            # Device ID validation
├── hooks/                 # Custom React hooks
├── lib/
│   ├── convex/            # Convex client singleton
│   ├── tickets/           # OCR, parsing, IndexedDB
│   └── utils/             # Currency, geo, deviceId, cn helpers
├── hooks/                 # Custom React hooks
└── types/                 # Shared TypeScript types
```

## Key Implementation Details

### Tesseract.js Production Handling

Tesseract.js has known issues in production Next.js builds. The app uses a wrapper (`src/lib/tickets/tesseract-wrapper.js`) that:
- Returns a mock implementation in production
- Loads the real Tesseract.js only in development
- Prevents runtime errors (`TypeError: r is not a function`) in production builds

### Convex Backend

- **Schema:** POIs, userPrefs, locationHistory, expenses, budgets, reminders, tickets
- **Actions:** Google Places (New), Overpass (OSM), Brave Search, Gemini Vision
- **Crons:** Reminder notifications, expired cache/ticket cleanup (batched, BATCH_SIZE=500)
- **Auth:** Device ID validation via `validateDeviceId()` guards

### PWA Configuration

- `next-pwa` configured with service worker
- Install prompts, update banners
- Offline page (`/offline.html`)
- Accessibility headers, WCAG AA compliance
- Elderly mode (larger targets, high contrast, bottom nav)

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires running dev server)
pnpm test:e2e

# Lighthouse CI
pnpm test:lhci
```

### Test Coverage

- Unit tests: 84 passing (currency, geo, budget utils, etc.)
- E2E tests: Accessibility, app load, dashboard navigation, reminders, tickets
- Lighthouse CI: Performance, accessibility, best practices, SEO, PWA

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
2. Add environment variables
3. Deploy

### Convex Production

```bash
pnpm convex deploy
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint && pnpm typecheck && pnpm test`
5. Submit a pull request

## Project Plan

See [Implementation Plan](docs/plans/2025-09-17-MomsDragonFly-Implementation.md) for detailed task breakdown and status.