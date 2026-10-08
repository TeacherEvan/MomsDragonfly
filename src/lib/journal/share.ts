/** Builders for exporting trip-journal history (GPX / GeoJSON / text). */

export interface SharePoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

export interface ShareNote {
  text: string;
  lat?: number;
  lng?: number;
  createdAt: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildGpx(points: SharePoint[], notes: ShareNote[]): string {
  const track = points
    .map(
      (p) =>
        `    <trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(
          p.timestamp
        ).toISOString()}</time></trkpt>`
    )
    .join("\n");
  const waypoints = notes
    .filter((n) => n.lat !== undefined && n.lng !== undefined)
    .map(
      (n) =>
        `  <wpt lat="${n.lat}" lon="${n.lng}"><name>${escapeXml(
          n.text.slice(0, 60)
        )}</name><time>${new Date(n.createdAt).toISOString()}</time></wpt>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Mom's Dragonfly" xmlns="http://www.topografix.com/GPX/1/1">
${waypoints}
  <trk><name>Trip Journal</name><trkseg>
${track}
  </trkseg></trk>
</gpx>
`;
}

export function buildGeoJson(points: SharePoint[]): string {
  return JSON.stringify(
    {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: points.map((p) => [p.lng, p.lat]),
          },
        },
      ],
    },
    null,
    2
  );
}

export function buildShareSummary(
  points: SharePoint[],
  metres: number,
  kmFormatter: (metres: number) => string
): string {
  return `My trip journal: ${points.length} pins, ${metres > 0 ? kmFormatter(metres) : "0 km"} recorded with Mom's Dragonfly.`;
}

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function downloadTextFile(
  filename: string,
  text: string,
  mime: string
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
