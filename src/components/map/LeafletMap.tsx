"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { NormalizedPOI } from "@/types";
import { POIMarker } from "./POIMarker";
import L from "leaflet";

if (typeof window !== "undefined") {
  // Leaflet default icon fix for Next.js SSR
  delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface LeafletMapProps {
  pois: NormalizedPOI[];
  center?: [number, number];
  onVerify: (placeId: string) => void;
}

export default function LeafletMap({ pois, center, onVerify }: LeafletMapProps) {
  const defaultCenter: [number, number] = center ?? [13.7563, 100.5018]; // Default Bangkok or user location

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {center && <RecenterMap center={center} />}
      {pois.map((poi) => (
        <Marker key={poi.placeId} position={[poi.lat, poi.lng]}>
          <Popup>
            <POIMarker poi={poi} onVerify={() => onVerify(poi.placeId)} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
