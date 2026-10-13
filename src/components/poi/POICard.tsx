import React from "react";

import { Icon } from "@/components/ui/Icon";
import { CATEGORY_ICONS, categoryLabel } from "@/lib/poi/categories";
import { cn } from "@/lib/utils/cn";
import { formatDistance } from "@/lib/utils/geo";
import type { NormalizedPOI } from "@/types";

interface POICardProps {
  poi: NormalizedPOI;
  onVerify: () => void;
  onSelect?: (poi: NormalizedPOI) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
}

export function POICard({ poi, onVerify, onSelect, onShowOnMap, onRequestRide }: POICardProps) {
  return (
    <div
      onClick={() => onSelect?.(poi)}
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-xl border border-dragonfly-navy-800",
        "bg-dragonfly-navy-900/80 backdrop-blur-sm shadow-soft",
        "cursor-pointer transition-all duration-fast",
        "hover:border-dragonfly-teal-500/40 hover:shadow-medium active:scale-[0.99]"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Only the card itself opens details. Enter/Space pressed on the inner
        // Ride/Map/Verify buttons bubbles up here and must not select the place.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(poi);
        }
      }}
      aria-label={`Details for ${poi.name}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-dragonfly-navy-50 line-clamp-2 text-body">
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
          <p className="text-caption text-dragonfly-navy-400 line-clamp-2 mt-1">{poi.address}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-caption flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-dragonfly-teal-500/15 text-dragonfly-teal-300 font-medium">
            <Icon name={CATEGORY_ICONS[poi.category] ?? "map-pin"} size={13} />
            {categoryLabel(poi.category)}
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
          <span className="inline-flex items-center gap-1 text-caption text-dragonfly-navy-300 ml-auto">
            Details <Icon name="chevron-right" size={12} />
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {onRequestRide && (
          <button
            type="button"
            onClick={(e)=>{e.stopPropagation(); onRequestRide?.(poi);}}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-caption font-semibold border transition-all duration-fast",
              "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
              "border-dragonfly-orange-500/40 text-dragonfly-orange-400 hover:bg-dragonfly-orange-500/10 active:scale-[0.98]"
            )}
            aria-label={`Request a ride to ${poi.name}`}
          >
            <Icon name="car" size={18} />
          </button>
        )}
        {onShowOnMap && (
          <button
            type="button"
            onClick={(e)=>{e.stopPropagation(); onShowOnMap?.(poi);}}
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
          onClick={(e) => {
            // Verifying must not bubble up to the card and open its details.
            e.stopPropagation();
            onVerify();
          }}
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
