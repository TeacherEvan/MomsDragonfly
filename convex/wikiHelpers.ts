/**
 * Keyless Wikipedia helpers shared by the dishes flow (getLocalDishes, via
 * dishHelpers re-export) and the place-details fallback (getPlaceDetails).
 *
 * Extracted from the inline `wikipediaThumbnail` that used to live in
 * convex/actions.ts so both flows use one search+thumbnail implementation.
 * No Convex imports: the parsing helpers are unit-tested directly and the
 * fetch wrappers are testable with a stubbed global fetch.
 */

import { fetchJson } from "./fetchWithTimeout";

const WIKI_TIMEOUT_MS = 8_000;
const WIKI_HEADERS = { "User-Agent": "MomsDragonfly/1.0 (travel companion PWA)" };

/** Neutral fetch: returns parsed JSON or null (never throws). */
async function fetchWikiJson(url: string): Promise<unknown> {
  return fetchJson<unknown>(url, WIKI_HEADERS, WIKI_TIMEOUT_MS);
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

/**
 * "X by Y" — a creative work described as created by someone ("Opera by
 * Ottorino Respighi", "song by Adele", "painting by Monet"). Never a
 * picture of a place.
 */
const CREATIVE_BY_RE =
  /\b(song|songs|album|single|film|movie|opera|operetta|musical|ballet|symphony|concerto|sonata|oratorio|cantata|novel|novella|poem|play|painting|sculpture|work|composition|piece)\s+by\b/i;

/**
 * Articles that can never be a picture of the place itself — people,
 * creative works, products, events, concepts. Checked against the article's
 * title + description (the short type label: "Italian actor", "Opera by
 * Ottorino Respighi", "2026 upcoming Android smartphone"), NOT the prose
 * extract, so a place article that merely mentions one of these words is not
 * falsely rejected. Verified live 2026-10-14: "La fiamma" (an opera) slipped
 * through the previous extract-scoped list with a portrait of the composer.
 */
const NOT_A_PLACE_RE =
  /\b(actor|actress|director|producer|screenwriter|playwright|composer|conductor|musician|singer|songwriter|rapper|painter|sculptor|architect|photographer|designer|artist|author|writer|novelist|poet|journalist|editor|chef|restaurateur|businessman|businesswoman|entrepreneur|executive|scientist|inventor|mathematician|philosopher|historian|economist|politician|president|prime minister|king|queen|emperor|empress|pope|saint|archangel|cardinal|bishop|monk|nun|criminal|murderer|gangster|pirate|spy|general|soldier|footballer|cricketer|athlete|boxer|wrestler|cyclist|swimmer|golfer|dancer|lawyer|judge|physician|surgeon|nurse|teacher|professor|engineer|pilot|astronaut|youtuber|influencer|streamer|blogger|television presenter|news presenter|broadcaster|model|socialite|aristocrat|explorer|outlaw|opera|operetta|ballet|symphony|concerto|sonata|oratorio|cantata|song|album|film|movie|documentary|television series|tv series|miniseries|sitcom|web series|anime|manga|comic|graphic novel|novel|novella|short story|poem|play|video game|board game|card game|toy|software|operating system|web browser|website|mobile app|smartphone|mobile phone|feature phone|tablet|laptop|notebook|smartwatch|e-reader|robot|drone|automobile|motorcycle|aircraft|warship|submarine|spacecraft|rocket|locomotive|radio station|television channel|television network|newspaper|magazine|record label|fictional character|superhero|supervillain|deity|god|goddess|mythological figure|fairy tale|urban legend|conspiracy theory|virus|disease|drug|medication|vaccine|chemical element|mineral|species|gene|protein|dish|recipe|beverage|cocktail|beer|sport|martial art|genre|art movement|fashion|hairstyle|tattoo|festival|holiday|tournament|award|concert|war|battle|treaty|election|political party|military unit|scandal|incident|disaster|crime|trial|language|dialect|acronym|slang|meme|hashtag|search engine|social network|programming language|file format|protocol|font|typeface|color|prototype|concept car)\b/i;

function normCore(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * True when an article title relates to the place name: the title contains
 * the place name (parentheses stripped — "Old Arts Building (University of
 * Pretoria)" ⊃ "old arts"), or the place name contains a substantial part of
 * the title. Used both by the relevance gate and as the cheap pre-filter in
 * the geosearch path (title check costs no fetch).
 */
export function titleCoreMatches(title: string, name: string): boolean {
  const titleCore = normCore(title.replace(/\([^)]*\)/g, ""));
  const placeCore = normCore(name);
  if (!titleCore || !placeCore) return false;
  return (
    titleCore.includes(placeCore) ||
    (placeCore.length >= 4 && placeCore.includes(titleCore) && titleCore.length >= 4)
  );
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
  // Product/media/person terms are only checked on the type label
  // (title + description) — the extract is prose and false-rejects.
  const label = `${meta.title} ${meta.description}`;
  if (CREATIVE_BY_RE.test(label)) return false;
  if (NOT_A_PLACE_RE.test(label)) return false;
  return titleCoreMatches(meta.title, name);
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

/* ────────────────────────────────────────────────────────────────────────────
 * Geosearch-anchored place images
 *
 * Name search can never be certain an article is about THIS place. Geosearch
 * returns articles whose SUBJECT is located at (or within metres of) the
 * place's coordinates, so an article that also matches the name describes
 * that exact spot — the same guarantee Street View gives, without an API key.
 * Verified live 2026-10-14: near Pretoria centre, geosearch returns "Old Arts
 * Building (University of Pretoria)" at 704 m — the building an OSM row named
 * "old arts" points at.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Articles with a subject near lat,lng (radius in metres). */
const GEOSEARCH_RADIUS_M = 1500;

export function wikiGeosearchUrl(lat: number, lng: number, limit: number = 12): string {
  return (
    "https://en.wikipedia.org/w/api.php?action=query&list=geosearch" +
    `&gscoord=${encodeURIComponent(`${lat}|${lng}`)}&gsradius=${GEOSEARCH_RADIUS_M}` +
    `&gslimit=${limit}&format=json`
  );
}

/** {title, dist} entries out of a geosearch payload. */
export function geosearchEntries(geo: unknown): Array<{ title: string; dist: number }> {
  if (!geo || typeof geo !== "object") return [];
  const query = (geo as { query?: unknown }).query;
  if (!query || typeof query !== "object") return [];
  const list = (query as { geosearch?: unknown }).geosearch;
  if (!Array.isArray(list)) return [];
  const out: Array<{ title: string; dist: number }> = [];
  for (const entry of list) {
    const title =
      entry && typeof entry === "object" ? (entry as { title?: unknown }).title : undefined;
    const dist = entry && typeof entry === "object" ? (entry as { dist?: unknown }).dist : undefined;
    if (typeof title === "string" && title.length > 0) {
      out.push({ title, dist: typeof dist === "number" ? dist : Number.POSITIVE_INFINITY });
    }
  }
  return out;
}

/**
 * Photos for a place anchored to its coordinates: geosearch articles near the
 * place whose title matches the name, still passing the relevance gates. The
 * coordinate anchor is what makes this safe — the article's subject stands at
 * the place, so a name match cannot describe a different entity. The title is
 * pre-checked before each summary fetch so unrelated nearby articles cost
 * nothing.
 */
export async function wikipediaPlacePhotosAt(
  lat: number,
  lng: number,
  name: string,
  max: number = 2
): Promise<string[]> {
  const term = String(name ?? "").trim();
  if (!term || max <= 0 || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];

  const entries = geosearchEntries(await fetchWikiJson(wikiGeosearchUrl(lat, lng, max + 8)));
  const urls: string[] = [];
  for (const entry of entries) {
    if (urls.length >= max) break;
    if (!titleCoreMatches(entry.title, term)) continue; // cheap pre-filter, no fetch
    const meta = summaryMeta(await fetchWikiJson(wikiSummaryUrl(entry.title)));
    if (meta.thumbnail && isRelevantArticle(meta, term) && !urls.includes(meta.thumbnail)) {
      urls.push(meta.thumbnail);
    }
  }
  return urls.slice(0, max);
}
