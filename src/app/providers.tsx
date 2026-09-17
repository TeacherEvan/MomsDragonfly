"use client";
import React, { useEffect, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ToastProvider, useNetworkToast } from "@/components/shell/Toast";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return null;
  }
  return new ConvexReactClient(url);
}

function NetworkStatus() {
  const { showOffline, showOnline } = useNetworkToast();
  const [wasOnline, setWasOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      if (!wasOnline) showOnline();
      setWasOnline(true);
    };
    const handleOffline = () => {
      showOffline();
      setWasOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOnline, showOffline, showOnline]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [convexClient] = useState(() => getConvexClient());

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    }
  }, []);

  if (!convexClient) {
    return (
      <ToastProvider>
        <NetworkStatus />
        {children}
      </ToastProvider>
    );
  }

  return (
    <ConvexProvider client={convexClient}>
      <ToastProvider>
        <NetworkStatus />
        {children}
      </ToastProvider>
    </ConvexProvider>
  );
}