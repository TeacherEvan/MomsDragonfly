"use client";
import React, { forwardRef } from "react";
import dynamic from "next/dynamic";
import type { NormalizedPOI } from "@/types";
import type { LeafletMapRef } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-900/80 flex items-center justify-center text-dragonfly-navy-400 text-sm animate-pulse">
      Loading interactive map...
    </div>
  ),
});

interface MapViewProps {
  pois: NormalizedPOI[];
  center?: [number, number];
  onVerify: (placeId: string) => void;
  onRequestRide?: (poi: NormalizedPOI) => void;
  trail?: Array<[number, number]>;
}

export const MapView = forwardRef<LeafletMapRef, MapViewProps>(
  ({ pois, center, onVerify, onRequestRide, trail }, ref) => {
    return (
      <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-strong border border-dragonfly-navy-800 bg-surface-900">
        <LeafletMap
          ref={ref}
          pois={pois}
          center={center}
          onVerify={onVerify}
          onRequestRide={onRequestRide}
          trail={trail}
        />
      </div>
    );
  }
);

MapView.displayName = "MapView";
