import { describe, it, expect } from "vitest";
import { haversine, formatDistance } from "@/lib/utils/geo";

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
