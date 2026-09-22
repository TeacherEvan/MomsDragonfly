/**
 * Pure helpers for the getPlaceDetails action, the /place-photo HTTP proxy and
 * the place-enrichment cache.
 *
 * Deliberately free of Convex imports (no `process.env` reads either — the env
 * is passed in) so every rule here can be unit-tested directly. See
 * tests/unit/places.test.ts.
 */

/** Google Places (New) photo resource name, e.g. `places/ChIJ…/photos/AeJ…`. */
export const PHOTO_REF_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

/**
 * A photo reference is only ever a Google resource name — never a URL. Rejecting
 * anything else is what keeps /place-photo from becoming an open proxy.
 */
export function isValidPhotoRef(name: unknown): name is string {
  return typeof name === "string" && PHOTO_REF_RE.test(name);
}

/** Photo proxy width clamps (pixels). */
export const PHOTO_WIDTH_MIN = 200;
export const PHOTO_WIDTH_MAX = 1600;
export const PHOTO_WIDTH_DEFAULT = 800;

/** Coerce a `?w=` query value into 200–1600 (default 800). */
export function clampPhotoWidth(raw: string | number | null | undefined): number {
  const n =
    typeof raw === "number" ? raw : Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return PHOTO_WIDTH_DEFAULT;
  return Math.min(PHOTO_WIDTH_MAX, Math.max(PHOTO_WIDTH_MIN, Math.trunc(n)));
}

/** Enriched place details, as returned by the action (optional keys omitted). */
export interface GooglePlaceDetails {
  /** Valid Google photo resource names (not yet proxied into URLs). */
  photos: string[];
  phone?: string;
  hours?: string[];
  ratingCount?: number;
}

/**
 * Map a Places API (New) place payload into the subset the sheet renders.
 * Tolerant of missing/garbage fields: unknown input yields `{ photos: [] }`.
 */
export function mapGoogleDetails(json: unknown): GooglePlaceDetails {
  const out: GooglePlaceDetails = { photos: [] };
  if (!json || typeof json !== "object" || Array.isArray(json)) return out;
  const obj = json as Record<string, unknown>;

  const rawPhotos = Array.isArray(obj.photos) ? obj.photos : [];
  const refs: string[] = [];
  for (const entry of rawPhotos) {
    const name =
      entry && typeof entry === "object"
        ? (entry as { name?: unknown }).name
        : undefined;
    if (isValidPhotoRef(name) && !refs.includes(name)) refs.push(name);
  }
  out.photos = refs;

  const phone = obj.nationalPhoneNumber;
  if (typeof phone === "string" && phone.trim()) out.phone = phone.trim();

  const openingHours = obj.regularOpeningHours;
  if (openingHours && typeof openingHours === "object") {
    const descriptions = (openingHours as { weekdayDescriptions?: unknown })
      .weekdayDescriptions;
    if (Array.isArray(descriptions)) {
      const clean = descriptions
        .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
        .map((d) => d.trim());
      if (clean.length > 0) out.hours = clean;
    }
  }

  const ratingCount = obj.userRatingCount;
  if (typeof ratingCount === "number" && Number.isFinite(ratingCount)) {
    out.ratingCount = ratingCount;
  }

  return out;
}

/**
 * Cache-key slug: lowercase, every run of non-alphanumerics becomes "-",
 * leading/trailing dashes trimmed, capped at 60 chars.
 */
export function slugifyPlaceName(name: string, maxLen: number = 60): string {
  const slug = String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, Math.max(0, maxLen));
}

/**
 * Cache key: `g:{placeId}` for a Google-sourced place that has an id, otherwise
 * `w:{name-slug}:{lat.toFixed(1)},{lng.toFixed(1)}` (works for OSM/brave rows
 * and for Google rows missing an id).
 */
export function placeCacheKey(input: {
  source?: string | null;
  placeId?: string | null;
  name?: string | null;
  lat: number;
  lng: number;
}): string {
  const source = String(input.source ?? "").trim().toLowerCase();
  const placeId = String(input.placeId ?? "").trim();
  if (source === "google" && placeId) return `g:${placeId}`;

  const slug = slugifyPlaceName(input.name ?? "") || "place";
  return `w:${slug}:${input.lat.toFixed(1)},${input.lng.toFixed(1)}`;
}

/** How long a cached place-enrichment payload is served before refetching. */
export const PLACE_ENRICH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Photo-proxy base URL. Prefers `CONVEX_SITE_URL`; otherwise derives the site
 * host from `CONVEX_CLOUD_URL` (…convex.cloud → …convex.site). Empty when the
 * deployment exposes neither.
 */
export function deriveConvexSiteUrl(env: Record<string, string | undefined>): string {
  const site = String(env.CONVEX_SITE_URL ?? "").trim();
  if (site) return stripTrailingSlash(site);

  const cloud = String(env.CONVEX_CLOUD_URL ?? "").trim();
  if (!cloud) return "";
  return stripTrailingSlash(cloud.replace(".convex.cloud", ".convex.site"));
}

/** `${site}/place-photo?ref=…&w=800` — never contains the Google API key. */
export function buildPhotoProxyUrl(
  siteUrl: string,
  ref: string,
  w: number = PHOTO_WIDTH_DEFAULT
): string {
  const base = stripTrailingSlash(String(siteUrl ?? "").trim());
  return `${base}/place-photo?ref=${encodeURIComponent(ref)}&w=${w}`;
}

/** Upstream Places (New) photo media endpoint for a validated ref. */
export function googlePhotoMediaUrl(
  ref: string,
  maxWidthPx: number = PHOTO_WIDTH_DEFAULT
): string {
  return `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxWidthPx}`;
}
