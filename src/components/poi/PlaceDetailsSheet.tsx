/* Place details sheet — expandable dialog with lazy photo enrichment */
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { NormalizedPOI } from "@/types";
import { Icon } from "@/components/ui/Icon";

interface PlaceDetailsSheetProps {
  poi: NormalizedPOI | null;
  onClose: () => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
  onShowOnMap?: (poi: NormalizedPOI) => void;
}

export function PlaceDetailsSheet({ poi, onClose, onRequestRide, onShowOnMap }: PlaceDetailsSheetProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!poi) { setPhotos([]); return; }
    setLoading(true);
    // Lazy enrichment placeholder: shimmer then graceful degrade
    const timer = setTimeout(() => { setPhotos([]); setLoading(false); }, 400);
    return () => clearTimeout(timer);
  }, [poi?.placeId]);

  return (
    <AnimatePresence>
      {poi && (
        <>
          <motion.div key="detail-backdrop" className="fixed inset-0 z-50 bg-dragonfly-navy-950/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
          <motion.div key="detail-sheet" role="dialog" aria-modal="true" aria-label={`Details for ${poi.name}`} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }} className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-2xl border border-b-0 border-dragonfly-navy-800 bg-surface-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-strong">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-bold text-dragonfly-navy-50 text-body">{poi.name}</h2>
              <button onClick={onClose} aria-label="Close details" className="rounded-lg p-1 hover:bg-dragonfly-navy-800"><Icon name="close" size={20} /></button>
            </div>
            {poi.address && <p className="text-caption text-dragonfly-navy-400 mb-3">{poi.address}</p>}
            <div className="flex gap-2 mb-4 overflow-x-auto snap-x">
              {(loading ? [1,2,3] : photos.length ? photos : ["placeholder"]).map((p,i) => (
                <div key={i} className="snap-start shrink-0 w-36 h-24 rounded-xl bg-dragonfly-navy-900 border border-dragonfly-navy-800 flex items-center justify-center">
                  <Icon name="restaurant" size={28} className="text-dragonfly-navy-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {onRequestRide && <button onClick={() => { onRequestRide(poi); }} className="flex-1 rounded-xl bg-dragonfly-orange-500 text-dragonfly-navy-950 font-semibold py-2.5"><Icon name="car" size={16} /> Ride</button>}
              {onShowOnMap && <button onClick={() => { onShowOnMap(poi); onClose(); }} className="flex-1 rounded-xl border border-dragonfly-navy-700 text-dragonfly-navy-200 font-semibold py-2.5"><Icon name="map-pin" size={16} /> Map</button>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
