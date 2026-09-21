"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/app/providers";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapView } from "@/components/map/MapView";
import { POIList } from "@/components/poi/POIList";
import { POIFilter } from "@/components/poi/POIFilter";
import { IntroVideoModal } from "@/components/onboarding/IntroVideoModal";
import type { NormalizedPOI } from "@/types";
import type { LeafletMapRef } from "@/components/map/LeafletMap";
import { haversine } from "@/lib/utils/geo";
import { getDeviceId } from "@/lib/utils/deviceId";

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018];

export default function ExplorePage() {
  const { lat, lng, error: geoError } = useGeolocation();
  const [category, setCategory] = useState("all");
  const [showIntroImage, setShowIntroImage] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastFetchCategory, setLastFetchCategory] = useState<string | null>(null);
  const mapRef = useRef<LeafletMapRef>(null);
  const deviceId = getDeviceId();

  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const poisQuery = useQuery(api.queries.poiQuery, { deviceId, category: category === "all" ? "restaurant" : category });
  const fetchNearbyAct = useAction(api.actions.fetchNearby);
  const fetchOverpassAct = useAction(api.actions.fetchOverpassNearby);
  const fetchEntertainmentAct = useAction(api.actions.fetchEntertainment);
  const verifyPOIMut = useMutation(api.mutations.verifyPOI);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleIntroImageClick = () => {
    setShowIntroImage(false);
    setShowVideoModal(true);
  };

  const handleVideoComplete = () => {
    setShowVideoModal(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("mdf_intro_seen", Date.now().toString());
    }
  };

  const fetchPoisForCategory = useCallback(async (cat: string) => {
    if (!lat || !lng || cat === "all") return;
    if (lastFetchCategory === cat) return;
    setLastFetchCategory(cat);

    const radius = prefs?.defaultRadius ?? 1000;

    if (cat === "entertainment") {
      await fetchEntertainmentAct({ deviceId, lat, lng, radius });
    } else if (["toilets", "pharmacy", "park"].includes(cat)) {
      await fetchOverpassAct({ deviceId, lat, lng, radius });
    } else {
      await fetchNearbyAct({ deviceId, lat, lng, radius, category: cat });
    }
  }, [lat, lng, lastFetchCategory, deviceId, prefs?.defaultRadius, fetchEntertainmentAct, fetchOverpassAct, fetchNearbyAct]);

  useEffect(() => {
    if (lat && lng) {
      const initialCat = category === "all" ? "restaurant" : category;
      if (initialCat !== "all" && initialCat !== lastFetchCategory) {
        fetchPoisForCategory(initialCat);
      }
    }
  }, [lat, lng, category, fetchPoisForCategory, lastFetchCategory]);

  useEffect(() => {
    if (category !== "all" && lat && lng) {
      fetchPoisForCategory(category);
    }
  }, [category, lat, lng, fetchPoisForCategory]);

  const handleVerify = useCallback((placeId: string) => {
    verifyPOIMut({ placeId, deviceId });
  }, [verifyPOIMut, deviceId]);

  const handleShowOnMap = useCallback((poi: NormalizedPOI) => {
    mapRef.current?.panToPOI(poi);
  }, []);

  interface ComputedPOI extends NormalizedPOI {
    id: string;
    distanceMetres?: number;
  }

  const computedPois = useMemo(() => {
    const rawPois = (poisQuery ?? []) as Array<{ _id: string; placeId: string; source: "google" | "osm" | "brave"; name: string; category: string; lat: number; lng: number; address?: string; rating?: number; phone?: string; openNow?: boolean; verifiedCount: number; fetchedAt: number; deviceIds: string[] }>;
    const result = rawPois
      .map((p): ComputedPOI => {
        if (lat && lng) {
          return {
            ...p,
            id: p._id,
            distanceMetres: haversine(lat, lng, p.lat, p.lng),
          };
        }
        return { ...p, id: p._id };
      })
      .filter((p) => (category === "all" ? true : p.category === category))
      .sort((a, b) => (a.distanceMetres ?? 0) - (b.distanceMetres ?? 0));
    return result;
  }, [poisQuery, lat, lng, category]);

  const mapCenter: [number, number] = lat && lng ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <h1 className="text-h1 font-bold text-dragonfly-navy-50">Explore</h1>
      {mounted && showIntroImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/intro.jpg')" }}
          onClick={handleIntroImageClick}
          aria-label="Tap to play intro video"
        >
          <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-dragonfly-gold-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-dragonfly-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-dragonfly-navy-300 text-sm md:text-base">Tap to play intro</p>
          </div>
        </div>
      )}
      {mounted && showVideoModal && <IntroVideoModal onComplete={handleVideoComplete} />}

      {geoError && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-caption text-amber-400 flex items-center justify-between">
          <span>⚠️ {geoError}</span>
          <span className="font-semibold underline">Using default area</span>
        </div>
      )}

      {!geoError ? (
        <MapView
          ref={mapRef}
          pois={computedPois}
          center={mapCenter}
          onVerify={handleVerify}
        />
      ) : (
        <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-strong border border-neutral-800 bg-surface-900/80 flex flex-col items-center justify-center text-center px-6">
          <span className="text-4xl mb-3" aria-hidden="true">🗺️</span>
          <p className="font-semibold text-neutral-300 mb-2">Map unavailable</p>
          <p className="text-sm text-neutral-500 mb-4 max-w-xs">
            Enable location access to see nearby places on the map, or use the list below.
          </p>
          <button
            onClick={() => {
              if (typeof window !== "undefined" && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  () => window.location.reload(),
                  () => alert("Location permission still denied. Enable in browser settings to use the map.")
                );
              }
            }}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-neutral-950 rounded-lg font-semibold text-sm transition-colors min-h-[var(--touch-target)]"
          >
            Retry location access
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-dragonfly-navy-50 text-sm md:text-base">
            Nearby Places
          </h2>
          <span className="text-caption text-dragonfly-navy-400 font-medium">
            {computedPois.length} discovered
          </span>
        </div>
        <POIFilter category={category} onChange={setCategory} />
      </div>

      <POIList
        pois={computedPois}
        onVerify={handleVerify}
        onShowOnMap={handleShowOnMap}
        category={category}
      />
    </div>
  );
}