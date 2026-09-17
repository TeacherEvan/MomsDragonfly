"use client";
import React from "react";
import type { NormalizedPOI } from "@/types";
import { formatDistance } from "@/lib/utils/geo";

interface POIMarkerProps {
  poi: NormalizedPOI;
  onVerify: () => void;
}

export function POIMarker({ poi, onVerify }: POIMarkerProps) {
  return (
    <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 min-w-[200px]">
      <h3 className="font-semibold text-base text-gray-900 leading-tight">
        {poi.name}
      </h3>
      {poi.address && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{poi.address}</p>
      )}
      <div className="flex items-center gap-2 mt-1.5 text-xs">
        {poi.distanceMetres !== undefined && (
          <span className="font-medium text-brand-600">
            {formatDistance(poi.distanceMetres)} away
          </span>
        )}
        {poi.rating !== undefined && (
          <span className="text-amber-500">⭐ {poi.rating.toFixed(1)}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onVerify}
        className="mt-2.5 w-full bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium rounded py-1.5 text-xs transition-colors min-h-[var(--touch-target)]"
      >
        ✓ Verify POI ({poi.verifiedCount})
      </button>
    </div>
  );
}
