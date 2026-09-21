"use client";
import React, { useId } from "react";
import { motion } from "framer-motion";
import { spentPercent } from "@/lib/utils/budget";
import { formatAmount } from "@/lib/utils/currency";
import { dragonflyPalette } from "@/lib/theme/dragonfly";

interface BudgetRingProps {
  spent: number;
  total: number;
  currency: string;
}

const SIZE = 160;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function getColor(percent: number): string {
  if (percent >= 100) return dragonflyPalette.rose?.[500] ?? "#f43f5e";
  if (percent >= 80) return dragonflyPalette.amber?.[500] ?? "#f59e0b";
  return dragonflyPalette.gold[500];
}

function getGradientId(id: string, percent: number): string {
  if (percent >= 100) return `gradient-rose-${id}`;
  if (percent >= 80) return `gradient-amber-${id}`;
  return `gradient-gold-${id}`;
}

export function BudgetRing({ spent, total, currency }: BudgetRingProps) {
  const id = useId();
  const percent = spentPercent(spent, total);
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const color = getColor(percent);
  const gradientId = getGradientId(id, percent);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          {/* Gold shimmer gradient */}
          <linearGradient id={`gradient-gold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonflyPalette.gold[400]} />
            <stop offset="50%" stopColor={dragonflyPalette.gold[500]} />
            <stop offset="100%" stopColor={dragonflyPalette.gold[600]} />
          </linearGradient>
          {/* Amber warning gradient */}
          <linearGradient id={`gradient-amber-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonflyPalette.amber?.[400] ?? "#fbbf24"} />
            <stop offset="50%" stopColor={dragonflyPalette.amber?.[500] ?? "#f59e0b"} />
            <stop offset="100%" stopColor={dragonflyPalette.amber?.[600] ?? "#d97706"} />
          </linearGradient>
          {/* Rose danger gradient */}
          <linearGradient id={`gradient-rose-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonflyPalette.rose?.[400] ?? "#fb7185"} />
            <stop offset="50%" stopColor={dragonflyPalette.rose?.[500] ?? "#f43f5e"} />
            <stop offset="100%" stopColor={dragonflyPalette.rose?.[600] ?? "#e11d48"} />
          </linearGradient>
          {/* Background ring gradient */}
          <linearGradient id={`gradient-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonflyPalette.navy[800]} />
            <stop offset="100%" stopColor={dragonflyPalette.navy[900]} />
          </linearGradient>
        </defs>
        {/* Background ring with subtle gradient */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={`url(#gradient-bg-${id})`}
          strokeWidth={STROKE}
        />
        {/* Animated progress ring with gradient */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ rotate: "-90deg", transformOrigin: "50% 50%" }}
        />
        {/* Glow effect when near limit */}
        {percent >= 80 && (
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R + 2}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ rotate: "-90deg", transformOrigin: "50% 50%", filter: "blur(4px)" }}
            opacity={percent >= 100 ? 0.6 : 0.3}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* Center text */}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          className="text-2xl font-black"
          fill={color}
        >
          {percent}%
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          fontSize="11"
          fontWeight="500"
          fill={dragonflyPalette.navy[400]}
        >
          SPENT
        </text>
      </svg>
      <p className="text-caption text-dragonfly-navy-400 font-medium">
        <span className="font-bold text-dragonfly-navy-50">
          {formatAmount(spent, currency)}
        </span>{" "}
        of {formatAmount(total, currency)}
      </p>
    </div>
  );
}
