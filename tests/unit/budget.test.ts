import { describe, it, expect } from "vitest";
import {
  sumExpenses,
  spentPercent,
  remainingBudget,
  groupByCategory,
} from "@/lib/utils/budget";
import type { Expense } from "@/types";

const expenses: Expense[] = [
  { id: "1", amount: 10, currency: "USD", category: "food", date: 1 },
  { id: "2", amount: 5, currency: "USD", category: "transport", date: 2 },
  { id: "3", amount: 15, currency: "USD", category: "food", date: 3 },
];

describe("sumExpenses", () => {
  it("sums amounts", () => expect(sumExpenses(expenses)).toBe(30));
  it("returns 0 for empty", () => expect(sumExpenses([])).toBe(0));
});

describe("spentPercent", () => {
  it("returns 60 when 30 of 50 spent", () => expect(spentPercent(30, 50)).toBe(60));
  it("clamps at 100 when over budget", () => expect(spentPercent(60, 50)).toBe(100));
  it("returns 0 when total is 0", () => expect(spentPercent(10, 0)).toBe(0));
});

describe("remainingBudget", () => {
  it("returns positive remainder", () => expect(remainingBudget(50, 30)).toBe(20));
  it("returns negative when over", () => expect(remainingBudget(20, 30)).toBe(-10));
});

describe("groupByCategory", () => {
  it("groups and sums by category", () => {
    const grouped = groupByCategory(expenses);
    expect(grouped["food"]).toBe(25);
    expect(grouped["transport"]).toBe(5);
  });
});
