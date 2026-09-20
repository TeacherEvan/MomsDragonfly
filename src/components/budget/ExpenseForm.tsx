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
}

export function ExpenseForm({ onAdd, currency }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-surface-900/60 backdrop-blur-sm rounded-2xl border border-neutral-800 shadow-soft">
      <h3 className="font-bold text-neutral-50 text-sm">Add New Expense</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-caption font-semibold text-neutral-400 mb-1">
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
            className="w-full px-3 py-2 border border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[var(--touch-target)] bg-surface-950 text-neutral-50 placeholder-neutral-500"
            aria-label="Expense amount"
          />
        </div>
        <div>
          <label className="block text-caption font-semibold text-neutral-400 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full px-3 py-2 border border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[var(--touch-target)] bg-surface-950 text-neutral-50"
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
        <label className="block text-caption font-semibold text-neutral-400 mb-1">
          Description (Optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Pad Thai lunch, metro ticket"
          className="w-full px-3 py-2 border border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[var(--touch-target)] bg-surface-950 text-neutral-50 placeholder-neutral-500"
          aria-label="Expense description"
        />
      </div>

      <div>
        <label className="block text-caption font-semibold text-neutral-400 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[var(--touch-target)] bg-surface-950 text-neutral-50"
          aria-label="Expense date"
        />
      </div>

      <button
        type="submit"
        className={cn(
          "w-full bg-primary-500 hover:bg-primary-400 text-neutral-950 rounded-xl py-2.5 font-bold text-sm shadow-glow transition-all duration-fast active:scale-[0.98]",
          "min-h-[var(--touch-target)]"
        )}
      >
        + Save Expense
      </button>
    </form>
  );
}
