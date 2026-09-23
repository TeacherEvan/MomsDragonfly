export interface RideDestination {
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface RidePickup {
  lat: number;
  lng: number;
}

/**
 * Bolt publishes no consumer booking/deep-link API, so the best a third-party
 * app can do is open Bolt with the destination on the clipboard.
 *
 * - **Android + Chromium-family**: an explicit `intent://` URL targets the Bolt
 *   app (`ee.mtakso.client`) — bolt.eu/.well-known/assetlinks.json claims
 *   `common.handle_all_urls`. `S.browser_fallback_url` opens the website when the
 *   app is not installed (encoded so Chrome parses the outer intent URL).
 * - **Everything else (iOS, desktop, Firefox)**: fall back to https://bolt.eu/.
 *   iOS CANNOT launch the Bolt app from a web page — Bolt's AASA file only claims
 *   `webcredentials`, there is no `applinks` section (verified 2026-09-22), so no
 *   Universal Link exists. Do not "fix" this later without new evidence.
 */
export interface BoltLaunch {
  href: string;
  mode: "app" | "web";
}

const BOLT_WEB_URL = "https://bolt.eu/";

export function buildBoltLaunch(ua: string): BoltLaunch {
  const isAndroid = /Android/i.test(ua);
  const isChromiumFamily = /Chrome\/|SamsungBrowser|EdgA|OPR/i.test(ua);
  if (isAndroid && isChromiumFamily) {
    const fallback = encodeURIComponent(BOLT_WEB_URL);
    return {
      mode: "app",
      href:
        `intent://bolt.eu/#Intent;scheme=https;package=ee.mtakso.client;` +
        `action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;` +
        `S.browser_fallback_url=${fallback};end`,
    };
  }
  return { mode: "web", href: BOLT_WEB_URL };
}

/** Google Maps directions deep link with a fully prefilled destination. */
export function buildMapsUrl(dest: RideDestination, pickup?: RidePickup | null): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${dest.lat},${dest.lng}`,
    travelmode: "driving",
  });
  if (pickup) {
    params.set("origin", `${pickup.lat},${pickup.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Text copied to the clipboard so the destination can be pasted into Bolt. */
export function buildDestinationText(dest: RideDestination): string {
  const parts = [
    dest.name,
    dest.address,
    `${dest.lat.toFixed(5)}, ${dest.lng.toFixed(5)}`,
  ];
  return parts.filter(Boolean).join(" — ");
}