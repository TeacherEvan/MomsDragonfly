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

/** Android intent URL (verified assetlinks.json: Bolt app ee.mtakso.client claims common.handle_all_urls). iOS limitation: AASA file has no applinks claim (only webcredentials) — no Universal Link; clipboard + web fallback remains. */
export function buildBoltUrl(): string {
  return "intent://#Intent;scheme=https;package=ee.mtakso.client;S.browser_fallback_url=https://bolt.eu/;end";
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