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
 * Bolt universal link — opens the Bolt app on mobile when installed,
 * otherwise the Bolt website (where the app can be installed).
 * Bolt currently publishes no consumer booking/deep-link API, so the
 * destination is delivered via clipboard + this link.
 */
export function buildBoltUrl(): string {
  return "https://bolt.eu/";
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