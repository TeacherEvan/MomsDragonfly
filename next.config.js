/** @type {import('next').NextConfig} */

// Single source of truth for security + caching headers. `vercel.json` no
// longer duplicates them (they had already drifted: Permissions-Policy
// differed between the two), and `src/middleware.ts` was removed —
// next.config.js `headers()` applies in every environment, including
// non-Vercel (`next start`).
/**
 * Loopback hostnames only — a stray or tampered env value must never widen
 * the CSP, so anything that is not 127.0.0.1/localhost/::1 is rejected.
 */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * http + ws origin pair for a plain-http, loopback deployment URL — e.g. a
 * local `npx convex dev` deployment (cloud deployment on 3210, site
 * deployment on 3211). Production deployments are https://*.convex.cloud
 * and already covered by the wildcards below, so nothing is added for them.
 * CSP has no implicit localhost access and 'self' only matches the page
 * origin: without this the Convex WebSocket (query sync) and HTTP (actions)
 * are blocked and every Convex-backed card stays empty forever.
 */
function loopbackConvexOrigin(raw) {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:") return null;
    if (!LOOPBACK_HOSTS.has(parsed.hostname)) return null;
    return { http: `http://${parsed.host}`, ws: `ws://${parsed.host}` };
  } catch {
    return null;
  }
}

/** connect-src counterpart — the Convex client speaks HTTP + WebSocket. */
function convexConnectSources() {
  const origin = loopbackConvexOrigin(process.env.NEXT_PUBLIC_CONVEX_URL);
  return origin ? [origin.http, origin.ws] : [];
}

/**
 * img-src counterpart — place-details photos are proxied from the Convex
 * SITE deployment (a different port: 3211 locally) by /place-photo.
 * Without this every details-sheet photo is CSP-blocked in local dev,
 * exactly like the WebSocket was before the connect-src fix. Images only:
 * the browser never fetches /place-photo with XHR/fetch.
 */
function convexSiteImageSources() {
  const origin = loopbackConvexOrigin(process.env.NEXT_PUBLIC_CONVEX_SITE_URL);
  return origin ? [origin.http] : [];
}

const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      [
        "img-src 'self'",
        "data:",
        "blob:",
        "https://*.tile.openstreetmap.org",
        "https://tile.openstreetmap.org",
        "https://unpkg.com",
        "https://*.googleapis.com",
        "https://*.googleusercontent.com",
        "https://upload.wikimedia.org",
        "https://thumb.wikimedia.org",
        "https://*.convex.site",
        ...convexSiteImageSources(),
      ].join(" "),
      [
        "connect-src 'self'",
        "https://*.convex.cloud",
        "https://generativelanguage.googleapis.com",
        "https://api.search.brave.com",
        "https://overpass-api.de",
        "https://places.googleapis.com",
        "https://*.googleapis.com",
        "wss:",
        ...convexConnectSources(),
      ].join(" "),
      "frame-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "0" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(self), microphone=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const IMMUTABLE_CACHE = { key: "Cache-Control", value: "public, max-age=31536000, immutable" };

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Long-lived caching for self-hosted OCR assets (worker, wasm, langdata)
        source: "/tesseract/:file*",
        headers: [IMMUTABLE_CACHE],
      },
      {
        source: "/icons/:file*",
        headers: [IMMUTABLE_CACHE],
      },
      {
        source: "/_next/static/:file*",
        headers: [IMMUTABLE_CACHE],
      },
    ];
  },
};

module.exports = nextConfig;