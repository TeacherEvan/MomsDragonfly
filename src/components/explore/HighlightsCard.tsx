"use client";
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { weatherInfo } from "@/lib/utils/weather";
import { Icon } from "@/components/ui/Icon";

interface HighlightsCardProps {
  lat: number;
  lng: number;
}

interface Weather {
  tempC: number;
  feelsC: number;
  windKmh: number;
  code: number;
  isDay: boolean;
  maxC: number | null;
  minC: number | null;
}

interface NewsItem {
  title: string;
  url: string;
  source?: string;
  age?: string;
}

interface Highlights {
  locationName: string | null;
  weather: Weather | null;
  news: NewsItem[];
  fetchedAt: number;
}

/** Location-triggered weather + news highlights (cached ~30 min per area). */
export function HighlightsCard({ lat, lng }: HighlightsCardProps) {
  const fetchHighlights = useAction(api.actions.getHighlights);
  const [data, setData] = useState<Highlights | null>(null);
  const [failed, setFailed] = useState(false);

  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    fetchHighlights({ deviceId: getDeviceId(), lat: rLat, lng: rLng })
      .then((res) => {
        if (!cancelled) setData(res as Highlights);
      })
      .catch((err) => {
        console.warn("Highlights fetch failed:", err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchHighlights, rLat, rLng]);

  if (!data && failed) return null;

  if (!data) {
    return (
      <div
        className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-4"
        role="status"
        aria-label="Loading local highlights"
      >
        <div className="h-5 w-40 animate-pulse rounded bg-dragonfly-navy-800" />
        <div className="mt-3 h-4 w-56 animate-pulse rounded bg-dragonfly-navy-800/70" />
      </div>
    );
  }

  const w = data.weather;
  const wInfo = w ? weatherInfo(w.code) : null;

  return (
    <section
      className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 backdrop-blur-sm p-4 shadow-soft"
      aria-label="Weather and news highlights"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {wInfo && (
            <span className="text-3xl" role="img" aria-label={wInfo.label}>
              {wInfo.emoji}
            </span>
          )}
          <div>
            {w ? (
              <>
                <p className="font-bold text-dragonfly-navy-50 text-xl">
                  {Math.round(w.tempC)}°C
                </p>
                <p className="text-caption text-dragonfly-navy-400">
                  {wInfo?.label}
                  {w.maxC !== null && w.minC !== null
                    ? ` · ${Math.round(w.maxC)}° / ${Math.round(w.minC)}°`
                    : ""}
                </p>
              </>
            ) : (
              <p className="font-semibold text-dragonfly-navy-200">Local conditions</p>
            )}
          </div>
        </div>
        {data.locationName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-dragonfly-orange-500/15 px-2.5 py-1 text-caption font-medium text-dragonfly-orange-400">
            <Icon name="map-pin" size={12} />
            {data.locationName}
          </span>
        )}
      </div>

      {w && (
        <p className="mt-2 text-caption text-dragonfly-navy-500">
          Feels like {Math.round(w.feelsC)}°C · Wind {Math.round(w.windKmh)} km/h
        </p>
      )}

      {data.news.length > 0 && (
        <div className="mt-3 border-t border-dragonfly-navy-800 pt-3">
          <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-dragonfly-navy-500">
            Near {data.locationName ?? "you"}
          </p>
          <ul className="space-y-1.5">
            {data.news.slice(0, 3).map((n) => (
              <li key={n.url}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <span className="line-clamp-2 text-body text-dragonfly-navy-200 group-hover:text-dragonfly-orange-400 transition-colors">
                    {n.title}
                  </span>
                  <span className="text-caption text-dragonfly-navy-500">
                    {n.source ?? "News"}
                    {n.age ? ` · ${n.age}` : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}