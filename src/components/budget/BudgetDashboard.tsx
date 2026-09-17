"use client";
import React, { useState, useEffect } from "react";
import { BudgetRing } from "./BudgetRing";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import type { Expense } from "@/types";
import { sumExpenses, remainingBudget } from "@/lib/utils/budget";
import { formatAmount } from "@/lib/utils/currency";

const STORAGE_EXPENSES_KEY = "mdf_offline_expenses";
const STORAGE_BUDGET_KEY = "mdf_offline_total_budget";

export function BudgetDashboard() {
  const [currency] = useState("USD");
  const [totalBudget, setTotalBudget] = useState(500);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState("500");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedExp = localStorage.getItem(STORAGE_EXPENSES_KEY);
      if (savedExp) {
        try {
          setExpenses(JSON.parse(savedExp));
        } catch {
          // ignore
        }
      }
      const savedBudget = localStorage.getItem(STORAGE_BUDGET_KEY);
      if (savedBudget) {
        setTotalBudget(Number(savedBudget) || 500);
        setNewBudgetValue(savedBudget);
      }
    }
  }, []);

  const saveExpensesToStorage = (updated: Expense[]) => {
    setExpenses(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(updated));
    }
  };

  const handleAddExpense = (newExp: Omit<Expense, "id">) => {
    const item: Expense = {
      ...newExp,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    };
    saveExpensesToStorage([item, ...expenses]);
  };

  const handleDeleteExpense = (id: string) => {
    saveExpensesToStorage(expenses.filter((e) => e.id !== id));
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBudgetValue);
    if (!isNaN(val) && val > 0) {
      setTotalBudget(val);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_BUDGET_KEY, String(val));
      }
    }
    setIsEditingBudget(false);
  };

  const spent = sumExpenses(expenses);
  const remaining = remainingBudget(totalBudget, spent);

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto p-4">
      {/* Header Summary with Animated Ring */}
      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Trip Budget Tracker
          </span>
          <button
            type="button"
            onClick={() => setIsEditingBudget(!isEditingBudget)}
            className="text-xs text-brand-700 font-semibold hover:underline"
          >
            {isEditingBudget ? "Cancel" : "Edit Target"}
          </button>
        </div>

        {isEditingBudget ? (
          <form onSubmit={handleSaveBudget} className="flex gap-2 w-full my-4">
            <input
              type="number"
              min="1"
              value={newBudgetValue}
              onChange={(e) => setNewBudgetValue(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl text-sm min-h-[var(--touch-target)]"
              placeholder="Total budget amount"
              required
            />
            <button
              type="submit"
              className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold min-h-[var(--touch-target)]"
            >
              Save
            </button>
          </form>
        ) : (
          <div className="my-2">
            <BudgetRing spent={spent} total={totalBudget} currency={currency} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full mt-3 pt-3 border-t border-gray-100 text-center">
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">
              Total Budget
            </span>
            <span className="text-sm font-bold text-gray-800">
              {formatAmount(totalBudget, currency)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">
              Remaining
            </span>
            <span
              className={`text-sm font-bold ${
                remaining < 0 ? "text-red-600" : "text-brand-600"
              }`}
            >
              {formatAmount(remaining, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Expense Form */}
      <ExpenseForm onAdd={handleAddExpense} currency={currency} />

      {/* Expense List */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Recent Expenses
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {expenses.length} total
          </span>
        </div>
        <ExpenseList
          expenses={expenses}
          currency={currency}
          onDelete={handleDeleteExpense}
        />
      </div>
    </div>
  );
}
