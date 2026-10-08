# External research — journal sharing patterns (2026-10-08)

Strategy: pattern-driven + targeted-docs. Source tiers in brackets.

- Tokenized read-only viewer URL is the dominant pattern for sharing a live
  location/trip feed without accounts (Google Maps location sharing links,
  Strava Beacon). The unguessable token is the credential; recipients need
  no login. [Tier 1: vendor support docs]
- GPX is the standard history-export format (Garmin, Strava, RideWithGPS);
  GeoJSON (RFC 7946) is the standard for web-map/analysis interchange.
  Gotcha: GPX `lat,lon` vs GeoJSON `[lon,lat]` axis flip. [Tier 1: MDN/RFC/vendor docs]
- Web Share API (`navigator.share`) is the recommended mobile share path,
  always with clipboard fallback; requires HTTPS + transient activation.
  [Tier 1: MDN/web.dev]
- For a one-way "live" feed: poll or SSE; WebSockets only needed
  bidirectionally. In a Convex app, reactive `useQuery` gives live updates
  natively — no raw SSE needed. [Tier 3: vendor/example repos]
- Trail rendering is plain polylines (Leaflet/MapLibre); OSRM is for
  routing, not recording playback. [Tier 2: Leaflet docs]

Applied: token link (`/share/[token]`), GPX + GeoJSON export,
`navigator.share` with copy fallback, Convex-reactive live view.
