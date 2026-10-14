import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlaceDetailsSheet } from "@/components/poi/PlaceDetailsSheet";
import type { NormalizedPOI } from "@/types";

const { getPlaceDetailsMock } = vi.hoisted(() => ({ getPlaceDetailsMock: vi.fn() }));

vi.mock("convex/react", () => ({
  useAction: () => getPlaceDetailsMock,
}));

vi.mock("@/app/providers", () => ({
  api: { actions: { getPlaceDetails: "actions:getPlaceDetails" } },
}));

vi.mock("@/lib/utils/deviceId", () => ({
  getDeviceId: () => "11111111-2222-4333-8444-555555555555",
}));

type Details = { photos: string[]; phone?: string; hours?: string[] };

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function place(overrides: Partial<NormalizedPOI> = {}): NormalizedPOI {
  return {
    id: "id-1",
    placeId: "osm:1",
    source: "osm",
    name: "Clicks",
    category: "pharmacy",
    lat: -25.8,
    lng: 28.1,
    verifiedCount: 0,
    ...overrides,
  };
}

const googleCafe = place({
  source: "google",
  placeId: "ChIJcafe",
  name: "Corner Cafe",
  category: "restaurant",
});

const googleBistro = place({
  source: "google",
  placeId: "ChIJbistro",
  name: "Bistro Nine",
  category: "restaurant",
});

function renderSheet(current: NormalizedPOI | null) {
  const handlers = { onClose: vi.fn(), onRequestRide: vi.fn(), onShowOnMap: vi.fn() };
  const utils = render(<PlaceDetailsSheet poi={current} {...handlers} />);
  return { ...utils, handlers };
}

beforeEach(() => {
  getPlaceDetailsMock.mockReset();
  getPlaceDetailsMock.mockResolvedValue({ photos: [] } satisfies Details);
});

describe("PlaceDetailsSheet enrichment", () => {
  it("shows the hours that come back for a Google place", async () => {
    getPlaceDetailsMock.mockResolvedValueOnce({
      photos: [],
      hours: ["Mon: 08:00–17:00"],
    } satisfies Details);
    renderSheet(googleCafe);
    expect(await screen.findByText("Mon: 08:00–17:00")).toBeInTheDocument();
  });

  it("never shows the previous place's hours after another place is selected", async () => {
    getPlaceDetailsMock.mockResolvedValueOnce({
      photos: [],
      hours: ["Mon: 08:00–17:00"],
    } satisfies Details);
    const { rerender, handlers } = renderSheet(googleCafe);
    expect(await screen.findByText("Mon: 08:00–17:00")).toBeInTheDocument();

    const pending = deferred<Details>();
    getPlaceDetailsMock.mockReturnValueOnce(pending.promise);
    rerender(<PlaceDetailsSheet poi={place()} {...handlers} />);

    expect(screen.queryByText("Mon: 08:00–17:00")).not.toBeInTheDocument();
    await act(async () => {
      pending.resolve({ photos: [] });
    });
    expect(screen.queryByText("Mon: 08:00–17:00")).not.toBeInTheDocument();
  });

  it("drops a late response for a place that is no longer selected", async () => {
    const first = deferred<Details>();
    const second = deferred<Details>();
    getPlaceDetailsMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { rerender, handlers } = renderSheet(googleCafe);
    rerender(<PlaceDetailsSheet poi={googleBistro} {...handlers} />);

    await act(async () => {
      second.resolve({ photos: [], hours: ["Tue: 10:00–22:00"] });
    });
    expect(await screen.findByText("Tue: 10:00–22:00")).toBeInTheDocument();

    await act(async () => {
      first.resolve({ photos: [], hours: ["Mon: 08:00–17:00"] });
    });
    expect(screen.queryByText("Mon: 08:00–17:00")).not.toBeInTheDocument();
    expect(screen.getByText("Tue: 10:00–22:00")).toBeInTheDocument();
  });

  it("asks for details for OSM places too (Wikipedia fallback while the Google key is down)", () => {
    renderSheet(place({ source: "osm", placeId: "osm:42", name: "Clicks", category: "pharmacy" }));
    expect(getPlaceDetailsMock).toHaveBeenCalledWith(
      expect.objectContaining({ placeId: "osm:42", source: "osm", name: "Clicks" })
    );
  });

  it("shows a Wikipedia photo as the fallback for a place without its own photos", async () => {
    getPlaceDetailsMock.mockResolvedValueOnce({
      photos: ["https://upload.wikimedia.org/wikipedia/en/9/9e/Clicks_Communicator.png"],
    } satisfies Details);
    renderSheet(googleCafe);
    const img = await screen.findByRole("img", { name: "Corner Cafe" });
    expect(img).toHaveAttribute("src", expect.stringContaining("wikimedia.org"));
  });

  it("shows a photo served by our Google proxy", async () => {
    const proxied = "https://example.convex.site/place-photo?ref=places%2Fabc%2Fphotos%2Fdef&w=800";
    getPlaceDetailsMock.mockResolvedValueOnce({ photos: [proxied] } satisfies Details);
    renderSheet(googleCafe);
    const img = await screen.findByRole("img", { name: "Corner Cafe" });
    expect(img).toHaveAttribute("src", proxied);
  });

  it("uses the enriched phone number when the place has none of its own", async () => {
    getPlaceDetailsMock.mockResolvedValueOnce({
      photos: [],
      phone: "+27 12 345 6789",
    } satisfies Details);
    renderSheet(googleCafe);
    const call = await screen.findByRole("link", { name: /call/i });
    expect(call).toHaveAttribute("href", "tel:+27 12 345 6789");
  });
});

describe("PlaceDetailsSheet content", () => {
  it("shows readable category and source labels instead of raw keys", () => {
    renderSheet(place({ source: "osm", name: "Clicks", category: "pharmacy" }));
    expect(screen.getByText("Pharmacy")).toBeInTheDocument();
    expect(screen.getByText("OpenStreetMap")).toBeInTheDocument();
    expect(screen.queryByText("osm")).not.toBeInTheDocument();
    expect(screen.queryByText("pharmacy")).not.toBeInTheDocument();
  });

  it("says so plainly when there is nothing more to show", async () => {
    renderSheet(place({ source: "osm", name: "pharmacy", category: "pharmacy" }));
    expect(await screen.findByText(/no extra details yet/i)).toBeInTheDocument();
  });

  it("Ride and Map still act on the selected place", () => {
    const { handlers } = renderSheet(place());
    fireEvent.click(screen.getByRole("button", { name: /ride/i }));
    expect(handlers.onRequestRide).toHaveBeenCalledWith(expect.objectContaining({ name: "Clicks" }));
    fireEvent.click(screen.getByRole("button", { name: /map/i }));
    expect(handlers.onShowOnMap).toHaveBeenCalledWith(expect.objectContaining({ name: "Clicks" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });
});
