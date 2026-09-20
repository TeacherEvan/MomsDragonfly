"use client";
import React from "react";
import type { Expense } from "@/types";
import { formatAmount } from "@/lib/utils/currency";

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, currency, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-10 px-4 bg-surface-900/60 backdrop-blur-sm rounded-2xl border border-dashed border-neutral-700">
        <span className="text-3xl mb-1 block" role="img" aria-label="receipt">
          🧾
        </span>
        <p className="text-sm font-medium text-neutral-500">No expenses recorded yet</p>
        <p className="text-caption text-neutral-500 mt-0.5">
          Add an item above to monitor your trip spend
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {expenses.map((e) => (
        <div
          key={e.id}
          className="flex items-center justify-between p-3 bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 shadow-soft"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-50 text-sm">
                {formatAmount(e.amount, currency)}
              </span>
              <span className="text-caption px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium capitalize">
                {e.category}
              </span>
            </div>
            {e.note && (
              <p className="text-caption text-neutral-400 truncate mt-0.5">{e.note}</p>
            )}
            <p className="text-[11px] text-neutral-500 mt-1">
              {new Date(e.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(e.id)}
            className="text-neutral-500 hover:text-rose-400 p-2 text-sm font-bold min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center transition-colors duration-fast"
            aria-label={`Delete expense ${formatAmount(e.amount, currency)}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
