"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/app/providers";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapView } from "@/components/map/MapView";
import { POIList } from "@/components/poi/POIList";
import type { FetchPhase } from "@/components/poi/POIList";
import { POIFilter } from "@/components/poi/POIFilter";
import { IntroVideoModal } from "@/components/onboarding/IntroVideoModal";
import { SplashScreen } from "@/components/onboarding/SplashScreen";
import { OnboardingSlides } from "@/components/onboarding/OnboardingSlides";
import type { NormalizedPOI } from "@/types";
import type { LeafletMapRef } from "@/components/map/LeafletMap";
import { haversine } from "@/lib/utils/geo";
import { getDeviceId } from "@/lib/utils/deviceId";
import { Icon } from "@/components/ui/Icon";

type OnboardingStep = "splash" | "video" | "slides" | "done";

/** Categories fetched in parallel on first load so "All" shows a rich mix. */
const CORE_CATEGORIES = ["restaurant", "park", "attraction"] as const;

export default function ExplorePage() {
  const { lat, lng, error: geoError } = useGeolocation();
  const [category, setCategory] = useState("all");
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("splash");
  const [mounted, setMounted] = useState(false);
  const [fetchPhases, setFetchPhases] = useState<Record<string, FetchPhase>>({});
  const mapRef = useRef<LeafletMapRef>(null);
  const fetchedRef = useRef<Set<string>>(new Set());
  const deviceId = getDeviceId();

  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const poisQuery = useQuery(api.queries.poiQuery, { deviceId, category });
  const fetchNearbyAct = useAction(api.actions.fetchNearby);
  const fetchOverpassAct = useAction(api.actions.fetchOverpassNearby);
  const fetchEntertainmentAct = useAction(api.actions.fetchEntertainment);
  const verifyPOIMut = useMutation(api.mutations.verifyPOI);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && localStorage.getItem("mdf_intro_seen")) {
      setOnboardingStep("done");
    }
  }, []);

  const handleSplashComplete = () => {
    // The splash shows on every cold start; the full intro (video + slides)
    // only plays the first time — after that, straight into the app.
    const seen =
      typeof window !== "undefined" && localStorage.getItem("mdf_intro_seen");
    setOnboardingStep(seen ? "done" : "video");
  };

  const handleVideoComplete = () => {
    setOnboardingStep("slides");
    if (typeof window !== "undefined") {
      localStorage.setItem("mdf_intro_seen", Date.now().toString());
    }
  };

  const handleSlidesComplete = () => {
    setOnboardingStep("done");
  };

  const fetchPoisForCategory = useCallback(
    async (cat: string, force = false) => {
      if (!lat || !lng || cat === "all") return;
      if (!force && fetchedRef.current.has(cat)) return;
      setFetchPhases((s) => ({ ...s, [cat]: "loading" }));
      const radius = prefs?.defaultRadius ?? 1000;
      try {
        let result: { count?: number; mock?: boolean; cached?: boolean } | undefined;
        if (cat === "toilets") {
          result = await fetchOverpassAct({ deviceId, lat, lng, radius });
        } else if (cat === "entertainment") {
          result = await fetchEntertainmentAct({ deviceId, lat, lng, radius });
        } else {
          result = await fetchNearbyAct({ deviceId, lat, lng, radius, category: cat });
        }
        fetchedRef.current.add(cat);
        const empty = result?.mock === true || result?.count === 0;
        setFetchPhases((s) => ({ ...s, [cat]: empty ? "empty" : "ready" }));
      } catch (err) {
        console.warn("POI fetch failed:", cat, err);
        setFetchPhases((s) => ({ ...s, [cat]: "error" }));
      }
    },
    [
      lat,
      lng,
      deviceId,
      prefs?.defaultRadius,
      fetchNearbyAct,
      fetchOverpassAct,
      fetchEntertainmentAct,
    ]
  );

  // Initial rich load: core categories in parallel
  useEffect(() => {
    if (!lat || !lng) return;
    CORE_CATEGORIES.forEach((c) => {
      void fetchPoisForCategory(c);
    });
  }, [lat, lng, fetchPoisForCategory]);

  // Fetch when the user selects a category
  useEffect(() => {
    if (category !== "all" && lat && lng) {
      void fetchPoisForCategory(category);
    }
  }, [category, lat, lng, fetchPoisForCategory]);

  const handleRetry = useCallback(() => {
    if (category === "all") {
      CORE_CATEGORIES.forEach((c) => void fetchPoisForCategory(c, true));
    } else {
      void fetchPoisForCategory(category, true);
    }
  }, [category, fetchPoisForCategory]);

  const handleVerify = useCallback(
    (placeId: string) => {
      verifyPOIMut({ placeId, deviceId });
    },
    [verifyPOIMut, deviceId]
  );

  const handleShowOnMap = useCallback((poi: NormalizedPOI) => {
    mapRef.current?.panToPOI(poi);
  }, []);

  interface ComputedPOI extends NormalizedPOI {
    id: string;
    distanceMetres?: number;
  }

  const computedPois = useMemo(() => {
    const rawPois = (poisQuery ?? []) as Array<{
      _id: string;
      placeId: string;
      source: "google" | "osm" | "brave";
      name: string;
      category: string;
      lat: number;
      lng: number;
      address?: string;
      rating?: number;
      phone?: string;
      openNow?: boolean;
      verifiedCount: number;
      fetchedAt: number;
      deviceIds: string[];
    }>;
    return rawPois
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
  }, [poisQuery, lat, lng, category]);

  const mapCenter = lat && lng ? [lat, lng] : null;
  const activePhase: FetchPhase = fetchPhases[category] ?? "idle";

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      {/* Onboarding Overlay */}
      {mounted && onboardingStep !== "done" && (
        <>
          {onboardingStep === "splash" && (
            <SplashScreen onComplete={handleSplashComplete} />
          )}
          {onboardingStep === "video" && (
            <IntroVideoModal onComplete={handleVideoComplete} />
          )}
          {onboardingStep === "slides" && (
            <OnboardingSlides onFinish={handleSlidesComplete} />
          )}
        </>
      )}

      {onboardingStep === "done" && (
        <>
          <h1 className="text-h1 font-bold text-dragonfly-navy-50">Explore</h1>

          {geoError && (
            <div className="p-3 bg-dragonfly-gold-500/15 border border-dragonfly-gold-500/30 rounded-xl text-caption text-dragonfly-gold-400 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="alert" size={16} className="text-dragonfly-gold-400" />
                {geoError}
              </span>
              <span className="font-semibold underline">Using default area</span>
            </div>
          )}

          {lat && lng && !geoError ? (
            <MapView
              ref={mapRef}
              pois={computedPois}
              center={mapCenter as [number, number]}
              onVerify={handleVerify}
            />
          ) : (
            <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-strong border border-dragonfly-navy-700 bg-dragonfly-navy-900/80 flex flex-col items-center justify-center text-center px-6">
              <span className="mb-3 text-dragonfly-navy-500" aria-hidden="true">
                <Icon name="map-pin" size={40} />
              </span>
              <p className="font-semibold text-dragonfly-navy-300 mb-2">Map unavailable</p>
              <p className="text-sm text-dragonfly-navy-500 mb-4 max-w-xs">
                Enable location access to see nearby places on the map, or use the list below.
              </p>
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      () => window.location.reload(),
                      () =>
                        alert(
                          "Location permission still denied. Enable in browser settings to use the map."
                        )
                    );
                  }
                }}
                className="px-4 py-2 bg-dragonfly-teal-500 hover:bg-dragonfly-teal-400 text-dragonfly-navy-950 rounded-lg font-semibold text-sm transition-colors min-h-[var(--touch-target)]"
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
            phase={activePhase}
            onRetry={handleRetry}
          />
        </>
      )}
    </div>
  );
}
