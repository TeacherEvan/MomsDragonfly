"use client";
import React, { useId, useMemo } from "react";
import { List, ListProps } from "react-window";
import type { NormalizedPOI } from "@/types";
import { POICard } from "./POICard";

interface POIListProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
  category?: string;
}

const ITEM_HEIGHT = 140;

interface POIRowData {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

interface POIRowProps {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

function POIRow({ index, style, ariaAttributes, pois, onVerify, onShowOnMap }: POIRowProps): React.ReactElement {
  const poi = pois[index];

  return (
    <div style={style} {...ariaAttributes}>
      <POICard poi={poi} onVerify={() => onVerify(poi.placeId)} onShowOnMap={onShowOnMap} />
    </div>
  );
}

export function POIList({ pois, onVerify, onShowOnMap, category }: POIListProps) {
  const listId = useId();
  const liveRegionId = `${listId}-live`;

  if (pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200" role="status" aria-live="polite" aria-label="No places found">
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

  const rowData = useMemo(() => ({ pois, onVerify, onShowOnMap }), [pois, onVerify, onShowOnMap]);

  type ListRowProps = {
    pois: NormalizedPOI[];
    onVerify: (placeId: string) => void;
    onShowOnMap?: (poi: NormalizedPOI) => void;
  };

  const ListComponent = List as React.FC<ListProps<ListRowProps>>;

  return (
    <div className="w-full">
      <div id={liveRegionId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {pois.length} places found{category && category !== "all" ? ` in ${category}` : ""}
      </div>
      <ListComponent
        height={400}
        itemCount={pois.length}
        itemSize={ITEM_HEIGHT}
        width="100%"
        overscanCount={3}
        itemData={rowData}
        rowComponent={POIRow}
      />
    </div>
  );
}