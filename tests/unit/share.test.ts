import { describe, expect, it } from "vitest";

import {
  buildGeoJson,
  buildGpx,
  buildShareSummary,
} from "@/lib/journal/share";

const points = [
  { lat: 48.8566, lng: 2.3522, timestamp: 1700000000000 },
  { lat: 48.8606, lng: 2.3376, timestamp: 1700000600000 },
];

describe("buildGpx", () => {
  it("emits a trkpt per point with lat/lon and ISO time", () => {
    const gpx = buildGpx(points, []);
    expect(gpx).toContain('<trkpt lat="48.8566" lon="2.3522">');
    expect(gpx).toContain("<trkseg>");
    expect(gpx).toContain(new Date(1700000000000).toISOString());
    expect(gpx.startsWith('<?xml version="1.0"')).toBe(true);
  });

  it("escapes XML in note text and skips notes without coords", () => {
    const gpx = buildGpx(points, [
      { text: "Rue <b>de</b> l'Église & \"Café\"", lat: 1, lng: 2, createdAt: 1700000000000 },
      { text: "no location note", createdAt: 1700000000000 },
    ]);
    expect(gpx).toContain("Rue &lt;b&gt;de&lt;/b&gt;");
    expect(gpx).toContain("&amp;");
    expect(gpx).not.toContain("no location note");
  });
});

describe("buildGeoJson", () => {
  it("produces a LineString feature with [lng, lat] order", () => {
    const parsed = JSON.parse(buildGeoJson(points));
    expect(parsed.type).toBe("FeatureCollection");
    expect(parsed.features).toHaveLength(1);
    expect(parsed.features[0].geometry.type).toBe("LineString");
    expect(parsed.features[0].geometry.coordinates[0]).toEqual([2.3522, 48.8566]);
  });
});

describe("buildShareSummary", () => {
  it("includes pin count and formatted distance", () => {
    const text = buildShareSummary(points, 1500, () => "1.5 km");
    expect(text).toContain("2 pins");
    expect(text).toContain("1.5 km");
  });
});
