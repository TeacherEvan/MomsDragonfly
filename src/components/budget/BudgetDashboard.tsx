"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { BudgetRing } from "./BudgetRing";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import type { Expense } from "@/types";
import { sumExpenses, remainingBudget } from "@/lib/utils/budget";
import { formatAmount } from "@/lib/utils/currency";
import type { Id } from "convex/_generated/dataModel";

export function BudgetDashboard() {
  const deviceId = getDeviceId();
  const expensesQuery = useQuery(api.queries.expensesQuery, { deviceId });
  const budgetQuery = useQuery(api.queries.budgetQuery, { deviceId });
  const addExpenseMut = useMutation(api.mutations.addExpense);
  const deleteExpenseMut = useMutation(api.mutations.deleteExpense);
  const upsertBudgetMut = useMutation(api.mutations.upsertBudget);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState("");
  const [currency, setCurrency] = useState("USD");

  const budget = budgetQuery;
  const totalBudget = budget?.totalBudget ?? 500;

  // Map Convex documents to frontend Expense type
  const expenses = useMemo(() => {
    const rawExpenses = expensesQuery ?? [];
    return rawExpenses.map((e) => ({
      id: e._id,
      amount: e.amount,
      currency: e.currency,
      category: e.category,
      note: e.note,
      date: e.date,
      ticketId: e.ticketId,
    }));
  }, [expensesQuery]);

  useEffect(() => {
    if (budget) {
      setCurrency(budget.currency);
      setNewBudgetValue(String(budget.totalBudget));
    }
  }, [budget]);

  const handleAddExpense = (newExp: Omit<Expense, "id">) => {
    addExpenseMut({ ...newExp, deviceId, ticketId: newExp.ticketId as Id<"tickets"> | undefined });
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpenseMut({ id: id as Id<"expenses">, deviceId });
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBudgetValue);
    if (!isNaN(val) && val > 0) {
      upsertBudgetMut({
        deviceId,
        totalBudget: val,
        currency,
        period: "trip",
        startDate: Date.now(),
      });
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