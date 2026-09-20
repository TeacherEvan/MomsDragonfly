"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

interface DragonflyBackgroundProps {
  mode?: "ambient" | "immersive";
  children: React.ReactNode;
  className?: string;
}

export function DragonflyBackground({
  mode = "ambient",
  children,
  className,
}: DragonflyBackgroundProps) {
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldAnimate = !prefersReducedMotion && mounted;

  return (
    <div className={cn("relative min-h-screen bg-wing-pattern", className)}>
      {mode === "ambient" && (
        <div className={cn(
          "fixed top-8 right-8 pointer-events-none z-10",
          shouldAnimate && "animate-float"
        )}>
          <DragonflySilhouette size="md" animated={shouldAnimate} decorative data-testid="dragonfly-silhouette" />
        </div>
      )}
      {children}
    </div>
  );
}