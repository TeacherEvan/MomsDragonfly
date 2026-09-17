import React from "react";
import type { NormalizedPOI } from "@/types";
import { formatDistance } from "@/lib/utils/geo";
import { cn } from "@/lib/utils/cn";

interface POICardProps {
  poi: NormalizedPOI;
  onVerify: () => void;
}

export function POICard({ poi, onVerify }: POICardProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
            {poi.name}
          </h3>
          {poi.openNow !== undefined && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                poi.openNow
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {poi.openNow ? "Open" : "Closed"}
            </span>
          )}
        </div>
        {poi.address && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{poi.address}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium capitalize">
            {poi.category}
          </span>
          {poi.distanceMetres !== undefined && (
            <span className="text-gray-500 font-medium">
              {formatDistance(poi.distanceMetres)}
            </span>
          )}
          {poi.rating && (
            <span className="text-amber-500 font-medium">
              ⭐ {poi.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onVerify}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
          "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
          "border-brand-500 text-brand-600 hover:bg-brand-50 active:scale-95"
        )}
        aria-label={`Verify ${poi.name}`}
      >
        ✓ {poi.verifiedCount}
      </button>
    </div>
  );
}
