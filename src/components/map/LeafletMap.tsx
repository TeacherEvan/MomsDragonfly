"use client";
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { NormalizedPOI } from "@/types";
import { POIMarker } from "./POIMarker";
import L from "leaflet";

if (typeof window !== "undefined") {
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

function AccessibleZoomControl() {
  const map = useMap();
  const zoomIn = () => map.setZoom(map.getZoom() + 1);
  const zoomOut = () => map.setZoom(map.getZoom() - 1);
  return (
    <div className="leaflet-control leaflet-bar" role="group" aria-label="Map zoom controls">
      <button
        type="button"
        onClick={zoomIn}
        className="leaflet-control-zoom-in"
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={zoomOut}
        className="leaflet-control-zoom-out"
        aria-label="Zoom out"
        title="Zoom out"
      >
        -
      </button>
    </div>
  );
}

interface LeafletMapProps {
  pois: NormalizedPOI[];
  center?: [number, number];
  onVerify: (placeId: string) => void;
}

export interface LeafletMapRef {
  panToPOI: (poi: NormalizedPOI) => void;
}

const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>((props, ref) => {
  const { pois, center, onVerify } = props;
  const defaultCenter: [number, number] = center ?? [13.7563, 100.5018];
  const mapRef = useRef<L.Map | null>(null);

  useImperativeHandle(ref, () => ({
    panToPOI: (poi: NormalizedPOI) => {
      const map = mapRef.current;
      if (!map) return;
      map.setView([poi.lat, poi.lng], 16, { animate: true });
    },
  }));

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        map.panBy([0, -50]);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        map.panBy([0, 50]);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        map.panBy([-50, 0]);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        map.panBy([50, 0]);
        e.preventDefault();
      } else if (e.key === "+" || e.key === "=") {
        map.setZoom(map.getZoom() + 1);
        e.preventDefault();
      } else if (e.key === "-") {
        map.setZoom(map.getZoom() - 1);
        e.preventDefault();
      }
    };

    map.getContainer().addEventListener("keydown", handleKeyDown);
    map.getContainer().setAttribute("tabIndex", "0");
    map.getContainer().setAttribute("role", "region");
    map.getContainer().setAttribute("aria-label", "Interactive map of nearby places");

    return () => {
      map.getContainer().removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const markers = useMemo(() => pois.map((poi) => (
    <Marker
      key={poi.placeId}
      position={[poi.lat, poi.lng]}
    >
      <Popup>
        <POIMarker poi={poi} onVerify={() => onVerify(poi.placeId)} />
      </Popup>
    </Marker>
  )), [pois, onVerify]);

  return (
    <MapContainer
      ref={mapRef}
      center={defaultCenter}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AccessibleZoomControl />
      {center && <RecenterMap center={center} />}
      {markers}
    </MapContainer>
  );
});

LeafletMap.displayName = "LeafletMap";

export default LeafletMap;