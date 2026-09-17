"use client";
import { useEffect, useState } from "react";

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white px-4 py-3 flex items-center gap-3 shadow-md">
      <p className="flex-1 text-sm font-medium">🔄 Update available</p>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 px-3 py-1.5 bg-white text-amber-700 rounded-lg text-sm font-semibold min-h-[44px]"
      >
        Refresh
      </button>
    </div>
  );
}