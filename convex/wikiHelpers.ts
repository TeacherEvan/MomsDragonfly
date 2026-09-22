/**
 * Keyless Wikipedia helpers shared by the dishes flow (getLocalDishes, via
 * dishHelpers re-export) and the place-details fallback (getPlaceDetails).
 *
 * Extracted from the inline `wikipediaThumbnail` that used to live in
 * convex/actions.ts so both flows use one search+thumbnail implementation.
 * No Convex imports: the parsing helpers are unit-tested directly and the
 * fetch wrappers are testable with a stubbed global fetch.
 */

const WIKI_TIMEOUT_MS = 8_000;
const WIKI_HEADERS = { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" };

/** Neutral fetch: returns parsed JSON or null (never throws). */
async function fetchWikiJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WIKI_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: WIKI_HEADERS, signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Thumbnail source out of a REST summary payload (null when absent). */
export function summaryThumbnail(summary: unknown): string | null {
  if (!summary || typeof summary !== "object") return null;
  const thumbnail = (summary as { thumbnail?: unknown }).thumbnail;
  if (!thumbnail || typeof thumbnail !== "object") return null;
  const source = (thumbnail as { source?: unknown }).source;
  return typeof source === "string" && source.length > 0 ? source : null;
}

/** Titles out of an action=query&list=search payload (empty when unusable). */
export function searchResultTitles(search: unknown, limit: number = 1): string[] {
  if (!search || typeof search !== "object") return [];
  const query = (search as { query?: unknown }).query;
  if (!query || typeof query !== "object") return [];
  const list = (query as { search?: unknown }).search;
  if (!Array.isArray(list)) return [];

  const titles: string[] = [];
  for (const entry of list) {
    const title =
      entry && typeof entry === "object"
        ? (entry as { title?: unknown }).title
        : undefined;
    if (typeof title === "string" && title.length > 0) titles.push(title);
    if (titles.length >= limit) break;
  }
  return titles;
}

/** REST summary URL for an article title (spaces → underscores). */
export function wikiSummaryUrl(title: string): string {
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;
}

/** Full-text search URL. */
export function wikiSearchUrl(query: string, limit: number = 1): string {
  return (
    "https://en.wikipedia.org/w/api.php?action=query&list=search" +
    `&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${limit}`
  );
}

/**
 * Single thumbnail for a term: direct REST summary first, search fallback.
 * Unchanged behaviour from the original dishes lookup.
 */
export async function wikipediaThumbnail(name: string): Promise<string | null> {
  const direct = summaryThumbnail(await fetchWikiJson(wikiSummaryUrl(name)));
  if (direct) return direct;

  const titles = searchResultTitles(await fetchWikiJson(wikiSearchUrl(name, 1)), 1);
  if (titles.length === 0) return null;
  return summaryThumbnail(await fetchWikiJson(wikiSummaryUrl(titles[0])));
}

/**
 * Up to `max` thumbnails for a term (direct summary first, then the top search
 * hits) — used to give a place without Google photos something to show.
 */
export async function wikipediaImages(query: string, max: number = 2): Promise<string[]> {
  const term = String(query ?? "").trim();
  if (!term || max <= 0) return [];

  const urls: string[] = [];
  const direct = summaryThumbnail(await fetchWikiJson(wikiSummaryUrl(term)));
  if (direct) urls.push(direct);

  if (urls.length < max) {
    const titles = searchResultTitles(await fetchWikiJson(wikiSearchUrl(term, max)), max);
    for (const title of titles) {
      if (urls.length >= max) break;
      const url = summaryThumbnail(await fetchWikiJson(wikiSummaryUrl(title)));
      if (url && !urls.includes(url)) urls.push(url);
    }
  }

  return urls.slice(0, max);
}
