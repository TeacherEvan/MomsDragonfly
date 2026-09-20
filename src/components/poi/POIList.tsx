"use client";
import React, { useId, useMemo } from "react";
import { List as ReactWindowList } from "react-window";

const List = ReactWindowList as React.ComponentType<{
  height: number;
  rowCount: number;
  rowHeight: number;
  width: number | string;
  overscanCount?: number;
  rowProps: ListRowProps;
  rowComponent: React.ComponentType<POIRowProps>;
  style?: React.CSSProperties;
  className?: string;
}>;
import type { NormalizedPOI } from "@/types";
import { POICard } from "./POICard";

interface POIListProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
  category?: string;
}

const ITEM_HEIGHT = 140;

interface POIRowProps {
  index: number;
  style: React.CSSProperties;
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

function POIRow({ index, style, pois, onVerify, onShowOnMap }: POIRowProps): React.ReactElement {
  const poi = pois[index];

  return (
    <div style={style} role="listitem" aria-posinset={index + 1} aria-setsize={pois.length}>
      <POICard poi={poi} onVerify={() => onVerify(poi.placeId)} onShowOnMap={onShowOnMap} />
    </div>
  );
}

interface ListRowProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

export function POIList({ pois, onVerify, onShowOnMap, category }: POIListProps) {
  const listId = useId();
  const liveRegionId = `${listId}-live`;

  const rowData = useMemo<ListRowProps>(() => ({ pois, onVerify, onShowOnMap }), [pois, onVerify, onShowOnMap]);

  if (pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-neutral-400 bg-surface-900/60 backdrop-blur-sm rounded-xl border border-dashed border-neutral-700" role="status" aria-live="polite" aria-label="No places found">
        <span className="text-4xl mb-2" role="img" aria-label="location pin">
          📍
        </span>
        <p className="text-sm font-medium text-neutral-500">
          No places found nearby
        </p>
        <p className="text-caption text-neutral-500 mt-1 max-w-xs">
          Try expanding your search radius or changing categories.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id={liveRegionId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {pois.length} places found{category && category !== "all" ? ` in ${category}` : ""}
      </div>
      <List
        height={400}
        rowCount={pois.length}
        rowHeight={ITEM_HEIGHT}
        width="100%"
        overscanCount={3}
        rowProps={rowData}
        rowComponent={POIRow}
      />
    </div>
  );
}