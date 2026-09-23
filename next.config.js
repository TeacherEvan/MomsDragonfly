/** @type {import('next').NextConfig} */

// Single source of truth for security + caching headers. `vercel.json` no
// longer duplicates them (they had already drifted: Permissions-Policy
// differed between the two), and `src/middleware.ts` was removed —
// next.config.js `headers()` applies in every environment, including
// non-Vercel (`next start`).
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://generativelanguage.googleapis.com https://api.search.brave.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com https://*.googleapis.com https://*.googleusercontent.com https://upload.wikimedia.org https://thumb.wikimedia.org https://*.convex.site",
      "connect-src 'self' https://*.convex.cloud https://generativelanguage.googleapis.com https://api.search.brave.com https://overpass-api.de https://places.googleapis.com https://*.googleapis.com wss:",
      "frame-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
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