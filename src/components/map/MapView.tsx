"use client";
import React from "react";
import dynamic from "next/dynamic";
import type { NormalizedPOI } from "@/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm animate-pulse">
      Loading interactive map...
    </div>
  ),
});

interface MapViewProps {
  pois: NormalizedPOI[];
  center?: [number, number];
  onVerify: (placeId: string) => void;
}

export function MapView({ pois, center, onVerify }: MapViewProps) {
  return (
    <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-inner border border-gray-200">
      <LeafletMap pois={pois} center={center} onVerify={onVerify} />
    </div>
  );
}
