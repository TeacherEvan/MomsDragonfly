"use client";
import React, { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { dragonflyPalette } from "@/lib/theme/dragonfly";

const sizes = {
  sm: { width: 24, height: 24 },
  md: { width: 40, height: 40 },
  lg: { width: 64, height: 64 },
  xl: { width: 128, height: 128 },
} as const;

interface DragonflySilhouetteProps {
  size?: keyof typeof sizes;
  className?: string;
  animated?: boolean;
  decorative?: boolean;
  "data-testid"?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function DragonflySilhouette({
  size = "md",
  className,
  animated = true,
  decorative = false,
  "data-testid": testId,
}: DragonflySilhouetteProps) {
  const id = useId();
  const { width, height } = sizes[size];
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const shouldAnimate = animated && !reducedMotion;

  // Left half of the mark. Mirrored with translate(64,0) scale(-1,1) for perfect symmetry.
  const leftHalf = (
    <>
      {/* forewing — longer, narrower */}
      <path
        d="M28.3 16.4 Q15.5 8.2 3.2 9.4 Q14.6 15.4 27.6 20 Z"
        fill={`url(#wingFore-${id})`}
        stroke={`url(#wingEdge-${id})`}
        strokeWidth="0.45"
      />
      {/* hindwing — shorter, rounder */}
      <path
        d="M28.4 21.2 Q16.4 18.2 7.1 23.2 Q16.2 28.2 27.7 25.4 Z"
        fill={`url(#wingHind-${id})`}
        stroke={`url(#wingEdge-${id})`}
        strokeWidth="0.45"
      />
      {/* wing veins */}
      <g
        fill="none"
        stroke={dragonflyPalette.cyan[200]}
        strokeWidth="0.35"
        strokeLinecap="round"
        opacity="0.5"
      >
        <path d="M27.4 18.2 Q16 11.6 4.2 9.9" />
        <path d="M20.8 13.6 20.2 16.2" />
        <path d="M12.6 10.7 12.2 13.2" />
        <path d="M27.2 23.2 Q16.5 21.4 8.2 23.2" />
        <path d="M19.4 21.6 18.8 25" />
      </g>
      {/* compound eye + gold glint */}
      <ellipse
        cx="28.9"
        cy="10.6"
        rx="2.5"
        ry="2.9"
        fill={`url(#eyeGrad-${id})`}
        transform="rotate(-16 28.9 10.6)"
      />
      <ellipse cx="28.1" cy="9.4" rx="0.85" ry="1.05" fill={`url(#glintGrad-${id})`} />
      {/* antenna */}
      <path
        d="M30.8 7.4 C30.1 5.8 29.3 4.8 28.1 4.1"
        fill="none"
        stroke={dragonflyPalette.teal[300]}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.75"
      />
    </>
  );

  return (
    <div
      className={cn(shouldAnimate && "animate-float", className)}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Dragonfly"}
      data-testid={testId}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={decorative ? "true" : undefined}
      >
        <defs>
          <linearGradient id={`abdomenGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.teal[300]} />
            <stop offset="45%" stopColor={dragonflyPalette.teal[500]} />
            <stop offset="100%" stopColor={dragonflyPalette.teal[700]} />
          </linearGradient>
          <linearGradient id={`thoraxGrad-${id}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.teal[400]} />
            <stop offset="100%" stopColor={dragonflyPalette.teal[700]} />
          </linearGradient>
          <linearGradient id={`headGrad-${id}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.teal[300]} />
            <stop offset="100%" stopColor={dragonflyPalette.teal[600]} />
          </linearGradient>
          <linearGradient id={`eyeGrad-${id}`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.gold[300]} />
            <stop offset="100%" stopColor={dragonflyPalette.gold[500]} />
          </linearGradient>
          <linearGradient id={`glintGrad-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.gold[100]} />
            <stop offset="100%" stopColor={dragonflyPalette.gold[300]} />
          </linearGradient>
          <linearGradient id={`wingFore-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.cyan[300]} stopOpacity="0.42" />
            <stop offset="55%" stopColor={dragonflyPalette.teal[300]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={dragonflyPalette.emerald[300]} stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id={`wingHind-${id}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.emerald[300]} stopOpacity="0.34" />
            <stop offset="50%" stopColor={dragonflyPalette.teal[400]} stopOpacity="0.26" />
            <stop offset="100%" stopColor={dragonflyPalette.cyan[300]} stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id={`wingEdge-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={dragonflyPalette.cyan[300]} stopOpacity="0.75" />
            <stop offset="50%" stopColor={dragonflyPalette.teal[400]} stopOpacity="0.45" />
            <stop offset="100%" stopColor={dragonflyPalette.emerald[400]} stopOpacity="0.55" />
          </linearGradient>
          <filter id={`glow-${id}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="1.5" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#glow-${id})`}>
          <g className={cn(shouldAnimate && "animate-wing-shimmer")}>{leftHalf}</g>
          <g
            className={cn(shouldAnimate && "animate-wing-shimmer")}
            style={{ animationDelay: "0.35s" }}
            transform="translate(64 0) scale(-1 1)"
          >
            {leftHalf}
          </g>
        </g>

        {/* abdomen: tapered teardrop with segments */}
        <g>
          <path
            d="M29.2 21.5 C27.6 26.5 27.5 34 28.6 41.5 C29.4 47 30.6 53.5 32 58.4 C33.4 53.5 34.6 47 35.4 41.5 C36.5 34 36.4 26.5 34.8 21.5 C34.1 20.1 29.9 20.1 29.2 21.5 Z"
            fill={`url(#abdomenGrad-${id})`}
          />
          <g
            fill="none"
            stroke={dragonflyPalette.navy[900]}
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.42"
          >
            <path d="M28.3 28.5 Q32 29.7 35.7 28.5" />
            <path d="M28.2 33 Q32 34.2 35.8 33" />
            <path d="M28.35 37.5 Q32 38.7 35.65 37.5" />
            <path d="M28.7 42 Q32 43.2 35.3 42" />
            <path d="M29.6 46.5 Q32 47.7 34.4 46.5" />
            <path d="M30.6 51 Q32 52 33.4 51" />
          </g>
        </g>

        {/* thorax + head */}
        <path
          d="M32 13.2 C37.3 13.2 39.5 17.6 39.3 21.4 C39.1 24.9 36.7 26.8 32 26.8 C27.3 26.8 24.9 24.9 24.7 21.4 C24.5 17.6 26.7 13.2 32 13.2 Z"
          fill={`url(#thoraxGrad-${id})`}
        />
        <path
          d="M32 6.8 C35.1 6.8 36.8 8.9 36.6 11.4 C36.4 13.7 34.5 14.8 32 14.8 C29.5 14.8 27.6 13.7 27.4 11.4 C27.2 8.9 28.9 6.8 32 6.8 Z"
          fill={`url(#headGrad-${id})`}
        />
      </svg>
    </div>
  );
}