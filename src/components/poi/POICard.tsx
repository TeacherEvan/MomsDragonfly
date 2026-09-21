import React from "react";
import type { NormalizedPOI } from "@/types";
import { formatDistance } from "@/lib/utils/geo";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

interface POICardProps {
  poi: NormalizedPOI;
  onVerify: () => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

const CATEGORY_ICONS: Record<string, IconName> = {
  restaurant: "restaurant",
  park: "tree",
  attraction: "landmark",
  entertainment: "theater",
  toilets: "toilet",
  pharmacy: "pharmacy",
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "Food",
  park: "Park",
  attraction: "Attraction",
  entertainment: "Events",
  toilets: "Restroom",
  pharmacy: "Pharmacy",
};

export function POICard({ poi, onVerify, onShowOnMap }: POICardProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-surface-900/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-800 shadow-soft card-hover">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-dragonfly-navy-50 truncate text-body">
            {poi.name}
          </h3>
          {poi.openNow !== undefined && (
            <span
              className={cn(
                "text-caption px-2 py-0.5 rounded-full font-medium shrink-0",
                poi.openNow
                  ? "bg-dragonfly-emerald-500/20 text-dragonfly-emerald-400"
                  : "bg-dragonfly-rose-500/20 text-dragonfly-rose-400"
              )}
            >
              {poi.openNow ? "Open" : "Closed"}
            </span>
          )}
        </div>
        {poi.address && (
          <p className="text-caption text-dragonfly-navy-400 truncate mt-1">{poi.address}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-caption">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-dragonfly-teal-500/15 text-dragonfly-teal-300 font-medium">
            <Icon name={CATEGORY_ICONS[poi.category] ?? "map-pin"} size={13} />
            {CATEGORY_LABELS[poi.category] ?? poi.category}
          </span>
          {poi.distanceMetres !== undefined && (
            <span className="inline-flex items-center gap-1 text-dragonfly-navy-400 font-medium">
              {formatDistance(poi.distanceMetres)}
            </span>
          )}
          {poi.rating && (
            <span className="inline-flex items-center gap-1 text-dragonfly-gold-400 font-medium">
              <Icon name="star" size={13} />
              {poi.rating.toFixed(1)}
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
              "border-dragonfly-navy-700 text-dragonfly-navy-300 hover:bg-dragonfly-navy-800 hover:text-dragonfly-teal-300 active:scale-[0.98]"
            )}
            aria-label={`Show ${poi.name} on map`}
          >
            <Icon name="map-pin" size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={onVerify}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-lg text-caption font-semibold border transition-all duration-fast",
            "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
            "inline-flex items-center gap-1",
            "border-primary-500 text-primary-400 hover:bg-primary-500/10 active:scale-[0.98]"
          )}
          aria-label={`Verify ${poi.name}`}
        >
          <Icon name="check" size={15} />
          {poi.verifiedCount}
        </button>
      </div>
    </div>
  );
}
