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
import { Icon } from "@/components/ui/Icon";
import { POICard } from "./POICard";

export type FetchPhase = "idle" | "loading" | "ready" | "empty" | "error";

interface POIListProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
  category?: string;
  phase?: FetchPhase;
  onRetry?: () => void;
  onSelect?: (poi: NormalizedPOI) => void;
}

const ITEM_HEIGHT = 152;

interface POIRowProps {
  index: number;
  style: React.CSSProperties;
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
  onSelect?: (poi: NormalizedPOI) => void;
}

function POIRow({ index, style, pois, onVerify, onShowOnMap, onRequestRide, onSelect }: POIRowProps): React.ReactElement {
  const poi = pois[index];

  return (
    <div style={style} role="listitem" aria-posinset={index + 1} aria-setsize={pois.length}>
      <POICard
        poi={poi}
        onVerify={() => onVerify(poi.placeId)}
        onSelect={onSelect}
        onShowOnMap={onShowOnMap}
        onRequestRide={onRequestRide}
      />
    </div>
  );
}

interface ListRowProps {
  pois: NormalizedPOI[];
  onVerify: (placeId: string) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
}

export function POIList({
  pois,
  onVerify,
  onShowOnMap,
  onRequestRide,
  category,
  phase = "idle",
  onRetry,
  onSelect,
}: POIListProps) {
  const listId = useId();
  const liveRegionId = `${listId}-live`;

  const rowData = useMemo<ListRowProps>(
    () => ({ pois, onVerify, onShowOnMap, onRequestRide, onSelect }),
[pois, onVerify, onShowOnMap, onRequestRide, onSelect]
  );

  if (pois.length === 0) {
    if (phase === "loading") {
      return (
        <div
          className="space-y-2.5"
          role="status"
          aria-live="polite"
          aria-label="Loading nearby places"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[128px] rounded-xl border border-dragonfly-navy-800 bg-surface-900/60 animate-pulse"
            />
          ))}
          <p className="text-caption text-dragonfly-navy-400 text-center pt-1">
            Finding places near you…
          </p>
        </div>
      );
    }

    const isError = phase === "error";
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 text-center text-dragonfly-navy-400 bg-surface-900/60 backdrop-blur-sm rounded-xl border border-dashed border-dragonfly-navy-700"
        role="status"
        aria-live="polite"
      >
        <span className="mb-2" role="img" aria-label={isError ? "warning" : "location pin"}>
          <Icon
            name={isError ? "alert" : "map-pin"}
            size={36}
            className={isError ? "text-dragonfly-gold-400" : "text-dragonfly-teal-400"}
          />
        </span>
        <p className="text-sm font-medium text-dragonfly-navy-300">
          {isError ? "Couldn't reach place services" : "No places found nearby"}
        </p>
        <p className="text-caption text-dragonfly-navy-500 mt-1 max-w-xs">
          {isError
            ? "Check your connection and try again."
            : "Try another category or retry — searches widen automatically for parks and sights."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 px-4 py-2 rounded-lg bg-dragonfly-teal-500 hover:bg-dragonfly-teal-400 text-dragonfly-navy-950 font-semibold text-caption transition-colors duration-fast min-h-[var(--touch-target)]"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        id={liveRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
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
