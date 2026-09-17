"use client";
import React, { useEffect } from "react";
import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convex/client";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    }
  }, []);

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}