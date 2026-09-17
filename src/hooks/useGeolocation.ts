"use client";
import { useState, useEffect } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
        }),
      (err) =>
        setState((s) => ({
          ...s,
          error:
            err.code === 1
              ? "Location access denied — please enable in browser settings"
              : "Could not get location",
        })),
      { enableHighAccuracy: true, maximumAge: 30_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
