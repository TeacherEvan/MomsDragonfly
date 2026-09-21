# Verification Report - Mom's Dragonfly

## Critical Discovery
The Vercel production app uses .env.local which points to DEV Convex (different-squid-155).
The production Convex deployment (rare-alpaca-711) has all the data.
The app connects to the WRONG database, which explains "maps load but no store names".

## Fix Required
- Set Vercel NEXT_PUBLIC_CONVEX_URL = https://rare-alpaca-711.convex.cloud
- Set Vercel CONVEX_DEPLOYMENT = prod:rare-alpaca-711
- Redeploy Vercel

## Current Status
- Google Places API: WORKING (20 restaurants, 20 cafes, 20 parks, etc.)
- Convex production: HAS DATA
- Vercel production: CONNECTS TO WRONG CONVEX (likely dev/empty)
- Browser geolocation: 403 error (separate issue from data loading)
- Mutation fixed (deviceIds array accumulation removed)
- Query fixed ([deviceId] array match)
- Action radius fixed (radius instead of radiusMeters)
