"use client";
import React from "react";
import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convex/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
