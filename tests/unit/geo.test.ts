import { describe, it, expect } from "vitest";
import { haversine, formatDistance, getQuickPosition } from "@/lib/utils/geo";

describe("haversine", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversine(1, 1, 1, 1)).toBe(0);
  });
  it("returns approx 111km per degree of latitude", () => {
    const d = haversine(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("formatDistance", () => {
  it("formats metres < 1000 as 'm'", () => {
    expect(formatDistance(450)).toBe("450 m");
  });
  it("formats metres >= 1000 as 'km'", () => {
    expect(formatDistance(1500)).toBe("1.5 km");
  });
});

describe("getQuickPosition", () => {
  it("resolves null when geolocation is unavailable (jsdom default)", async () => {
    await expect(getQuickPosition(25)).resolves.toBeNull();
  });

  it("resolves the position when the browser provides one", async () => {
    const pos = { coords: { latitude: 1, longitude: 2 } } as unknown as GeolocationPosition;
    const stub = {
      getCurrentPosition: (ok: (p: GeolocationPosition) => void) => ok(pos),
    } as unknown as Geolocation;
    Object.defineProperty(navigator, "geolocation", { value: stub, configurable: true });
    try {
      await expect(getQuickPosition(500)).resolves.toBe(pos);
    } finally {
      Object.defineProperty(navigator, "geolocation", { value: undefined, configurable: true });
    }
  });

  it("resolves null when the user denies or errors", async () => {
    const stub = {
      getCurrentPosition: (_ok: unknown, err: (e: unknown) => void) => err(new Error("denied")),
    } as unknown as Geolocation;
    Object.defineProperty(navigator, "geolocation", { value: stub, configurable: true });
    try {
      await expect(getQuickPosition(500)).resolves.toBeNull();
    } finally {
      Object.defineProperty(navigator, "geolocation", { value: undefined, configurable: true });
    }
  });
});