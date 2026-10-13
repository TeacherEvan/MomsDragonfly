import type { IconName } from "@/components/ui/Icon";
import type { POISource } from "@/types";

/** Icon for each app category. Shared by the list cards and the details sheet. */
export const CATEGORY_ICONS: Record<string, IconName> = {
  restaurant: "restaurant",
  park: "tree",
  attraction: "landmark",
  entertainment: "theater",
  toilets: "toilet",
  pharmacy: "pharmacy",
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "Food",
  park: "Park",
  attraction: "Attraction",
  entertainment: "Events",
  toilets: "Restroom",
  pharmacy: "Pharmacy",
};

/** Source names as people say them, not the raw database keys. */
const SOURCE_LABELS: Record<POISource, string> = {
  google: "Google",
  osm: "OpenStreetMap",
  brave: "Web search",
};

function hasOwn(map: Record<string, string>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(map, key);
}

/** Friendly label for a category key, sentence-cased for keys we do not know. */
export function categoryLabel(category: string | undefined): string {
  const key = (category ?? "").trim();
  if (!key) return "Place";
  if (hasOwn(CATEGORY_LABELS, key)) return CATEGORY_LABELS[key];
  const words = key.replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Readable data-source name, or null when the source is unknown. */
export function sourceLabel(source: POISource | undefined): string | null {
  if (!source || !hasOwn(SOURCE_LABELS, source)) return null;
  return SOURCE_LABELS[source];
}
