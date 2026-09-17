"use client";
import React from "react";
import { List } from "react-window";
import type { NormalizedPOI } from "@/types";
import { POICard } from "./POICard";

interface POIListProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
}

const ITEM_HEIGHT = 120;

interface POIRowProps {
  index: number;
  style: React.CSSProperties;
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
}

function POIRow({ index, style, pois, onVerify }: POIRowProps): React.ReactElement {
  const poi = pois[index];

  return (
    <div style={style}>
      <POICard poi={poi} onVerify={() => onVerify(poi.placeId)} />
    </div>
  );
}

interface ListRowProps {
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

  const rowProps: ListRowProps = { pois, onVerify };

  return (
    <div className="h-[400px] w-full">
      {/* eslint-disable @typescript-eslint/no-explicit-any */}
      {React.createElement(
        List as any,
        {
          height: 400,
          itemCount: pois.length,
          itemSize: ITEM_HEIGHT,
          rowProps,
          width: "100%",
          overscanCount: 3,
          rowComponent: POIRow,
          rowHeight: ITEM_HEIGHT,
          rowCount: pois.length,
        } as any,
        null
      )}
      {/* eslint-enable @typescript-eslint/no-explicit-any */}
    </div>
  );
}