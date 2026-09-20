"use client";
import React from "react";
import { motion } from "framer-motion";
import { spentPercent } from "@/lib/utils/budget";
import { formatAmount } from "@/lib/utils/currency";

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
  if (percent >= 100) return "#f43f5e"; // rose-500
  if (percent >= 80) return "#f59e0b"; // amber-500
  return "#D4AF37"; // dragonfly gold
}

export function BudgetRing({ spent, total, currency }: BudgetRingProps) {
  const percent = spentPercent(spent, total);
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const color = getColor(percent);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#112d3a"
          strokeWidth={STROKE}
        />
        {/* Animated progress ring */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ rotate: "-90deg", transformOrigin: "50% 50%" }}
        />
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
          fill="#829ab1"
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
