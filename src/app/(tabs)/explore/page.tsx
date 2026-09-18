"use client";
import React, { useState, useEffect, useRef } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapView } from "@/components/map/MapView";
import { POIList } from "@/components/poi/POIList";
import { POIFilter } from "@/components/poi/POIFilter";
import { IntroVideo } from "@/components/onboarding/IntroVideo";
import type { NormalizedPOI } from "@/types";
import type { LeafletMapRef } from "@/components/map/LeafletMap";
import { haversine } from "@/lib/utils/geo";

const MOCK_POIS: NormalizedPOI[] = [
  {
    id: "poi-1",
    placeId: "mock-restroom-1",
    source: "osm",
    name: "Clean Public Restroom (Accessible)",
    category: "toilets",
    lat: 13.7565,
    lng: 100.502,
    address: "Ratchadamnoen Klang Ave",
    verifiedCount: 14,
  },
  {
    id: "poi-2",
    placeId: "mock-food-1",
    source: "google",
    name: "Golden Dragon Noodles & Dim Sum",
    category: "restaurant",
    lat: 13.757,
    lng: 100.503,
    address: "Old Town Market Alley",
    rating: 4.8,
    openNow: true,
    verifiedCount: 29,
  },
  {
    id: "poi-3",
    placeId: "mock-pharmacy-1",
    source: "osm",
    name: "24/7 Community Pharmacy",
    category: "pharmacy",
    lat: 13.7558,
    lng: 100.501,
    address: "Main Boulevard",
    verifiedCount: 8,
  },
  {
    id: "poi-4",
    placeId: "mock-attraction-1",
    source: "google",
    name: "Heritage Clock Tower & Garden",
    category: "attraction",
    lat: 13.758,
    lng: 100.504,
    address: "Civic Plaza",
    rating: 4.6,
    openNow: true,
    verifiedCount: 19,
  },
];

export default function ExplorePage() {
  const { lat, lng, error: geoError } = useGeolocation();
  const [category, setCategory] = useState("all");
  const [showIntro, setShowIntro] = useState(true);
  const [pois, setPois] = useState<NormalizedPOI[]>(MOCK_POIS);
  const mapRef = useRef<LeafletMapRef>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("mdf_intro_dismissed");
      if (dismissed) setShowIntro(false);
    }
  }, []);

  const dismissIntro = () => {
    setShowIntro(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("mdf_intro_dismissed", "true");
    }
  };

  const handleVerify = (placeId: string) => {
    setPois((prev) =>
      prev.map((p) =>
        p.placeId === placeId
          ? { ...p, verifiedCount: p.verifiedCount + 1 }
          : p
      )
    );
  };

  const handleShowOnMap = (poi: NormalizedPOI) => {
    mapRef.current?.panToPOI(poi);
  };

  const computedPois = pois
    .map((p) => {
      if (lat && lng) {
        return {
          ...p,
          distanceMetres: haversine(lat, lng, p.lat, p.lng),
        };
      }
      return p;
    })
    .filter((p) => (category === "all" ? true : p.category === category))
    .sort((a, b) => (a.distanceMetres ?? 0) - (b.distanceMetres ?? 0));

  const mapCenter: [number, number] =
    lat && lng ? [lat, lng] : [13.7563, 100.5018];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900">Explore</h1>
      {showIntro && <IntroVideo onDismiss={dismissIntro} />}

      {geoError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>⚠️ {geoError}</span>
          <span className="font-semibold underline">Using default area</span>
        </div>
      )}

      <MapView
        ref={mapRef}
        pois={computedPois}
        center={mapCenter}
        onVerify={handleVerify}
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-gray-900 text-sm md:text-base">
            Nearby Places
          </h2>
          <span className="text-xs text-gray-500 font-medium">
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
