/* PlaceDetailsSheet — full with lazy getPlaceDetails + photos/actions */
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import type { NormalizedPOI } from "@/types";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/Icon";
interface Props {
  poi: NormalizedPOI | null;
  onClose: () => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}
export function PlaceDetailsSheet({ poi, onClose, onRequestRide, onShowOnMap }: Props) {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [enriched, setEnriched] = useState<Record<string, string | number | boolean | string[] | undefined>>({});
  const getPlaceDetails = useAction(api.actions.getPlaceDetails);

  useEffect(() => {
    if (!poi) { setPhotos([]); setEnriched({}); return; }
    if (poi.source !== 'google' || !poi.placeId) { setPhotos([]); setLoading(false); return; }
    setLoading(true);
    getPlaceDetails({ deviceId: getDeviceId(), placeId: poi.placeId, source: poi.source, name: poi.name, lat: poi.lat, lng: poi.lng })
      .then((res) => { setPhotos((res as { photos?: string[] })?.photos || []); setEnriched({ phone: (res as { phone?: string })?.phone, hours: (res as { hours?: string[] })?.hours, ratingCount: (res as { ratingCount?: number })?.ratingCount }); })
      .catch(() => console.warn('place details failed'))
      .finally(() => setLoading(false));
  }, [poi, getPlaceDetails]);

  return (
    <AnimatePresence>
      {poi && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-dragonfly-navy-950/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
          <motion.div role="dialog" aria-modal="true" aria-label={`Details for ${poi.name}`} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }} className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-2xl border border-b-0 border-dragonfly-navy-800 bg-surface-900 p-5 shadow-strong">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-bold text-dragonfly-navy-50 text-body">{poi.name}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-dragonfly-navy-800"><Icon name="close" size={20} /></button>
            </div>
            <p className="text-caption text-dragonfly-navy-400 mb-3">{poi.address}</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-dragonfly-teal-500/15 text-dragonfly-teal-300 font-medium text-caption">
                <Icon name="map-pin" size={13} />
                {poi.category ?? "Place"}
              </span>
              {poi.openNow !== undefined && (
                <span className={cn("text-caption px-2 py-0.5 rounded-full font-medium", poi.openNow ? "bg-dragonfly-emerald-500/20 text-dragonfly-emerald-400" : "bg-dragonfly-rose-500/20 text-dragonfly-rose-400")}>{poi.openNow ? "Open" : "Closed"}</span>
              )}
              {poi.source && <span className="text-caption px-1.5 py-0.5 rounded-full bg-dragonfly-navy-800 text-dragonfly-navy-300 font-medium">{poi.source}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4 text-caption">
              {poi.rating && (
                <div className="rounded-lg bg-dragonfly-navy-900/80 p-2 border border-dragonfly-navy-800 text-center">
                  <span className="flex items-center justify-center gap-1 text-dragonfly-gold-400 font-semibold"><Icon name="star" size={14}/> {poi.rating.toFixed(1)}</span>
                </div>
              )}
              {poi.verifiedCount !== undefined && (
                <div className="rounded-lg bg-dragonfly-navy-900/80 p-2 border border-dragonfly-navy-800 text-center">
                  <span className="flex items-center justify-center gap-1 text-dragonfly-navy-300 font-medium"><Icon name="check" size={13}/> Verified {poi.verifiedCount}</span>
                </div>
              )}
              {poi.phone && (
                <a href={"tel:" + poi.phone} className="rounded-lg bg-dragonfly-teal-500/10 p-2 border border-dragonfly-teal-500/20 text-center block transition-colors hover:bg-dragonfly-teal-500/20"><span className="inline-flex items-center gap-1 text-dragonfly-teal-300 font-medium"><Icon name="restaurant" size={13}/> Call</span></a>
              )}
            </div>
            {enriched.hours && Array.isArray(enriched.hours) && enriched.hours.length > 0 && (
              <div className="rounded-xl bg-dragonfly-navy-900/60 border border-dragonfly-navy-800 p-3 mb-3">
                <p className="text-caption font-medium text-dragonfly-navy-300 mb-1">Hours</p>
                <ul className="text-xs text-dragonfly-navy-400 space-y-0.5">{enriched.hours.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
              </div>
            )}
            <div className="flex gap-2 mb-4 overflow-x-auto snap-x">
              {(loading ? [1,2,3] : (photos.length ? photos : ['placeholder']))
                .map((p, i) => (
                  <div key={i} className="snap-start shrink-0 w-36 h-24 rounded-xl bg-dragonfly-navy-900 border border-dragonfly-navy-800 flex items-center justify-center">
                    {typeof p === 'string' && p !== 'placeholder' ? (
                      <img src={p} alt={poi.name} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Icon name="restaurant" size={28} className="text-dragonfly-navy-500" />
                    )}
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onRequestRide?.(poi)} className="flex-1 rounded-xl bg-dragonfly-orange-500 text-dragonfly-navy-950 font-semibold py-2.5"><Icon name="car" size={16} /> Ride</button>
              <button onClick={() => { onShowOnMap?.(poi); onClose(); }} className="flex-1 rounded-xl border border-dragonfly-navy-700 text-dragonfly-navy-200 font-semibold py-2.5"><Icon name="map-pin" size={16} /> Map</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
