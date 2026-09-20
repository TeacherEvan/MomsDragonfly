import React from "react";
import type { NormalizedPOI } from "@/types";
import { formatDistance } from "@/lib/utils/geo";
import { cn } from "@/lib/utils/cn";

interface POICardProps {
  poi: NormalizedPOI;
  onVerify: () => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

export function POICard({ poi, onVerify, onShowOnMap }: POICardProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 shadow-soft hover:border-neutral-700 transition-all duration-fast">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-neutral-50 truncate text-body">
            {poi.name}
          </h3>
          {poi.openNow !== undefined && (
            <span
              className={cn(
                "text-caption px-2 py-0.5 rounded-full font-medium",
                poi.openNow
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              )}
            >
              {poi.openNow ? "Open" : "Closed"}
            </span>
          )}
        </div>
        {poi.address && (
          <p className="text-caption text-neutral-400 truncate mt-1">{poi.address}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-caption">
          <span className="px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 font-medium capitalize">
            {poi.category}
          </span>
          {poi.distanceMetres !== undefined && (
            <span className="text-neutral-400 font-medium">
              {formatDistance(poi.distanceMetres)}
            </span>
          )}
          {poi.rating && (
            <span className="text-amber-400 font-medium">
              ⭐ {poi.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {onShowOnMap && (
          <button
            type="button"
            onClick={() => onShowOnMap(poi)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-caption font-semibold border transition-all duration-fast",
              "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
              "border-neutral-700 text-neutral-300 hover:bg-neutral-800 active:scale-[0.98]"
            )}
            aria-label={`Show ${poi.name} on map`}
          >
            📍
          </button>
        )}
        <button
          type="button"
          onClick={onVerify}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-lg text-caption font-semibold border transition-all duration-fast",
            "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
            "border-primary-500 text-primary-400 hover:bg-primary-500/10 active:scale-[0.98]"
          )}
          aria-label={`Verify ${poi.name}`}
        >
          ✓ {poi.verifiedCount}
        </button>
      </div>
    </div>
  );
}
