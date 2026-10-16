import { afterEach, describe, expect, it, vi } from "vitest";

import * as dishHelpers from "../../convex/dishHelpers";
import {
  buildPhotoProxyUrl,
  buildStreetViewProxyUrl,
  clampPhotoWidth,
  deriveConvexSiteUrl,
  googlePhotoMediaUrl,
  isValidLatLng,
  isValidPhotoRef,
  mapGoogleDetails,
  osmPhotoUrl,
  PHOTO_REF_RE,
  PHOTO_WIDTH_DEFAULT,
  PHOTO_WIDTH_MAX,
  PHOTO_WIDTH_MIN,
  PLACE_ENRICH_TTL_MS,
  placeCacheKey,
  slugifyPlaceName,
  streetViewImageUrl,
  streetViewMetadataUrl,
} from "../../convex/placeHelpers";
import {
  geosearchEntries,
  isRelevantArticle,
  searchResultTitles,
  summaryMeta,
  summaryThumbnail,
  titleCoreMatches,
  wikiGeosearchUrl,
  wikipediaImages,
  wikipediaPlaceImages,
  wikipediaPlacePhotosAt,
  wikipediaThumbnail,
  wikiSearchUrl,
  wikiSummaryUrl,
} from "../../convex/wikiHelpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PHOTO_REF_RE / isValidPhotoRef", () => {
  it("accepts real Google Places photo resource names", () => {
    const valid = [
      "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/AeJbb3c9n0hYlFvGxWqZ1mNqP0xHhQkLzYvT2sB4uD8",
      "places/abc123_-/photos/XYZ_-09",
    ];
    for (const ref of valid) {
      expect(PHOTO_REF_RE.test(ref)).toBe(true);
      expect(isValidPhotoRef(ref)).toBe(true);
    }
  });

  it("rejects anything that is not exactly places/{id}/photos/{id}", () => {
    const invalid = [
      "",
      "places/",
      "places/abc",
      "places/abc/photos",
      "places/abc/photos/",
      "photos/abc/photos/def",
      "places/abc/photos/def/extra",
      "places/abc/photos/def?key=leak",
      "places/abc/photos/def%2Fg",
      "places/ab c/photos/def",
      "places/abc/photos/de.f",
      "https://places.googleapis.com/v1/places/abc/photos/def/media",
      "../places/abc/photos/def",
      "places/abc/photos/def\n",
    ];
    for (const ref of invalid) {
      expect(PHOTO_REF_RE.test(ref), ref).toBe(false);
      expect(isValidPhotoRef(ref), ref).toBe(false);
    }
  });

  it("rejects non-string shapes", () => {
    for (const ref of [undefined, null, 42, {}, [], true]) {
      expect(isValidPhotoRef(ref)).toBe(false);
    }
  });
});

