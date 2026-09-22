"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import type { NormalizedPOI } from "@/types";
import { POIMarker } from "./POIMarker";
import L from "leaflet";

/**
 * Self-hosted vector pin — no external image dependency (the previous default
 * Leaflet marker loaded PNGs from unpkg.com, which broke on flaky networks and
 * showed up as "Marker" broken-image placeholders on the map).
 */
const PIN_SVG = `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14 1C7 1 1.5 6.5 1.5 13.5c0 9.5 12.5 24.5 12.5 24.5S26.5 23 26.5 13.5C26.5 6.5 21 1 14 1z" fill="#319795" stroke="#e6fffa" stroke-width="1.5"/><circle cx="14" cy="13.5" r="4.5" fill="#061416"/><circle cx="14" cy="13.5" r="2" fill="#4fd1c5"/></svg>`;

const MAX_TILE_RETRIES = 3;

/** Calm dark placeholder shown only when a tile keeps failing (instead of a broken-image icon). */
const TILE_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='256' height='256' fill='#0a1f26'/><rect x='0.5' y='0.5' width='255' height='255' fill='none' stroke='#112d3a'/></svg>"
  );

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

/** Fits the map to a recorded trail (journal view). */
function FitTrail({ trail }: { trail: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (trail.length < 2) return;
    const bounds = L.latLngBounds(trail.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }, [trail, map]);
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
  /** Optional: request a ride to a POI (opens the ride sheet). */
  onRequestRide?: (poi: NormalizedPOI) => void;
  /** Chronological trail of [lat, lng] pairs to draw (journal view). */
  trail?: Array<[number, number]>;
}

export interface LeafletMapRef {
  panToPOI: (poi: NormalizedPOI) => void;
}

const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>((props, ref) => {
  const { pois, center, onVerify, onRequestRide, trail } = props;
  const defaultCenter: [number, number] = center ?? [13.7563, 100.5018];
  const mapRef = useRef<L.Map | null>(null);

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: PIN_SVG,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -44],
      }),
    []
  );

  const trailStartIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="6.5" fill="#0d9488" stroke="#e6fffa" stroke-width="2.5"/></svg>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    []
  );

  const trailEndIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#f97316" stroke="#fff7ed" stroke-width="2.5"/><circle cx="12" cy="12" r="3" fill="#fff7ed"/></svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    []
  );

  /**
   * Tile resilience: retry failed tiles up to MAX_TILE_RETRIES with backoff
   * (Leaflet never retries on its own, leaving broken images), then fall back
   * to a calm dark placeholder tile.
   */
  const handleTileError = useCallback((e: L.TileErrorEvent) => {
    const tile = e.tile as (HTMLImageElement & { dataset: DOMStringMap }) | undefined;
    if (!tile) return;

    const retries = Number(tile.dataset.retry ?? "0");
    if (retries >= MAX_TILE_RETRIES) {
      if (!tile.dataset.placeholder) {
        tile.dataset.placeholder = "1";
        tile.src = TILE_PLACEHOLDER;
      }
      return;
    }
    tile.dataset.retry = String(retries + 1);
    const originalSrc = tile.dataset.originalSrc ?? tile.src;
    tile.dataset.originalSrc = originalSrc;
    window.setTimeout(() => {
      const sep = originalSrc.includes("?") ? "&" : "?";
      tile.src = `${originalSrc}${sep}r=${Date.now()}`;
    }, 1200 * (retries + 1));
  }, []);

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

  const markers = useMemo(
    () =>
      pois.map((poi) => (
        <Marker key={poi.placeId} position={[poi.lat, poi.lng]} icon={pinIcon}>
          <Popup>
            <POIMarker
              poi={poi}
              onVerify={() => onVerify(poi.placeId)}
              onRequestRide={onRequestRide ? () => onRequestRide(poi) : undefined}
            />
          </Popup>
        </Marker>
      )),
    [pois, onVerify, onRequestRide, pinIcon]
  );

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
        eventHandlers={{ tileerror: handleTileError }}
      />
      <AccessibleZoomControl />
      {center && <RecenterMap center={center} />}
      {trail && trail.length > 1 && (
        <>
          <FitTrail trail={trail} />
          <Polyline
            positions={trail}
            pathOptions={{ color: "#fb923c", weight: 4, opacity: 0.8 }}
          />
          <Marker position={trail[0]} icon={trailStartIcon} />
          <Marker position={trail[trail.length - 1]} icon={trailEndIcon} />
        </>
      )}
      {markers}
    </MapContainer>
  );
});

LeafletMap.displayName = "LeafletMap";

export default LeafletMap;