/* PlaceDetailsSheet — the bottom sheet opened by tapping a place. Shows what we
 * already know straight away. Google places are then lazily enriched with photos,
 * phone and hours. Fetched details belong to one place: a previous place's
 * details can never appear under a newly selected one. */
"use client";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo } from "react";

import { api } from "@/app/providers";
import { Icon } from "@/components/ui/Icon";
import { useActionData } from "@/hooks/useActionData";
import { CATEGORY_ICONS, categoryLabel, sourceLabel } from "@/lib/poi/categories";
import { buildMapsUrl } from "@/lib/ride/links";
import { cn } from "@/lib/utils/cn";
import { getDeviceId } from "@/lib/utils/deviceId";
import type { NormalizedPOI } from "@/types";

interface Props {
  poi: NormalizedPOI | null;
  onClose: () => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

interface PlaceDetailsResponse {
  photos?: string[];
  phone?: string;
  hours?: string[];
}


/** Everything the lookup needs, captured from the selected place. */
interface EnrichTarget {
  key: string;
  placeId: string;
  source: NormalizedPOI["source"];
  name: string;
  category: string;
  lat: number;
  lng: number;
}

function placeKey(poi: NormalizedPOI): string {
  return `${poi.source}|${poi.placeId}|${poi.lat}|${poi.lng}`;
}

/**
 * Photos we are willing to show, in order of trust:
 * 1. our own Google proxy (`/place-photo?ref=…`) — real Places photos, guaranteed to belong to the place;
 * 2. our Street View proxy (`/streetview?lat=…&lng=…`) — a photo of the place's actual coordinates, so it cannot be the wrong place;
 * 3. Wikipedia / Wikimedia Commons photos — gated best-effort matches.
 */
function isShowablePhoto(url: string): boolean {
  return (
    url.includes("/place-photo?") ||
    url.includes("/streetview?") ||
    url.includes("thumb.wikimedia.org") ||
    url.includes("upload.wikimedia.org") ||
    url.includes("commons.wikimedia.org")
  );
}

/**
 * Every source with a place id gets a lookup. Google rows get Places
 * Details (photos/phone/hours); OSM and Brave rows fall back to the
 * server's Wikipedia thumbnails, which are now gated: the server searches
 * with the place's category and drops disambiguation/product/media articles,
 * so a thumbnail it returns is at least plausibly the place (KFC → the
 * restaurant, not a phone named "Clicks").
 */
function toEnrichTarget(poi: NormalizedPOI | null): EnrichTarget | null {
  if (!poi || !poi.placeId) return null;
  return {
    key: placeKey(poi),
    placeId: poi.placeId,
    source: poi.source,
    name: poi.name,
    category: poi.category,
    lat: poi.lat,
    lng: poi.lng,
  };
}

export function PlaceDetailsSheet({ poi, onClose, onRequestRide, onShowOnMap }: Props) {
  const target = useMemo(() => toEnrichTarget(poi), [poi]);

  const args = useMemo(
    () =>
      target
        ? {
            deviceId: getDeviceId(),
            placeId: target.placeId,
            source: target.source,
            name: target.name,
            category: target.category,
            lat: target.lat,
            lng: target.lng,
          }
        : null,
    [target]
  );

  const { data, loading: loadingAction } = useActionData<
    {
      deviceId: string;
      placeId: string;
      source: string;
      name: string;
      category?: string;
      lat: number;
      lng: number;
    },
    PlaceDetailsResponse
  >(api.actions.getPlaceDetails, args);

  useEffect(() => {
    if (!poi) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [poi, onClose]);

  // Only details that belong to the place on screen are ever used.
  const details = data
    ? {
        photos: (data.photos ?? []).filter(isShowablePhoto),
        phone: data.phone,
        hours: data.hours ?? [],
      }
    : null;

  const loading = target !== null && loadingAction;
  const photos = details?.photos ?? [];
  const hours = details?.hours ?? [];
  const phone = poi?.phone ?? details?.phone;
  const sourceName = poi ? sourceLabel(poi.source) : null;

  return (
    <AnimatePresence>
      {poi && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-dragonfly-navy-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${poi.name}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-2xl border border-b-0 border-dragonfly-navy-800 bg-surface-900 p-5 shadow-strong"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-bold text-dragonfly-navy-50 text-body">{poi.name}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1 text-dragonfly-navy-400 hover:text-dragonfly-navy-200 hover:bg-dragonfly-navy-800 transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            {poi.address && (
              <p className="text-caption text-dragonfly-navy-400 mb-3">{poi.address}</p>
            )}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-dragonfly-teal-500/15 text-dragonfly-teal-300 font-medium text-caption">
                <Icon name={CATEGORY_ICONS[poi.category] ?? "map-pin"} size={13} />
                {categoryLabel(poi.category)}
              </span>
              {poi.openNow !== undefined && (
                <span
                  className={cn(
                    "text-caption px-2 py-0.5 rounded-full font-medium",
                    poi.openNow
                      ? "bg-dragonfly-emerald-500/20 text-dragonfly-emerald-400"
                      : "bg-dragonfly-rose-500/20 text-dragonfly-rose-400"
                  )}
                >
                  {poi.openNow ? "Open" : "Closed"}
                </span>
              )}
              {sourceName && (
                <span className="text-caption px-1.5 py-0.5 rounded-full bg-dragonfly-navy-800 text-dragonfly-navy-300 font-medium">
                  {sourceName}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4 text-caption">
              {poi.rating !== undefined && poi.rating > 0 && (
                <div className="rounded-lg bg-dragonfly-navy-900/80 p-2 border border-dragonfly-navy-800 text-center">
                  <span className="flex items-center justify-center gap-1 text-dragonfly-gold-400 font-semibold">
                    <Icon name="star" size={14} /> {poi.rating.toFixed(1)}
                  </span>
                </div>
              )}
              {poi.verifiedCount !== undefined && (
                <div className="rounded-lg bg-dragonfly-navy-900/80 p-2 border border-dragonfly-navy-800 text-center">
                  <span className="flex items-center justify-center gap-1 text-dragonfly-navy-300 font-medium">
                    <Icon name="check" size={13} /> Verified {poi.verifiedCount}
                  </span>
                </div>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="rounded-lg bg-dragonfly-teal-500/10 p-2 border border-dragonfly-teal-500/20 text-center block transition-colors hover:bg-dragonfly-teal-500/20"
                >
                  <span className="inline-flex items-center gap-1 text-dragonfly-teal-300 font-medium">
                    <Icon name="phone" size={13} /> Call
                  </span>
                </a>
              )}
            </div>
            {hours.length > 0 && (
              <div className="rounded-xl bg-dragonfly-navy-900/60 border border-dragonfly-navy-800 p-3 mb-3">
                <p className="text-caption font-medium text-dragonfly-navy-300 mb-1">Hours</p>
                <ul className="text-xs text-dragonfly-navy-400 space-y-0.5">
                  {hours.map((h, i) => (
                    <li key={`${i}-${h}`}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            {!loading && photos.length === 0 && hours.length === 0 && !poi.address && !phone && (
              <p className="text-caption text-dragonfly-navy-400 mb-3">
                No extra details yet for this place.
              </p>
            )}
            <div className="flex gap-2 mb-4 overflow-x-auto snap-x">
              {(loading ? [1, 2, 3] : photos.length ? photos : ["placeholder"]).map((p) => (
                <div
                  key={typeof p === "string" ? p : String(p)}
                  className="snap-start shrink-0 w-36 h-24 rounded-xl bg-dragonfly-navy-900 border border-dragonfly-navy-800 flex items-center justify-center"
                >
                  {typeof p === "string" && p !== "placeholder" ? (
                    // Dynamic remote URLs (Google proxy / Wikimedia) — plain <img> is correct here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p}
                      alt={poi.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Icon
                      name={CATEGORY_ICONS[poi.category] ?? "image"}
                      size={28}
                      className="text-dragonfly-navy-500"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onRequestRide?.(poi)}
                className="flex-1 rounded-xl bg-dragonfly-orange-500 hover:bg-dragonfly-orange-400 text-dragonfly-navy-950 font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
              >
                <Icon name="car" size={16} /> Ride
              </button>
              <button
                type="button"
                onClick={() => {
                  onShowOnMap?.(poi);
                  onClose();
                }}
                className="flex-1 rounded-xl border border-dragonfly-navy-700 hover:bg-dragonfly-navy-800 text-dragonfly-navy-200 font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
              >
                <Icon name="map-pin" size={16} /> Map
              </button>
              <a
                href={buildMapsUrl(poi)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-dragonfly-navy-700 hover:bg-dragonfly-navy-800 text-dragonfly-navy-200 font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] text-center"
              >
                <Icon name="compass" size={16} /> Google Maps
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