describe("mapGoogleDetails", () => {
  it("maps a full Places (New) payload", () => {
    const json = {
      photos: [
        { name: "places/ChIJ-x/photos/Aa_-1" },
        { name: "places/ChIJ-x/photos/Bb_-2" },
      ],
      nationalPhoneNumber: "  +27 12 345 6789 ",
      regularOpeningHours: {
        weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM", "Tuesday: Closed"],
      },
      userRatingCount: 1287,
    };
    expect(mapGoogleDetails(json)).toEqual({
      photos: ["places/ChIJ-x/photos/Aa_-1", "places/ChIJ-x/photos/Bb_-2"],
      phone: "+27 12 345 6789",
      hours: ["Monday: 9:00 AM – 5:00 PM", "Tuesday: Closed"],
      ratingCount: 1287,
    });
  });

  it("filters invalid photo refs and de-duplicates", () => {
    const json = {
      photos: [
        { name: "places/ok/photos/one" },
        { name: "https://evil.example/steal?key=x" },
        { name: "places/ok/photos/one" },
        { name: "" },
        {},
        null,
        "places/ok/photos/two",
      ],
    };
    expect(mapGoogleDetails(json)).toEqual({
      photos: ["places/ok/photos/one"],
    });
  });

  it("omits photos/hours when absent or unusable", () => {
    expect(mapGoogleDetails({})).toEqual({ photos: [] });
    expect(mapGoogleDetails({ photos: [] })).toEqual({ photos: [] });
    expect(mapGoogleDetails({ regularOpeningHours: {} })).toEqual({ photos: [] });
    expect(
      mapGoogleDetails({
        photos: [],
        regularOpeningHours: { weekdayDescriptions: [] },
      })
    ).toEqual({ photos: [] });
  });

  it("ignores garbage fields instead of throwing", () => {
    expect(
      mapGoogleDetails({
        photos: "not-an-array",
        nationalPhoneNumber: 42,
        regularOpeningHours: "open",
        userRatingCount: "many",
      })
    ).toEqual({ photos: [] });
    expect(mapGoogleDetails(null)).toEqual({ photos: [] });
    expect(mapGoogleDetails(undefined)).toEqual({ photos: [] });
    expect(mapGoogleDetails("nope")).toEqual({ photos: [] });
    expect(mapGoogleDetails([{ name: 1 }])).toEqual({ photos: [] });
  });

  it("drops blank phone/hours strings and non-finite rating counts", () => {
    expect(
      mapGoogleDetails({
        nationalPhoneNumber: "   ",
        regularOpeningHours: { weekdayDescriptions: [" ", "", 7] },
        userRatingCount: Number.NaN,
      })
    ).toEqual({ photos: [] });
    expect(mapGoogleDetails({ userRatingCount: Infinity })).toEqual({ photos: [] });
  });
});

describe("clampPhotoWidth", () => {
  it("defaults to 800 for missing/garbage input", () => {
    expect(clampPhotoWidth(null)).toBe(PHOTO_WIDTH_DEFAULT);
    expect(clampPhotoWidth(undefined)).toBe(PHOTO_WIDTH_DEFAULT);
    expect(clampPhotoWidth("")).toBe(PHOTO_WIDTH_DEFAULT);
    expect(clampPhotoWidth("abc")).toBe(PHOTO_WIDTH_DEFAULT);
    expect(clampPhotoWidth(Number.NaN)).toBe(PHOTO_WIDTH_DEFAULT);
  });

  it("clamps to the 200–1600 range", () => {
    expect(clampPhotoWidth("200")).toBe(PHOTO_WIDTH_MIN);
    expect(clampPhotoWidth(1)).toBe(PHOTO_WIDTH_MIN);
    expect(clampPhotoWidth("400")).toBe(400);
    expect(clampPhotoWidth(1600)).toBe(PHOTO_WIDTH_MAX);
    expect(clampPhotoWidth("99999")).toBe(PHOTO_WIDTH_MAX);
  });
});

describe("placeCacheKey / slugifyPlaceName", () => {
  it("uses g:{placeId} for Google-sourced rows with an id", () => {
    expect(
      placeCacheKey({
        source: "google",
        placeId: "ChIJN1t_tDeu",
        name: "Anything",
        lat: -25.74,
        lng: 28.18,
      })
    ).toBe("g:ChIJN1t_tDeu");
    expect(
      placeCacheKey({
        source: "Google",
        placeId: " ChIJN1t_tDeu ",
        name: "Anything",
        lat: 0,
        lng: 0,
      })
    ).toBe("g:ChIJN1t_tDeu");
  });

  it("uses p:{source}:{placeId} for non-Google rows with an id", () => {
    expect(
      placeCacheKey({
        source: "osm",
        placeId: "osm-node-12345",
        name: "Same Name",
        lat: -25.74,
        lng: 28.18,
      })
    ).toBe("p:osm:osm-node-12345");
  });

  it("falls back to w2:{slug}:{lat},{lng} at 0.1° resolution when placeId is empty", () => {
    expect(
      placeCacheKey({
        source: "osm",
        placeId: "",
        name: "The Blue Crane Café & Deli!",
        lat: -25.7463,
        lng: 28.1884,
      })
    ).toBe("w2:the-blue-crane-caf-deli:-25.7,28.2");
    expect(
      placeCacheKey({ source: "google", placeId: "", name: "X", lat: 1.04, lng: -0.96 })
    ).toBe("w2:x:1.0,-1.0");
  });

  it("slugifies: lowercase, runs of non-alphanumerics → '-', trimmed, 60 max", () => {
    expect(slugifyPlaceName("  Café König -- 2  ")).toBe("caf-k-nig-2");
    expect(slugifyPlaceName("###")).toBe("");
    const long = slugifyPlaceName("a".repeat(80));
    expect(long).toHaveLength(60);
  });

  it("uses 'place' when the name slug is empty", () => {
    expect(placeCacheKey({ source: null, placeId: null, name: "!!!", lat: 2, lng: 3 })).toBe(
      "w2:place:2.0,3.0"
    );
  });
});

