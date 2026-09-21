/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://generativelanguage.googleapis.com https://api.search.brave.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com https://*.googleapis.com https://*.googleusercontent.com",
              "connect-src 'self' https://*.convex.cloud https://generativelanguage.googleapis.com https://api.search.brave.com https://overpass-api.de https://places.googleapis.com https://*.googleapis.com wss:",
              "frame-src 'self'",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(self), microphone=()",
          },
        ],
      },
      {
        // Long-lived caching for self-hosted OCR assets (worker, wasm, langdata)
        source: "/tesseract/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;