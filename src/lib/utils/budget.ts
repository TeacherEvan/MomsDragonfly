import type { Expense } from "@/types";

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function spentPercent(spent: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((spent / total) * 100));
}

export function remainingBudget(total: number, spent: number): number {
  return total - spent;
}

export function groupByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
}
