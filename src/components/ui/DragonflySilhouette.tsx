"use client";
import React, { useId } from "react";
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

export function DragonflySilhouette({
  size = "md",
  className,
  animated = true,
  decorative = false,
  "data-testid": testId,
}: DragonflySilhouetteProps) {
  const id = useId();
  const { width, height } = sizes[size];
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <div
      className={cn(
        shouldAnimate && "animate-float",
        className
      )}
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
          <linearGradient id={`bodyGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonflyPalette.teal[500]} />
            <stop offset="50%" stopColor={dragonflyPalette.teal[600]} />
            <stop offset="100%" stopColor={dragonflyPalette.teal[700]} />
          </linearGradient>
          <linearGradient id={`wingGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonflyPalette.cyan[300]} stopOpacity="0.4" />
            <stop offset="50%" stopColor={dragonflyPalette.teal[400]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={dragonflyPalette.emerald[400]} stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`eyeGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonflyPalette.gold[100]} />
            <stop offset="100%" stopColor={dragonflyPalette.gold[300]} />
          </linearGradient>
        </defs>

        <ellipse cx="32" cy="48" rx="2" ry="3" fill={`url(#bodyGrad-${id})`} />
        <ellipse cx="32" cy="42" rx="2.5" ry="3" fill={`url(#bodyGrad-${id})`} />
        <ellipse cx="32" cy="36" rx="3" ry="3" fill={`url(#bodyGrad-${id})`} />

        <ellipse cx="32" cy="28" rx="4" ry="4" fill={`url(#bodyGrad-${id})`} />

        <ellipse cx="32" cy="20" rx="3.5" ry="3.5" fill={`url(#bodyGrad-${id})`} />

        <ellipse cx="28" cy="18" rx="1.5" ry="1.5" fill={`url(#eyeGrad-${id})`} />
        <ellipse cx="36" cy="18" rx="1.5" ry="1.5" fill={`url(#eyeGrad-${id})`} />
        <ellipse cx="28" cy="18" rx="0.75" ry="0.75" fill={dragonflyPalette.navy[900]} />
        <ellipse cx="36" cy="18" rx="0.75" ry="0.75" fill={dragonflyPalette.navy[900]} />

        <g className={cn(shouldAnimate && "animate-wing-shimmer")}>
          <ellipse cx="12" cy="24" rx="8" ry="6" fill={`url(#wingGrad-${id})`}
            transform="rotate(-25 12 24)" stroke={dragonflyPalette.teal[700]} strokeWidth="0.2" strokeOpacity="0.4" />
          <ellipse cx="52" cy="24" rx="8" ry="6" fill={`url(#wingGrad-${id})`}
            transform="rotate(25 52 24)" stroke={dragonflyPalette.teal[700]} strokeWidth="0.2" strokeOpacity="0.4" />
        </g>

        <g className={cn(shouldAnimate && "animate-wing-shimmer")} style={{ animationDelay: "0.3s" }}>
          <ellipse cx="16" cy="34" rx="6" ry="4.5" fill={`url(#wingGrad-${id})`}
            transform="rotate(-35 16 34)" stroke={dragonflyPalette.teal[700]} strokeWidth="0.2" strokeOpacity="0.4" />
          <ellipse cx="48" cy="34" rx="6" ry="4.5" fill={`url(#wingGrad-${id})`}
            transform="rotate(35 48 34)" stroke={dragonflyPalette.teal[700]} strokeWidth="0.2" strokeOpacity="0.4" />
        </g>

        <g stroke={dragonflyPalette.navy[900]} strokeWidth="0.5" fill="none" opacity="0.6">
          <line x1="26" y1="30" x2="20" y2="38" />
          <line x1="38" y1="30" x2="44" y2="38" />
          <line x1="25" y1="34" x2="22" y2="42" />
          <line x1="39" y1="34" x2="42" y2="42" />
        </g>

        <g stroke={dragonflyPalette.navy[900]} strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.6">
          <path d="M30 16 Q26 10 28 6" />
          <path d="M34 16 Q38 10 36 6" />
        </g>
      </svg>
    </div>
  );
}