import { describe, it, expect } from "vitest";
import { weatherInfo } from "@/lib/utils/weather";

describe("weatherInfo", () => {
  it("maps clear sky", () => {
    expect(weatherInfo(0)).toEqual({ label: "Clear sky", emoji: "☀️" });
  });

  it("maps thunderstorms", () => {
    expect(weatherInfo(95).label).toBe("Thunderstorm");
  });

  it("falls back for unknown codes", () => {
    expect(weatherInfo(1234)).toEqual({ label: "Weather", emoji: "🌡️" });
  });

  it("covers every documented WMO code", () => {
    const codes = [
      0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75,
      77, 80, 81, 82, 85, 86, 95, 96, 99,
    ];
    for (const code of codes) {
      const info = weatherInfo(code);
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.emoji.length).toBeGreaterThan(0);
    }
  });
});