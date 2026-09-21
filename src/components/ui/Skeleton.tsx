"use client";
import React from "react";
import { motion } from "framer-motion";
import { dragonflyPalette } from "@/lib/theme/dragonfly";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "budget-ring";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const baseStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, ${dragonflyPalette.navy[800]} 25%, ${dragonflyPalette.navy[700]} 50%, ${dragonflyPalette.navy[800]} 75%)`,
    backgroundSize: "200% 100%",
    borderRadius: variant === "circular" ? "9999px" : variant === "text" ? "4px" : "12px",
    width: width ?? (variant === "text" ? "100%" : variant === "circular" ? "40px" : undefined),
    height: height ?? (variant === "text" ? "1rem" : variant === "circular" ? "40px" : "16px"),
  };

  return (
    <motion.div
      className={className}
      style={baseStyle}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    />
  );
}

export function BudgetRingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-40 h-40">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-dragonfly-navy-800"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-dragonfly-gold-500/30"
          style={{ clipPath: "polygon(50% 50%, 100% 0%, 100% 50%, 50% 50%)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <Skeleton variant="text" width="80px" height="14px" />
      <Skeleton variant="text" width="120px" height="12px" />
    </div>
  );
}

export function POICardSkeleton() {
  return (
    <div className="p-4 bg-dragonfly-navy-800/50 rounded-xl border border-dragonfly-navy-700">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width="48" height="48" className="flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width="60%" height="18px" />
            <Skeleton variant="text" width="40px" height="14px" />
          </div>
          <Skeleton variant="text" width="80%" height="14px" />
          <Skeleton variant="text" width="40%" height="12px" />
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width="50px" height="12px" />
            <Skeleton variant="text" width="50px" height="12px" />
            <Skeleton variant="text" width="50px" height="12px" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpenseItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-dragonfly-navy-800/50 rounded-xl border border-dragonfly-navy-700">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="40" height="40" />
        <div className="space-y-1">
          <Skeleton variant="text" width="100px" height="16px" />
          <Skeleton variant="text" width="60px" height="12px" />
        </div>
      </div>
      <Skeleton variant="text" width="70px" height="18px" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden bg-dragonfly-navy-900/80 border border-dragonfly-navy-700 relative">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#112d3a_25%,#1a3a4a_50%,#112d3a_75%)] bg-[size:200%_100%] animate-[shimmer_1.5s_infinite]" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center p-6">
          <div className="text-4xl mb-3" aria-hidden="true">🗺️</div>
          <Skeleton variant="text" width="120px" height="20px" className="mx-auto mb-2" />
          <Skeleton variant="text" width="200px" height="14px" className="mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function FilterChipsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} variant="text" width="80px" height="32px" className="rounded-full" />
      ))}
    </div>
  );
}