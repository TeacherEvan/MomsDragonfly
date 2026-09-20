"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [takeOff, setTakeOff] = useState(false);
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleClick = () => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }
    setTakeOff(true);
    setTimeout(() => onComplete(), 400);
  };

  return (
    <div
      data-testid="splash-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      <div
        data-testid="splash-background"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/intro.jpg')" }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6 pointer-events-none">
        <div
          data-testid="splash-dragonfly"
          className={cn(
            "transition-all duration-400 ease-out",
            takeOff && "scale-150 opacity-0"
          )}
        >
          <DragonflySilhouette size="xl" animated={!prefersReducedMotion} decorative data-testid="dragonfly-silhouette" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-dragonfly-teal-400 via-dragonfly-cyan-400 to-dragonfly-emerald-400 bg-clip-text text-transparent animate-iridescent-shift">
          Mom&apos;s Dragonfly
        </h1>
        <p className="text-dragonfly-navy-300 text-sm md:text-base">Your travel companion</p>
      </div>
    </div>
  );
}