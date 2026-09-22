"use client";
import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { shouldRecordPoint } from "@/lib/journal/stats";

/**
 * Automatic trip journal recorder — active once the trip start date has
 * passed. Samples the user's position (distance/interval policy in
 * `lib/journal/stats`) and stores points device-scoped via `saveLocation`.
 */
export function useTripJournal(): { tripActive: boolean } {
  const deviceId = getDeviceId();
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const saveLocation = useMutation(api.mutations.saveLocation);
  const lastSavedRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  const tripActive =
    !!prefs?.tripStartDate && Date.now() >= (prefs.tripStartDate ?? Number.POSITIVE_INFINITY);

  useEffect(() => {
    if (!tripActive) return;
    if (typeof window === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          now: Date.now(),
        };
        if (shouldRecordPoint(lastSavedRef.current, next)) {
          lastSavedRef.current = { lat: next.lat, lng: next.lng, timestamp: next.now };
          saveLocation({
            deviceId,
            lat: next.lat,
            lng: next.lng,
            accuracy: pos.coords.accuracy ?? 0,
          }).catch((err) => console.warn("Journal save failed:", err));
        }
      },
      (err) => console.warn("Journal geolocation:", err.message),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 30_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tripActive, deviceId, saveLocation]);

  return { tripActive };
}