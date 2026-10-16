"use client";
import { useMemo } from "react";

import { api } from "@/app/providers";
import { Icon } from "@/components/ui/Icon";
import { useActionData } from "@/hooks/useActionData";
import { getDeviceId } from "@/lib/utils/deviceId";
import { sanitiseHttpsUrl } from "@/lib/utils/url";
import { weatherInfo } from "@/lib/utils/weather";

interface HighlightsCardProps {
  lat: number;
  lng: number;
  searchQuery?: string;
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
export function HighlightsCard({ lat, lng, searchQuery }: HighlightsCardProps) {
  const { data, loading, failed, reload } = useActionData<
    { deviceId: string; lat: number; lng: number },
    Highlights
  >(
    api.actions.getHighlights,
    { deviceId: getDeviceId(), lat, lng },
    { roundCoords: 2 }
  );

  const filteredNews = useMemo(() => {
    if (!data?.news) return [];
    if (!searchQuery?.trim()) return data.news;
    const q = searchQuery.trim().toLowerCase();
    return data.news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.source && n.source.toLowerCase().includes(q)) ||
        (data.locationName && data.locationName.toLowerCase().includes(q))
    );
  }, [data?.news, data?.locationName, searchQuery]);

  if (!data && failed) {
    return (
      <section
        className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 backdrop-blur-sm p-4 text-center shadow-soft"
        aria-label="Local weather and news"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Icon name="alert" size={24} className="text-dragonfly-gold-400" />
          <p className="text-body font-semibold text-dragonfly-navy-200">
            Local weather &amp; news unavailable
          </p>
          <p className="text-caption text-dragonfly-navy-400 max-w-xs">
            Connect to the internet to see current conditions and updates for this area.
          </p>
          <button
            type="button"
            onClick={reload}
            className="mt-1 px-3 py-1.5 bg-dragonfly-teal-500/20 text-dragonfly-teal-300 hover:bg-dragonfly-teal-500/30 rounded-lg text-caption font-semibold transition-colors min-h-[var(--touch-target)]"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (loading && !data) {
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

  if (!data) return null;

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
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-caption font-semibold uppercase tracking-wide text-dragonfly-navy-500">
              Near {data.locationName ?? "you"}
            </p>
            {searchQuery?.trim() && (
              <span className="text-caption text-dragonfly-navy-400 font-medium">
                {filteredNews.length} {filteredNews.length === 1 ? "article" : "articles"}
              </span>
            )}
          </div>
          {filteredNews.length === 0 ? (
            <p className="py-3 text-center text-caption text-dragonfly-navy-400">
              No news matching &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filteredNews.slice(0, 3).map((n) => {
                const safeUrl = sanitiseHttpsUrl(n.url);
                if (!safeUrl) return null;
                return (
                  <li key={n.url}>
                    <a
                      href={safeUrl}
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
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}