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
      <div className="text-center text-gray-400 py-10 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
        <span className="text-3xl mb-1 block" role="img" aria-label="receipt">
          🧾
        </span>
        <p className="text-sm font-medium text-gray-500">No expenses recorded yet</p>
        <p className="text-xs text-gray-400 mt-0.5">
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
          className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">
                {formatAmount(e.amount, currency)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                {e.category}
              </span>
            </div>
            {e.note && (
              <p className="text-xs text-gray-600 truncate mt-0.5">{e.note}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1">
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
            className="text-gray-300 hover:text-red-500 p-2 text-sm font-bold min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center transition-colors"
            aria-label={`Delete expense ${formatAmount(e.amount, currency)}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
