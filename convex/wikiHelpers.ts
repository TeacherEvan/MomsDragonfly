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

/* ────────────────────────────────────────────────────────────────────────────
 * Place-image relevance gates
 *
 * The place sheet used to show whatever the top Wikipedia name-search hit
 * returned: "Clicks" (the pharmacy) surfaced the Clicks Communicator phone —
 * verified live 2026-10-14: summary("Clicks") is a disambiguation page, and
 * search("Clicks") ranks "Clicks Communicator" first, while search("Clicks
 * pharmacy") ranks the actual retailer "Clicks (South Africa)" first.
 *
 * A wrong picture of the wrong place is worse than no picture, so place
 * enrichment (getPlaceDetails → wikipediaPlaceImages) goes through gates:
 *   · no disambiguation pages ("…may refer to"),
 *   · no product / media / person articles (a place is not a phone or a band),
 *   · the article title must relate to the place name.
 * A category hint biases the search to the right article in the first place.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Meta parsed out of a REST summary payload (title/description/extract/thumbnail). */
export function summaryMeta(summary: unknown): {
  title: string;
  description: string;
  extract: string;
  thumbnail: string | null;
} {
  if (!summary || typeof summary !== "object") {
    return { title: "", description: "", extract: "", thumbnail: null };
  }
  const s = summary as {
    title?: unknown;
    description?: unknown;
    extract?: unknown;
    thumbnail?: unknown;
  };
  return {
    title: typeof s.title === "string" ? s.title : "",
    description: typeof s.description === "string" ? s.description : "",
    extract: typeof s.extract === "string" ? s.extract : "",
    thumbnail: summaryThumbnail(summary),
  };
}

const DISAMBIGUATION_RE = /may refer to|topics referred to by the same term/i;

/** Articles that can never be a picture of the place itself. */
const NOT_A_PLACE_RE =
  /\b(smartphone|mobile phone|feature phone|communicator|cell ?phone|telephone|laptop|notebook computer|tablet computer|handheld game console|video ?game|board game|album|song|film|movie|television series|tv series|software|operating system|web browser|microprocessor|smartwatch|e-reader|robot|aircraft|motorcycle|sports car|projectile|ammunition|warship|missile|musical group|music group|band|singer|rapper|politician|footballer|cricketer|novel|painting|sculpture)\b/i;

function normCore(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * True when the article is plausibly about the place: it has a thumbnail, it
 * is not a disambiguation page, not a product/media/person article, and its
 * title relates to the place name ("Clicks (South Africa)" ⊃ "Clicks").
 */
export function isRelevantArticle(
  meta: { title: string; description: string; extract: string; thumbnail: string | null },
  name: string
): boolean {
  if (!meta.thumbnail) return false;
  const blob = `${meta.title} ${meta.description} ${meta.extract.slice(0, 400)}`;
  if (DISAMBIGUATION_RE.test(blob)) return false;
  if (NOT_A_PLACE_RE.test(blob)) return false;
  const titleCore = normCore(meta.title.replace(/\([^)]*\)/g, ""));
  const placeCore = normCore(name);
  if (!titleCore || !placeCore) return false;
  return (
    titleCore.includes(placeCore) ||
    (placeCore.length >= 4 && placeCore.includes(titleCore) && titleCore.length >= 4)
  );
}

/**
 * Up to `max` place images, gated by `isRelevantArticle`. Search order:
 *   1) direct summary of the bare name (fast path: KFC, Union Buildings…),
 *   2) category-aware search ("Clicks pharmacy" → the retailer, not the phone),
 *   3) bare-name search — still gated (last resort).
 * Returns [] when nothing passes: an empty sheet beats a wrong picture.
 */
export async function wikipediaPlaceImages(
  name: string,
  category?: string | null,
  max: number = 2
): Promise<string[]> {
  const term = String(name ?? "").trim();
  if (!term || max <= 0) return [];

  const urls: string[] = [];
  const push = (url: string): void => {
    if (url && !urls.includes(url)) urls.push(url);
  };

  // 1) Direct summary for the bare name.
  const direct = summaryMeta(await fetchWikiJson(wikiSummaryUrl(term)));
  if (direct.thumbnail && isRelevantArticle(direct, term)) push(direct.thumbnail);

  const consider = async (title: string): Promise<void> => {
    if (urls.length >= max) return;
    const meta = summaryMeta(await fetchWikiJson(wikiSummaryUrl(title)));
    if (meta.thumbnail && isRelevantArticle(meta, term)) push(meta.thumbnail);
  };

  // 2) Category-aware search.
  const hint = String(category ?? "").trim().toLowerCase();
  if (urls.length < max && hint) {
    const titles = searchResultTitles(
      await fetchWikiJson(wikiSearchUrl(`${term} ${hint}`, max + 2)),
      max + 2
    );
    for (const title of titles) {
      if (urls.length >= max) break;
      await consider(title);
    }
  }

  // 3) Bare-name search, still gated.
  if (urls.length < max) {
    const titles = searchResultTitles(
      await fetchWikiJson(wikiSearchUrl(term, max + 2)),
      max + 2
    );
    for (const title of titles) {
      if (urls.length >= max) break;
      await consider(title);
    }
  }

  return urls.slice(0, max);
}
