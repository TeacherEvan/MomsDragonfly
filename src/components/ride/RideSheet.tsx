"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { NormalizedPOI } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { copyText } from "@/lib/utils/clipboard";
import {
  buildBoltLaunch,
  buildMapsUrl,
  buildDestinationText,
  type RideDestination,
} from "@/lib/ride/links";

interface RideSheetProps {
  poi: NormalizedPOI | null;
  pickup?: { lat: number; lng: number } | null;
  onClose: () => void;
}

export function RideSheet({ poi, pickup, onClose }: RideSheetProps) {
  const [copied, setCopied] = useState(false);

  const destination: RideDestination | null = poi
    ? {
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        ...(poi.address ? { address: poi.address } : {}),
      }
    : null;

  const handleBolt = async () => {
    if (!destination) return;
    const ok = await copyText(buildDestinationText(destination));
    setCopied(ok);
    const launch = buildBoltLaunch(navigator.userAgent);
    if (launch.mode === "app") {
      // A transient anchor click keeps the user gesture, so Android Chrome
      // hands the intent:// off to the Bolt app (browser_fallback_url covers
      // "app not installed").
      const link = document.createElement("a");
      link.href = launch.href;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      window.open(launch.href, "_blank", "noopener,noreferrer");
    }
    if (ok) window.setTimeout(() => setCopied(false), 5000);
  };

  const handleMaps = () => {
    if (!destination) return;
    window.open(buildMapsUrl(destination, pickup ?? null), "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {poi && destination && (
        <>
          <motion.div
            key="ride-backdrop"
            className="fixed inset-0 z-50 bg-dragonfly-navy-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="ride-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Request a ride to ${poi.name}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-2xl border border-b-0 border-dragonfly-navy-800 bg-surface-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-strong"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-dragonfly-orange-500/15 text-dragonfly-orange-400">
                  <Icon name="car" size={20} />
                </span>
                <div>
                  <h2 className="font-bold text-dragonfly-navy-50 text-body">Request a ride</h2>
                  <p className="text-caption text-dragonfly-navy-400">
                    via Bolt — destination ready to paste
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-dragonfly-navy-400 transition-colors hover:bg-dragonfly-navy-800 hover:text-dragonfly-navy-100 min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
                aria-label="Close ride sheet"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-dragonfly-navy-800 bg-dragonfly-navy-900/70 p-3">
              <p className="flex items-center gap-1.5 font-semibold text-dragonfly-navy-100 text-body">
                <Icon name="map-pin" size={16} className="text-dragonfly-orange-400" />
                {poi.name}
              </p>
              {poi.address && (
                <p className="mt-1 text-caption text-dragonfly-navy-400">{poi.address}</p>
              )}
              <p className="mt-1 text-caption font-mono text-dragonfly-navy-500">
                {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleBolt}
                className="flex items-center justify-center gap-2 rounded-xl bg-dragonfly-orange-500 px-4 py-3 font-semibold text-dragonfly-navy-950 transition-colors hover:bg-dragonfly-orange-400 active:scale-[0.99] min-h-[var(--touch-target)]"
              >
                <Icon name="car" size={19} />
                Open Bolt app — destination copied
              </button>
              <button
                type="button"
                onClick={handleMaps}
                className="flex items-center justify-center gap-2 rounded-xl border border-dragonfly-navy-700 px-4 py-3 font-semibold text-dragonfly-navy-200 transition-colors hover:bg-dragonfly-navy-800 active:scale-[0.99] min-h-[var(--touch-target)]"
              >
                <Icon name="compass" size={19} />
                Open in Google Maps
              </button>
            </div>

            <AnimatePresence>
              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-center text-caption font-medium text-dragonfly-orange-400"
                  role="status"
                >
                  ✓ Destination copied — paste it as your drop-off in Bolt
                </motion.p>
              )}
            </AnimatePresence>

            <p className="mt-3 text-center text-caption text-dragonfly-navy-500">
              Opens Bolt with your destination on the clipboard — paste it into &ldquo;Where
              to?&rdquo;. (Bolt doesn&apos;t let other apps pre-fill rides.)
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}