import { describe, it, expect, vi, afterEach } from "vitest";
import {
  PHOTO_REF_RE,
  PHOTO_WIDTH_DEFAULT,
  PHOTO_WIDTH_MAX,
  PHOTO_WIDTH_MIN,
  PLACE_ENRICH_TTL_MS,
  buildPhotoProxyUrl,
  clampPhotoWidth,
  deriveConvexSiteUrl,
  googlePhotoMediaUrl,
  isValidPhotoRef,
  mapGoogleDetails,
  placeCacheKey,
  slugifyPlaceName,
} from "../../convex/placeHelpers";
import {
  searchResultTitles,
  summaryThumbnail,
  wikiSearchUrl,
  wikiSummaryUrl,
  wikipediaImages,
  wikipediaThumbnail,
} from "../../convex/wikiHelpers";
import * as dishHelpers from "../../convex/dishHelpers";

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

  it("falls back to w:{slug}:{lat},{lng} at 0.1° resolution", () => {
    expect(
      placeCacheKey({
        source: "osm",
        placeId: "",
        name: "The Blue Crane Café & Deli!",
        lat: -25.7463,
        lng: 28.1884,
      })
    ).toBe("w:the-blue-crane-caf-deli:-25.7,28.2");
    expect(
      placeCacheKey({ source: "google", placeId: "", name: "X", lat: 1.04, lng: -0.96 })
    ).toBe("w:x:1.0,-1.0");
  });

  it("slugifies: lowercase, runs of non-alphanumerics → '-', trimmed, 60 max", () => {
    expect(slugifyPlaceName("  Café König -- 2  ")).toBe("caf-k-nig-2");
    expect(slugifyPlaceName("###")).toBe("");
    const long = slugifyPlaceName("a".repeat(80));
    expect(long).toHaveLength(60);
  });

  it("uses 'place' when the name slug is empty", () => {
    expect(placeCacheKey({ source: null, placeId: null, name: "!!!", lat: 2, lng: 3 })).toBe(
      "w:place:2.0,3.0"
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
});
