"use client";
import { useCallback, useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/Icon";
import { HighlightsCard } from "@/components/explore/HighlightsCard";
import { LocalDishesCard } from "@/components/explore/LocalDishesCard";

type LocalSegment = "news" | "taste";

/** Remembers which window the user last looked at. */
const SEGMENT_STORAGE_KEY = "mdf_local_segment";

const SEGMENTS: ReadonlyArray<{ id: LocalSegment; label: string }> = [
  { id: "news", label: "News & weather" },
  { id: "taste", label: "Taste of the area" },
];

function isSegment(value: string | null): value is LocalSegment {
  return value === "news" || value === "taste";
}

/** Local tab — "what's around you" in two segmented windows. */
export default function LocalClient() {
  const { lat, lng, error: geoError } = useGeolocation();
  const [segment, setSegment] = useState<LocalSegment>("news");

  // Restore the last window on mount (client-only, so no hydration mismatch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SEGMENT_STORAGE_KEY);
    if (isSegment(saved)) setSegment(saved);
  }, []);

  const selectSegment = useCallback((next: LocalSegment) => {
    setSegment(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SEGMENT_STORAGE_KEY, next);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => window.location.reload(),
        () =>
          alert(
            "Location permission still denied. Enable it in browser settings to see what's around you."
          )
      );
    }
  }, []);

  const hasPosition = Boolean(lat && lng && !geoError);
  // The hook exposes no pending flag, so pending = no position yet AND no error.
  // Keeps the failure panel (with its Retry button) hidden until geolocation
  // actually errors, instead of showing it while watchPosition is still resolving.
  const isLocating = !hasPosition && !geoError;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <div>
        <h1 className="text-h1 font-bold text-dragonfly-navy-50">Local</h1>
        <p className="mt-1 text-caption text-dragonfly-navy-400">What&apos;s around you</p>
      </div>

      {hasPosition && lat && lng ? (
        <>
          <div
            role="tablist"
            aria-label="Local windows"
            className="flex gap-1 rounded-xl border border-dragonfly-navy-800 bg-dragonfly-navy-900/70 p-1"
          >
            {SEGMENTS.map((s) => {
              const isActive = s.id === segment;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`local-tab-${s.id}`}
                  aria-selected={isActive}
                  aria-controls={`local-window-${s.id}`}
                  onClick={() => selectSegment(s.id)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-caption font-semibold transition-colors duration-fast min-h-[48px]",
                    isActive
                      ? "bg-dragonfly-orange-500/15 text-dragonfly-orange-400"
                      : "text-dragonfly-navy-400 hover:text-dragonfly-navy-200"
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`local-window-${segment}`}
            aria-labelledby={`local-tab-${segment}`}
            className="flex flex-col gap-4"
          >
            {segment === "news" ? (
              <HighlightsCard lat={lat} lng={lng} />
            ) : (
              <LocalDishesCard lat={lat} lng={lng} />
            )}
          </div>
        </>
      ) : isLocating ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dragonfly-navy-800 bg-dragonfly-navy-900/70 px-6 py-8 text-center"
          role="status"
          aria-live="polite"
        >
          <span className="mb-3 animate-pulse text-dragonfly-navy-500" aria-hidden="true">
            <Icon name="map-pin" size={40} />
          </span>
          <p className="mb-2 font-semibold text-dragonfly-navy-200">Finding you…</p>
          <p className="max-w-xs text-sm text-dragonfly-navy-500">
            We use your location to show local news, weather and dishes nearby.
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dragonfly-navy-700 bg-dragonfly-navy-900/80 px-6 py-8 text-center"
          role="status"
        >
          <span className="mb-3 text-dragonfly-navy-500" aria-hidden="true">
            <Icon name="map-pin" size={40} />
          </span>
          <p className="mb-2 font-semibold text-dragonfly-navy-200">
            Turn on location to see what&apos;s around you
          </p>
          <p className="mb-4 max-w-xs text-sm text-dragonfly-navy-500">
            {geoError ?? "We use your location to show local news, weather and dishes nearby."}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-[var(--touch-target)] rounded-lg bg-dragonfly-teal-500 px-4 py-2 text-sm font-semibold text-dragonfly-navy-950 transition-colors hover:bg-dragonfly-teal-400"
          >
            Retry location access
          </button>
        </div>
      )}
    </div>
  );
}