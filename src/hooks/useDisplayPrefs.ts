"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  applyDisplayPrefs,
  DEFAULT_DISPLAY_PREFS,
  getDisplayPrefs,
  setDisplayPrefs,
  type DisplayPrefs,
} from "@/lib/utils/displayPrefs";

function subscribe(callback: () => void): () => void {
  window.addEventListener("mdf-display-prefs", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("mdf-display-prefs", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string {
  return JSON.stringify(getDisplayPrefs());
}

function getServerSnapshot(): string {
  return JSON.stringify({ largeText: false, reduceMotion: false, highContrast: false });
}

export function useDisplayPrefs(): {
  prefs: DisplayPrefs;
  update: (patch: Partial<DisplayPrefs>) => void;
  reset: () => void;
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const prefs = JSON.parse(snapshot) as DisplayPrefs;

  useEffect(() => {
    applyDisplayPrefs(prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  const update = useCallback(
    (patch: Partial<DisplayPrefs>) => {
      const next = { ...getDisplayPrefs(), ...patch };
      setDisplayPrefs(next);
      window.dispatchEvent(new Event("mdf-display-prefs"));
    },
    []
  );

  const reset = useCallback(() => {
    setDisplayPrefs({ ...DEFAULT_DISPLAY_PREFS });
    window.dispatchEvent(new Event("mdf-display-prefs"));
  }, []);

  return { prefs, update, reset };
}
