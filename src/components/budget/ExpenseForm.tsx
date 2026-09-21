"use client";
import React, { useState } from "react";
import type { ExpenseCategory, Expense } from "@/types";
import { cn } from "@/lib/utils/cn";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "🍽️ Food & Drinks" },
  { value: "transport", label: "🚌 Transport / Ride" },
  { value: "accommodation", label: "🏨 Hotel / Stay" },
  { value: "attraction", label: "🏛️ Tour & Tickets" },
  { value: "other", label: "📦 Miscellaneous" },
];

interface ExpenseFormProps {
  onAdd: (expense: Omit<Expense, "id">) => void;
  currency: string;
  disabled?: boolean;
}

export function ExpenseForm({ onAdd, currency, disabled = false }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    onAdd({
      amount: parsed,
      currency,
      category,
      note: note.trim() || undefined,
      date: new Date(date).getTime(),
    });
    setAmount("");
    setNote("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-dragonfly-navy-800/60 backdrop-blur-sm rounded-2xl border border-dragonfly-navy-700 shadow-soft">
      <h3 className="font-bold text-dragonfly-navy-50 text-sm">Add New Expense</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-caption font-semibold text-dragonfly-navy-300 mb-1">
            Amount ({currency})
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 border border-dragonfly-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 focus:border-transparent min-h-[var(--touch-target)] bg-dragonfly-navy-950 text-dragonfly-navy-50 placeholder-dragonfly-navy-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Expense amount"
          />
        </div>
        <div>
          <label className="block text-caption font-semibold text-dragonfly-navy-300 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 border border-dragonfly-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 focus:border-transparent min-h-[var(--touch-target)] bg-dragonfly-navy-950 text-dragonfly-navy-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Expense category"
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

<div>
        <label className="block text-caption font-semibold text-dragonfly-navy-300 mb-1">
          Description (Optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Pad Thai lunch, metro ticket"
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 border border-dragonfly-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 focus:border-transparent min-h-[var(--touch-target)] bg-dragonfly-navy-950 text-dragonfly-navy-50 placeholder-dragonfly-navy-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Expense description"
        />
      </div>

      <div>
        <label className="block text-caption font-semibold text-dragonfly-navy-300 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 border border-dragonfly-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 focus:border-transparent min-h-[var(--touch-target)] bg-dragonfly-navy-950 text-dragonfly-navy-50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Expense date"
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className={cn(
          "w-full bg-dragonfly-teal-500 hover:bg-dragonfly-teal-400 text-dragonfly-navy-950 rounded-xl py-2.5 font-bold text-sm shadow-[0_0_20px_rgba(49,151,149,0.3)] transition-all duration-fast active:scale-[0.98]",
          "min-h-[var(--touch-target)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        + Save Expense
      </button>
    </form>
  );
}
