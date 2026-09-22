/* PlaceDetailsSheet — full with lazy getPlaceDetails + photos/actions */
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useAction } from "convex/react";
import type { NormalizedPOI } from "@/types";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
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
  const [enriched, setEnriched] = useState<Record<string, any>>({});
  const getPlaceDetails = useAction(api.actions.getPlaceDetails);

  useEffect(() => {
    if (!poi) { setPhotos([]); setEnriched({}); return; }
    if (poi.source !== 'google' || !poi.placeId) { setPhotos([]); setLoading(false); return; }
    setLoading(true);
    getPlaceDetails({ deviceId: getDeviceId(), placeId: poi.placeId, source: poi.source, name: poi.name, lat: poi.lat, lng: poi.lng })
      .then((res: any) => { setPhotos(res?.photos || []); setEnriched({ phone: res?.phone, hours: res?.hours, ratingCount: res?.ratingCount }); })
      .catch(() => console.warn('place details failed'))
      .finally(() => setLoading(false));
  }, [poi?.placeId]);

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
