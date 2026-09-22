import { describe, it, expect } from "vitest";
import {
  shouldRecordPoint,
  totalDistance,
  groupByDay,
  dayKey,
  formatDayLabel,
  MIN_GAP_MS,
  MAX_GAP_MS,
} from "@/lib/journal/stats";

describe("shouldRecordPoint", () => {
  const t0 = 1_700_000_000_000;

  it("records the first point of a session", () => {
    expect(shouldRecordPoint(null, { lat: 1, lng: 1, now: t0 })).toBe(true);
  });

  it("skips points within the jitter guard window", () => {
    const prev = { lat: -25.746, lng: 28.237, timestamp: t0 };
    expect(
      shouldRecordPoint(prev, { lat: -25.75, lng: 28.24, now: t0 + MIN_GAP_MS - 1000 })
    ).toBe(false);
  });

  it("records when moved at least MIN_DISTANCE_M after the guard window", () => {
    const prev = { lat: -25.746, lng: 28.237, timestamp: t0 };
    // ~0.002 deg latitude ≈ 222 m
    expect(
      shouldRecordPoint(prev, { lat: -25.748, lng: 28.237, now: t0 + MIN_GAP_MS + 1000 })
    ).toBe(true);
  });

  it("skips small movements after the guard window", () => {
    const prev = { lat: -25.746, lng: 28.237, timestamp: t0 };
    // ~11 m
    expect(
      shouldRecordPoint(prev, { lat: -25.7461, lng: 28.237, now: t0 + MIN_GAP_MS + 1000 })
    ).toBe(false);
  });

  it("records a periodic check-in once MAX_GAP_MS has elapsed even without movement", () => {
    const prev = { lat: -25.746, lng: 28.237, timestamp: t0 };
    expect(
      shouldRecordPoint(prev, { lat: -25.746, lng: 28.237, now: t0 + MAX_GAP_MS + 1 })
    ).toBe(true);
  });
});

describe("totalDistance", () => {
  it("sums haversine segments", () => {
    const pts = [
      { lat: -25.746, lng: 28.237 },
      { lat: -25.756, lng: 28.237 }, // ~1.1 km south
    ];
    const d = totalDistance(pts);
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(1200);
  });

  it("returns 0 for fewer than two points", () => {
    expect(totalDistance([])).toBe(0);
    expect(totalDistance([{ lat: 0, lng: 0 }])).toBe(0);
  });
});

describe("groupByDay / formatDayLabel", () => {
  it("groups points by local calendar day", () => {
    const a = new Date(2026, 8, 22, 10, 0).getTime();
    const b = new Date(2026, 8, 22, 18, 30).getTime();
    const c = new Date(2026, 8, 21, 9, 0).getTime();
    const groups = groupByDay([{ timestamp: a }, { timestamp: b }, { timestamp: c }]);
    expect(groups.length).toBe(2);
    expect(groups[0].key).toBe(dayKey(a));
    expect(groups[0].points.length).toBe(2);
  });

  it("labels today and yesterday", () => {
    const now = new Date(2026, 8, 22, 12, 0).getTime();
    expect(formatDayLabel(dayKey(now), now)).toBe("Today");
    expect(formatDayLabel(dayKey(now - 24 * 60 * 60 * 1000), now)).toBe("Yesterday");
  });
});