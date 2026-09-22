import { haversine } from "@/lib/utils/geo";

/** Sampling policy for automatic trip journal recording. */
export const MIN_DISTANCE_M = 150;
export const MIN_GAP_MS = 2 * 60 * 1000;
export const MAX_GAP_MS = 10 * 60 * 1000;

export interface SampledPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

/**
 * Decide whether a new fix should be recorded.
 * - First point of a session: always record.
 * - Never record within MIN_GAP_MS of the previous save (jitter guard).
 * - Record when moved >= MIN_DISTANCE_M, or when MAX_GAP_MS has elapsed
 *   (a periodic check-in keeps long stays on the timeline).
 */
export function shouldRecordPoint(
  prev: SampledPoint | null,
  next: { lat: number; lng: number; now: number }
): boolean {
  if (!prev) return true;
  const dt = next.now - prev.timestamp;
  if (dt < MIN_GAP_MS) return false;
  if (dt >= MAX_GAP_MS) return true;
  return haversine(prev.lat, prev.lng, next.lat, next.lng) >= MIN_DISTANCE_M;
}

/** Total travelled distance in metres across a series of points (chronological order). */
export function totalDistance(points: Array<{ lat: number; lng: number }>): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversine(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return sum;
}

/** Local-date key, e.g. 2026-09-22. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function groupByDay<T extends { timestamp: number }>(
  points: T[]
): Array<{ key: string; points: T[] }> {
  const map = new Map<string, T[]>();
  for (const p of points) {
    const k = dayKey(p.timestamp);
    const arr = map.get(k);
    if (arr) arr.push(p);
    else map.set(k, [p]);
  }
  return [...map.entries()].map(([key, pts]) => ({ key, points: pts }));
}

export function formatDayLabel(key: string, now: number = Date.now()): string {
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(now - 24 * 60 * 60 * 1000)) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}