describe("deriveConvexSiteUrl / buildPhotoProxyUrl / googlePhotoMediaUrl", () => {
  it("prefers CONVEX_SITE_URL, trimming trailing slashes", () => {
    expect(
      deriveConvexSiteUrl({
        CONVEX_SITE_URL: "https://rare-alpaca-711.convex.site/",
        CONVEX_CLOUD_URL: "https://rare-alpaca-711.convex.cloud",
      })
    ).toBe("https://rare-alpaca-711.convex.site");
  });

  it("derives .convex.site from CONVEX_CLOUD_URL when the site URL is absent", () => {
    expect(
      deriveConvexSiteUrl({ CONVEX_CLOUD_URL: "https://rare-alpaca-711.convex.cloud" })
    ).toBe("https://rare-alpaca-711.convex.site");
    expect(deriveConvexSiteUrl({})).toBe("");
    expect(deriveConvexSiteUrl({ CONVEX_CLOUD_URL: "  " })).toBe("");
  });

  it("builds an encoded proxy URL that never carries the API key", () => {
    const url = buildPhotoProxyUrl(
      "https://rare-alpaca-711.convex.site",
      "places/ab.photos/x y"
    );
    expect(url).toBe(
      "https://rare-alpaca-711.convex.site/place-photo?ref=places%2Fab.photos%2Fx%20y&w=800"
    );
    expect(url).not.toMatch(/key|api[_-]?key/i);
  });

  it("builds the upstream media endpoint with maxWidthPx", () => {
    expect(googlePhotoMediaUrl("places/a/photos/b", 400)).toBe(
      "https://places.googleapis.com/v1/places/a/photos/b/media?maxWidthPx=400"
    );
    expect(googlePhotoMediaUrl("places/a/photos/b")).toContain("maxWidthPx=800");
  });

  it("exposes a 30-day TTL", () => {
    expect(PLACE_ENRICH_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe("wiki helpers (shared with the dishes flow)", () => {
  it("summaryThumbnail reads the REST summary thumbnail, null otherwise", () => {
    expect(summaryThumbnail({ thumbnail: { source: "https://upload.wikimedia.org/x.jpg" } })).toBe(
      "https://upload.wikimedia.org/x.jpg"
    );
    expect(summaryThumbnail({ thumbnail: {} })).toBeNull();
    expect(summaryThumbnail({})).toBeNull();
    expect(summaryThumbnail(null)).toBeNull();
    expect(summaryThumbnail("nope")).toBeNull();
  });

  it("searchResultTitles reads and caps action=query search results", () => {
    const payload = {
      query: { search: [{ title: "Pretoria" }, { title: "Tshwane" }, { title: 7 }] },
    };
    expect(searchResultTitles(payload)).toEqual(["Pretoria"]);
    expect(searchResultTitles(payload, 2)).toEqual(["Pretoria", "Tshwane"]);
    expect(searchResultTitles({ query: {} })).toEqual([]);
    expect(searchResultTitles({})).toEqual([]);
    expect(searchResultTitles(null)).toEqual([]);
  });

  it("builds stable summary/search URLs (spaces → underscores, encoded)", () => {
    expect(wikiSummaryUrl("Union Buildings")).toBe(
      "https://en.wikipedia.org/api/rest_v1/page/summary/Union_Buildings"
    );
    expect(wikiSummaryUrl("Café & Bar")).toContain("Caf%C3%A9_%26_Bar");
    expect(wikiSearchUrl("bobotie", 2)).toBe(
      "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=bobotie&format=json&srlimit=2"
    );
  });

  it("wikipediaImages returns up to 2 thumbnails: direct summary then search hits", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("/summary/Union_Buildings")) {
        return {
          ok: true,
          json: async () => ({ thumbnail: { source: "https://img.example/union.jpg" } }),
        };
      }
      if (href.includes("list=search")) {
        return {
          ok: true,
          json: async () => ({ query: { search: [{ title: "Tshwane" }, { title: "Gauteng" }] } }),
        };
      }
      if (href.includes("/summary/Tshwane")) {
        return {
          ok: true,
          json: async () => ({ thumbnail: { source: "https://img.example/tshwane.jpg" } }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(await wikipediaImages("Union Buildings", 2)).toEqual([
      "https://img.example/union.jpg",
      "https://img.example/tshwane.jpg",
    ]);
    // Never asks for more than `max` results, and copes with no usable data.
    expect(await wikipediaImages("", 2)).toEqual([]);
  });

  it("wikipediaImages degrades to [] when every request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );
    expect(await wikipediaImages("Nowhere At All", 2)).toEqual([]);
    expect(await wikipediaThumbnail("Nowhere At All")).toBeNull();
  });

  it("is re-exported from dishHelpers so the dishes flow shares one implementation", () => {
    expect(dishHelpers.wikipediaThumbnail).toBe(wikipediaThumbnail);
    expect(dishHelpers.wikipediaImages).toBe(wikipediaImages);
    expect(dishHelpers.summaryThumbnail).toBe(summaryThumbnail);
    expect(dishHelpers.searchResultTitles).toBe(searchResultTitles);
  });

  it("summaryMeta parses title/description/extract/thumbnail", () => {
    expect(
      summaryMeta({
        title: "Clicks (South Africa)",
        description: "South African health and beauty retailer",
        extract: "Clicks is a South African healthcare, personal care, and beauty retail chain.",
        thumbnail: { source: "https://thumb.wikimedia.org/store.jpg" },
      })
    ).toEqual({
      title: "Clicks (South Africa)",
      description: "South African health and beauty retailer",
      extract: "Clicks is a South African healthcare, personal care, and beauty retail chain.",
      thumbnail: "https://thumb.wikimedia.org/store.jpg",
    });
    expect(summaryMeta(null)).toEqual({
      title: "",
      description: "",
      extract: "",
      thumbnail: null,
    });
  });

  it("isRelevantArticle accepts a real place article (the Clicks retailer)", () => {
    expect(
      isRelevantArticle(
        {
          title: "Clicks (South Africa)",
          description: "South African health and beauty retailer",
          extract:
            "Clicks is a South African healthcare, personal care, and beauty retail chain. Headquartered in Cape Town…",
          thumbnail: "https://thumb.wikimedia.org/store.jpg",
        },
        "Clicks"
      )
    ).toBe(true);
  });

  it("isRelevantArticle rejects the Clicks Communicator phone — the reported bug", () => {
    expect(
      isRelevantArticle(
        {
          title: "Clicks Communicator",
          description: "2026 upcoming Android smartphone",
          extract:
            "The Clicks Communicator is an upcoming compact Android smartphone developed by Clicks Technology…",
          thumbnail: "https://upload.wikimedia.org/en/9/9e/Clicks_Communicator.png",
        },
        "Clicks"
      )
    ).toBe(false);
  });

  it("isRelevantArticle rejects the Respighi opera — the La Fiamma leak", () => {
    expect(
      isRelevantArticle(
        {
          title: "La fiamma",
          description: "Opera by Ottorino Respighi",
          extract:
            "La fiamma is an opera in three acts by Ottorino Respighi to a libretto by Claudio Guastalla…",
          thumbnail: "https://thumb.wikimedia.org/Respighi_1934.jpg",
        },
        "La Fiamma"
      )
    ).toBe(false);
  });

  it("isRelevantArticle rejects people articles whose description is a profession", () => {
    expect(
      isRelevantArticle(
        { title: "Fabio Trabocchi", description: "Italian chef", extract: "…", thumbnail: "https://img/x.jpg" },
        "La Fiamma"
      )
    ).toBe(false);
  });

  it("isRelevantArticle does not false-reject a place article that merely mentions a blacklisted word", () => {
    // The extract mentions "film" (a movie was shot there) — the label is clean.
    expect(
      isRelevantArticle(
        {
          title: "KFC (South Africa)",
          description: "fast food restaurant chain",
          extract: "Several film crews have visited this KFC over the years…",
          thumbnail: "https://img/kfc.jpg",
        },
        "KFC"
      )
    ).toBe(true);
  });

  it("isRelevantArticle rejects disambiguation pages, unrelated titles and missing thumbnails", () => {
    expect(
      isRelevantArticle(
        {
          title: "Click",
          description: "Topics referred to by the same term",
          extract: "Click or Klick may refer to:",
          thumbnail: "https://img.example/x.jpg",
        },
        "Clicks"
      )
    ).toBe(false);
    expect(
      isRelevantArticle(
        {
          title: "Alveolar click",
          description: "type of click consonant",
          extract: "…",
          thumbnail: "https://img.example/y.jpg",
        },
        "Clicks"
      )
    ).toBe(false);
    expect(
      isRelevantArticle(
        {
          title: "Something Else",
          description: "a place",
          extract: "…",
          thumbnail: "https://img.example/z.jpg",
        },
        "Clicks"
      )
    ).toBe(false);
    expect(
      isRelevantArticle(
        { title: "Clicks", description: "retailer", extract: "…", thumbnail: null },
        "Clicks"
      )
    ).toBe(false);
  });

  it("wikipediaPlaceImages prefers the category-aware hit over the name-only hit", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      // The two article summaries first — "/summary/Clicks" is a substring of
      // "/summary/Clicks_(South_Africa)", so the specific URLs must match
      // before the bare one. (Note: encodeURIComponent leaves parentheses
      // unescaped, so the URL carries literal parens.)
      if (href.includes("/summary/Clicks_(South_Africa)")) {
        return {
          ok: true,
          json: async () => ({
            title: "Clicks (South Africa)",
            description: "South African health and beauty retailer",
            extract: "Clicks is a South African healthcare retail chain.",
            thumbnail: { source: "https://thumb.wikimedia.org/store.jpg" },
          }),
        };
      }
      if (href.includes("/summary/Clicks_Communicator")) {
        return {
          ok: true,
          json: async () => ({
            title: "Clicks Communicator",
            description: "2026 upcoming Android smartphone",
            extract: "The Clicks Communicator is an upcoming compact Android smartphone…",
            thumbnail: { source: "https://upload.wikimedia.org/phone.png" },
          }),
        };
      }
      // Direct summary for the bare "Clicks" → disambiguation page, no thumbnail.
      if (href.endsWith("/summary/Clicks")) {
        return {
          ok: true,
          json: async () => ({
            title: "Click",
            description: "Topics referred to by the same term",
            extract: "Click or Klick may refer to:",
          }),
        };
      }
      // Category-aware search → the retailer first, the phone second.
      if (href.includes("srsearch=Clicks%20pharmacy")) {
        return {
          ok: true,
          json: async () => ({
            query: { search: [{ title: "Clicks (South Africa)" }, { title: "Clicks Communicator" }] },
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(await wikipediaPlaceImages("Clicks", "pharmacy", 2)).toEqual([
      "https://thumb.wikimedia.org/store.jpg",
    ]);
    // The category-aware search was actually used…
    expect(
      fetchMock.mock.calls.some((c) => String(c[0]).includes("srsearch=Clicks%20pharmacy"))
    ).toBe(true);
    // …and the phone article was consulted yet still gated out.
    expect(
      fetchMock.mock.calls.some((c) => String(c[0]).includes("/summary/Clicks_Communicator"))
    ).toBe(true);
  });

  it("wikipediaPlaceImages returns [] when every candidate is gated out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const href = String(url);
        if (href.includes("/summary/Clicks")) {
          return {
            ok: true,
            json: async () => ({
              title: "Click",
              description: "Topics referred to by the same term",
              extract: "may refer to",
            }),
          };
        }
        if (href.includes("list=search")) {
          return {
            ok: true,
            json: async () => ({ query: { search: [{ title: "Clicks Communicator" }] } }),
          };
        }
        if (href.includes("/summary/Clicks_Communicator")) {
          return {
            ok: true,
            json: async () => ({
              title: "Clicks Communicator",
              description: "2026 upcoming Android smartphone",
              extract: "smartphone…",
              thumbnail: { source: "https://upload.wikimedia.org/phone.png" },
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      })
    );
    expect(await wikipediaPlaceImages("Clicks", "pharmacy", 2)).toEqual([]);
  });

  it("geosearchEntries parses titles and distances", () => {
    expect(
      geosearchEntries({
        query: {
          geosearch: [
            { title: "Old Arts Building (University of Pretoria)", dist: 704.2 },
            { title: "Embassy of Indonesia, Pretoria", dist: 238.1 },
          ],
        },
      })
    ).toEqual([
      { title: "Old Arts Building (University of Pretoria)", dist: 704.2 },
      { title: "Embassy of Indonesia, Pretoria", dist: 238.1 },
    ]);
    expect(geosearchEntries({})).toEqual([]);
    expect(geosearchEntries(null)).toEqual([]);
  });

  it("titleCoreMatches relates article titles to place names", () => {
    expect(titleCoreMatches("Old Arts Building (University of Pretoria)", "old arts")).toBe(true);
    expect(titleCoreMatches("KFC", "KFC")).toBe(true);
    expect(titleCoreMatches("Embassy of Indonesia, Pretoria", "old arts")).toBe(false);
  });

  it("wikipediaPlacePhotosAt anchors photos to the place's coordinates", async () => {
    // The real 2026-10-14 Pretoria case: an OSM row named "old arts" whose
    // matching article stands 704 m away.
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("list=geosearch")) {
        return {
          ok: true,
          json: async () => ({
            query: {
              geosearch: [
                { title: "Embassy of Indonesia, Pretoria", dist: 238 },
                { title: "Old Arts Building (University of Pretoria)", dist: 704 },
              ],
            },
          }),
        };
      }
      if (href.includes("/summary/Old_Arts_Building")) {
        return {
          ok: true,
          json: async () => ({
            title: "Old Arts Building (University of Pretoria)",
            description: "Historic building of the University of Pretoria",
            extract: "The Old Arts Building is a historic building…",
            thumbnail: { source: "https://thumb.wikimedia.org/oldarts.jpg" },
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(await wikipediaPlacePhotosAt(-25.7479, 28.2293, "old arts", 2)).toEqual([
      "https://thumb.wikimedia.org/oldarts.jpg",
    ]);
    // The nearby-but-unrelated article was skipped without a summary fetch…
    expect(
      fetchMock.mock.calls.some((c) => String(c[0]).includes("/summary/Embassy_of_Indonesia"))
    ).toBe(false);
    // …and the coordinate anchor is what the geosearch URL carries.
    expect(
      fetchMock.mock.calls.some((c) => String(c[0]).includes("gscoord=-25.7479%7C28.2293"))
    ).toBe(true);
  });

  it("wikipediaPlacePhotosAt returns [] for a place with no nearby matching article", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("list=geosearch")) {
        return {
          ok: true,
          json: async () => ({
            query: { geosearch: [{ title: "Embassy of Indonesia, Pretoria", dist: 238 }] },
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);

    // "KFC" is nearby only as a name match elsewhere — nothing at these
    // coordinates relates to it, so no photo (never a wrong one).
    expect(await wikipediaPlacePhotosAt(-25.7479, 28.2293, "KFC", 2)).toEqual([]);
  });

  it("wikiGeosearchUrl carries the coordinates and a bounded radius", () => {
    const url = wikiGeosearchUrl(-25.7479, 28.2293, 5);
    expect(url).toContain("list=geosearch");
    expect(url).toContain("gscoord=-25.7479%7C28.2293");
    expect(url).toContain("gslimit=5");
  });

  it("wikipediaPlaceImages keeps the KFC-style direct hit and guards empty input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const href = String(url);
        if (href.includes("/summary/KFC")) {
          return {
            ok: true,
            json: async () => ({
              title: "KFC",
              description: "American fast food restaurant chain",
              extract: "KFC is an American fast food restaurant chain…",
              thumbnail: { source: "https://thumb.wikimedia.org/kfc.jpg" },
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      })
    );
    expect(await wikipediaPlaceImages("KFC", "restaurant", 2)).toEqual([
      "https://thumb.wikimedia.org/kfc.jpg",
    ]);
    expect(await wikipediaPlaceImages("", "pharmacy", 2)).toEqual([]);
    expect(await wikipediaPlaceImages("Clicks", "pharmacy", 0)).toEqual([]);
  });
});

describe("street view helpers", () => {
  it("isValidLatLng accepts real coordinates and rejects junk", () => {
    expect(isValidLatLng(-25.7479, 28.2293)).toBe(true);
    expect(isValidLatLng(0, 0)).toBe(true);
    expect(isValidLatLng(NaN, 28)).toBe(false);
    expect(isValidLatLng(-25, "abc")).toBe(false);
    expect(isValidLatLng(91, 28)).toBe(false);
    expect(isValidLatLng(-25, 181)).toBe(false);
  });

  it("buildStreetViewProxyUrl points at the site proxy and never carries the key", () => {
    const url = buildStreetViewProxyUrl("https://x.convex.site/", -25.7479, 28.2293);
    expect(url).toBe("https://x.convex.site/streetview?lat=-25.7479&lng=28.2293");
    expect(url).not.toContain("key");
    expect(url).not.toContain("AIza");
  });

  it("street view URL builders target Google with the encoded key", () => {
    expect(streetViewMetadataUrl(-25.7, 28.2, "AIzaKey")).toBe(
      "https://maps.googleapis.com/maps/api/streetview/metadata?location=-25.7,28.2&key=AIzaKey"
    );
    const img = streetViewImageUrl(-25.7, 28.2, "AIza Key");
    expect(img).toContain("size=800x500");
    expect(img).toContain("location=-25.7,28.2");
    expect(img).toContain("key=AIza%20Key");
  });
});

describe("osmPhotoUrl", () => {
  it("returns direct image URL when present", () => {
    expect(osmPhotoUrl({ image: "https://example.com/photo.jpg" })).toBe(
      "https://example.com/photo.jpg"
    );
  });

  it("resolves Wikimedia Commons file name to Special:FilePath URL", () => {
    expect(osmPhotoUrl({ wikimedia_commons: "File:Old Arts Building Pretoria.jpg" })).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Old_Arts_Building_Pretoria.jpg?width=800"
    );
  });

  it("handles wikimedia:commons alias key and File: wiki URLs, and rejects Category: links", () => {
    expect(osmPhotoUrl({ "wikimedia:commons": "Union_Buildings.jpg" })).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Union_Buildings.jpg?width=800"
    );
    expect(
      osmPhotoUrl({ image: "https://commons.wikimedia.org/wiki/File:Voortrekker_Monument.jpg" })
    ).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Voortrekker_Monument.jpg?width=800"
    );
    expect(osmPhotoUrl({ wikimedia_commons: "Category:Union Buildings" })).toBeUndefined();
    expect(
      osmPhotoUrl({ wikimedia_commons: "https://commons.wikimedia.org/wiki/Category:Pretoria" })
    ).toBeUndefined();
  });

  it("supports custom language codes in wikiSummaryUrl", () => {
    expect(wikiSummaryUrl("Uniegebou", "af")).toBe(
      "https://af.wikipedia.org/api/rest_v1/page/summary/Uniegebou"
    );
  });

  it("returns undefined when no valid image tag exists", () => {
    expect(osmPhotoUrl(undefined)).toBeUndefined();
    expect(osmPhotoUrl({})).toBeUndefined();
    expect(osmPhotoUrl({ image: "ftp://example.com" })).toBeUndefined();
  });
});
