"use client";
import React from "react";
import type { NormalizedPOI } from "@/types";
import { POICard } from "./POICard";

interface POIListProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
}

export function POIList({ pois, onVerify }: POIListProps) {
  if (pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
        <span className="text-4xl mb-2" role="img" aria-label="location pin">
          📍
        </span>
        <p className="text-sm font-medium text-gray-600">
          No places found nearby
        </p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Try expanding your search radius or changing categories.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pois.map((poi) => (
        <POICard
          key={poi.placeId}
          poi={poi}
          onVerify={() => onVerify(poi.placeId)}
        />
      ))}
    </div>
  );
}
