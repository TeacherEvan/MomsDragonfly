# Mom's Dragonfly — Sub-Plan B: Budget + Expenses

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add budgeting and expense tracking — per-device trip budget with an animated donut ring, expense entry form, and virtualised expense list.

**Architecture:** Convex mutations/queries for expenses + budgets tables (already in schema from plan-a). Client-side budget math utility. SVG donut ring animated with Framer Motion.

**Tech Stack:** Next.js 14, TypeScript, Convex, Tailwind, Framer Motion, react-window, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md` §2.2

## Global Constraints

- All constraints from plan-a apply (TypeScript strict, mobile-first, etc.)
- Currency: user selects from ISO 4217 list; amounts stored as-entered (no live conversion)
- Categories: `food | transport | accommodation | attraction | other` (matches schema enum)
- Budget period: `trip | daily`
- `getDeviceId()` from `@/lib/utils/deviceId` — same signature as plan-a
- Every task ends with `git add <files> && git commit -m "..."`

---

### Task B1: Budget + Expense Convex Mutations and Queries

**Files:**
- Modify: `convex/mutations.ts` (add addExpense, deleteExpense, upsertBudget)
- Modify: `convex/queries.ts` (add expensesQuery, budgetQuery)
- Test: `tests/unit/budget-mutations-shape.test.ts`

**Interfaces:**
- Consumes: `convex/schema.ts` tables `expenses`, `budgets`; `getDeviceId()` from plan-a
- Produces:
  - `addExpense(args: { deviceId, amount, currency, category, note?, date, ticketId? }): Id<"expenses">`
  - `deleteExpense(args: { id: Id<"expenses"> }): void`
  - `upsertBudget(args: { deviceId, totalBudget, currency, period, startDate, endDate? }): void`
  - `expensesQuery(args: { deviceId: string }): Doc<"expenses">[]` — sorted by date desc
  - `budgetQuery(args: { deviceId: string }): Doc<"budgets"> | null`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/budget-mutations-shape.test.ts
import { describe, it, expect } from "vitest";

describe("budget mutations", () => {
  it("exports addExpense", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.addExpense).toBeDefined();
  });
  it("exports deleteExpense", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.deleteExpense).toBeDefined();
  });
  it("exports upsertBudget", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.upsertBudget).toBeDefined();
  });
});

describe("budget queries", () => {
  it("exports expensesQuery", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.expensesQuery).toBeDefined();
  });
  it("exports budgetQuery", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.budgetQuery).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm vitest run tests/unit/budget-mutations-shape.test.ts
```
Expected: FAIL

- [ ] **Step 3: Add mutations to `convex/mutations.ts`**

Append to the existing file:
```ts
export const addExpense = mutation({
  args: {
    deviceId: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.union(
      v.literal("food"), v.literal("transport"), v.literal("accommodation"),
      v.literal("attraction"), v.literal("other")
    ),
    note: v.optional(v.string()),
    date: v.number(),
    ticketId: v.optional(v.id("tickets")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("expenses", args);
  },
});

export const deleteExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const upsertBudget = mutation({
  args: {
    deviceId: v.string(),
    totalBudget: v.number(),
    currency: v.string(),
    period: v.union(v.literal("trip"), v.literal("daily")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("budgets", args);
    }
  },
});
```

- [ ] **Step 4: Add queries to `convex/queries.ts`**

```ts
export const expensesQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return ctx.db
      .query("expenses")
      .withIndex("by_deviceId_date", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .collect();
  },
});

export const budgetQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return ctx.db
      .query("budgets")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .unique();
  },
});
```

- [ ] **Step 5: Run tests to verify pass**

```bash
pnpm vitest run tests/unit/budget-mutations-shape.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add convex/mutations.ts convex/queries.ts tests/unit/budget-mutations-shape.test.ts
git commit -m "feat: add budget/expense Convex mutations and queries"
```

---

### Task B2: Budget Math Utility

**Files:**
- Create: `src/lib/utils/budget.ts`
- Test: `tests/unit/budget.test.ts`

**Interfaces:**
- Consumes: `Expense` type from `@/types`
- Produces:
  - `sumExpenses(expenses: Expense[]): number` — total amount (same currency assumed)
  - `spentPercent(spent: number, total: number): number` — 0–100, clamped at 100
  - `remainingBudget(total: number, spent: number): number`
  - `groupByCategory(expenses: Expense[]): Record<string, number>` — sum per category

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/budget.test.ts
import { describe, it, expect } from "vitest";
import { sumExpenses, spentPercent, remainingBudget, groupByCategory } from "@/lib/utils/budget";
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
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm vitest run tests/unit/budget.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write `src/lib/utils/budget.ts`**

```ts
import type { Expense } from "@/types";

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function spentPercent(spent: number, total: number): number {
  if (total === 0) return 0;
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
```

- [ ] **Step 4: Run to verify pass**

```bash
pnpm vitest run tests/unit/budget.test.ts
```
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/budget.ts tests/unit/budget.test.ts
git commit -m "feat: add budget math utility (sumExpenses, spentPercent, remainingBudget, groupByCategory)"
```

---

### Task B3: BudgetRing Component (SVG Donut + Framer Motion)

**Files:**
- Create: `src/components/budget/BudgetRing.tsx`

**Interfaces:**
- Consumes: `spentPercent` from `@/lib/utils/budget`; `formatAmount` from `@/lib/utils/currency`
- Produces:
  - `<BudgetRing spent={number} total={number} currency={string} />` — SVG donut, animated on mount with Framer Motion. Green when < 80%, amber 80–99%, red ≥ 100%.

- [ ] **Step 1: Write `src/components/budget/BudgetRing.tsx`**

```tsx
"use client";
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
  if (percent >= 100) return "#ef4444"; // red
  if (percent >= 80) return "#f59e0b";  // amber
  return "#22c55e";                     // green (brand-500)
}

export function BudgetRing({ spent, total, currency }: BudgetRingProps) {
  const percent = spentPercent(spent, total);
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const color = getColor(percent);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background ring */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="#e5e7eb" strokeWidth={STROKE}
        />
        {/* Animated progress ring */}
        <motion.circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke={color} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ rotate: "-90deg", transformOrigin: "50% 50%" }}
        />
        {/* Center text */}
        <text x="50%" y="45%" textAnchor="middle" className="text-sm font-bold" fill={color}>
          {percent}%
        </text>
        <text x="50%" y="58%" textAnchor="middle" fontSize="10" fill="#6b7280">
          used
        </text>
      </svg>
      <p className="text-sm text-gray-600">
        <span className="font-semibold">{formatAmount(spent, currency)}</span>
        {" of "}
        {formatAmount(total, currency)}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/BudgetRing.tsx
git commit -m "feat: add BudgetRing SVG donut with Framer Motion animation"
```

---

### Task B4: ExpenseForm + ExpenseList

**Files:**
- Create: `src/components/budget/ExpenseForm.tsx`
- Create: `src/components/budget/ExpenseList.tsx`

**Interfaces:**
- Consumes: `Expense` type; `formatAmount` from currency utils; `addExpense`, `deleteExpense` Convex mutations
- Produces:
  - `<ExpenseForm onAdd={(expense: Omit<Expense, "id">) => void} currency={string} />` — form with amount (number input), category (select), note (optional text), date (date input, defaults to today)
  - `<ExpenseList expenses={Expense[]} currency={string} onDelete={(id: string) => void} />` — react-window FixedSizeList, row height 80px, shows amount + category + note + date

- [ ] **Step 1: Write `src/components/budget/ExpenseForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import type { ExpenseCategory, Expense } from "@/types";
import { cn } from "@/lib/utils/cn";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "🍽 Food" },
  { value: "transport", label: "🚌 Transport" },
  { value: "accommodation", label: "🏨 Hotel" },
  { value: "attraction", label: "🏛 Attraction" },
  { value: "other", label: "📦 Other" },
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
      note: note || undefined,
      date: new Date(date).getTime(),
    });
    setAmount("");
    setNote("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-gray-50 rounded-xl">
      <div className="flex gap-2">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
          className="flex-1 px-3 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
          aria-label="Expense amount"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="px-2 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
          aria-label="Expense category"
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="w-full px-3 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
        aria-label="Expense date"
      />
      <button
        type="submit"
        className={cn(
          "w-full bg-brand-600 text-white rounded-lg py-2 font-semibold",
          "min-h-[var(--touch-target)]"
        )}
      >
        Add Expense
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/components/budget/ExpenseList.tsx`**

```tsx
"use client";
import { FixedSizeList } from "react-window";
import type { Expense } from "@/types";
import { formatAmount } from "@/lib/utils/currency";

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  onDelete: (id: string) => void;
  height?: number;
}

export function ExpenseList({ expenses, currency, onDelete, height = 320 }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">
        No expenses yet — add one above
      </p>
    );
  }

  return (
    <FixedSizeList height={height} itemCount={expenses.length} itemSize={80} width="100%">
      {({ index, style }) => {
        const e = expenses[index];
        return (
          <div style={style} className="flex items-center gap-3 px-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{formatAmount(e.amount, currency)}</p>
              <p className="text-xs text-gray-500 capitalize">{e.category}{e.note ? ` · ${e.note}` : ""}</p>
              <p className="text-xs text-gray-400">
                {new Date(e.date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => onDelete(e.id)}
              className="text-red-400 text-sm px-2 py-1 min-h-[var(--touch-target)]"
              aria-label={`Delete expense ${formatAmount(e.amount, currency)}`}
            >
              ✕
            </button>
          </div>
        );
      }}
    </FixedSizeList>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/
git commit -m "feat: add ExpenseForm + ExpenseList components"
```

---

### Task B5: BudgetDashboard + Budget Page

**Files:**
- Create: `src/components/budget/BudgetDashboard.tsx`
- Modify: `src/app/(tabs)/budget/page.tsx`

**Interfaces:**
- Consumes: `BudgetRing`, `ExpenseForm`, `ExpenseList`; `useQuery`, `useMutation` from `convex/react`; `expensesQuery`, `budgetQuery`, `addExpense`, `deleteExpense`, `upsertBudget` Convex functions; `getDeviceId()`, `sumExpenses` from utils
- Produces: Fully working budget page — shows ring + form + list; hooks up to Convex for persistence

- [ ] **Step 1: Write `src/components/budget/BudgetDashboard.tsx`**

```tsx
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex/client";
import { getDeviceId } from "@/lib/utils/deviceId";
import { sumExpenses } from "@/lib/utils/budget";
import { BudgetRing } from "./BudgetRing";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import type { Expense } from "@/types";

export function BudgetDashboard() {
  const deviceId = getDeviceId();
  const expenses = useQuery(api.queries.expensesQuery, { deviceId }) ?? [];
  const budget = useQuery(api.queries.budgetQuery, { deviceId });
  const addExpenseMut = useMutation(api.mutations.addExpense);
  const deleteExpenseMut = useMutation(api.mutations.deleteExpense);

  const spent = sumExpenses(
    expenses.map((e) => ({ ...e, id: e._id } as Expense))
  );
  const total = budget?.totalBudget ?? 0;
  const currency = budget?.currency ?? "USD";

  const handleAdd = (expense: Omit<Expense, "id">) => {
    addExpenseMut({ ...expense, deviceId });
  };

  const handleDelete = (id: string) => {
    deleteExpenseMut({ id: id as Parameters<typeof deleteExpenseMut>[0]["id"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center pt-4">
        <BudgetRing spent={spent} total={total} currency={currency} />
      </div>
      <ExpenseForm onAdd={handleAdd} currency={currency} />
      <ExpenseList
        expenses={expenses.map((e) => ({ ...e, id: e._id } as Expense))}
        currency={currency}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `src/app/(tabs)/budget/page.tsx`**

```tsx
import { BudgetDashboard } from "@/components/budget/BudgetDashboard";

export default function BudgetPage() {
  return (
    <div>
      <header className="px-4 py-3 border-b">
        <h1 className="text-xl font-bold">Budget</h1>
      </header>
      <BudgetDashboard />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/components/budget/BudgetDashboard.tsx src/app/(tabs)/budget/page.tsx
git commit -m "feat: wire BudgetDashboard to Convex queries + mutations"
```

---

### Task B6: Budget Tests

**Files:**
- Already created: `tests/unit/budget.test.ts` (from B2)
- Create: `tests/e2e/budget.spec.ts`

**Interfaces:**
- Consumes: running dev server on `http://localhost:3000`
- Produces: E2E test that verifies budget page loads + expense can be added

- [ ] **Step 1: Write `tests/e2e/budget.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("budget page loads", async ({ page }) => {
  await page.goto("/budget");
  await expect(page.getByRole("heading", { name: "Budget" })).toBeVisible();
});

test("can navigate to budget via bottom nav", async ({ page }) => {
  await page.goto("/explore");
  await page.getByRole("link", { name: "Budget" }).click();
  await expect(page).toHaveURL(/\/budget/);
});
```

- [ ] **Step 2: Run unit tests**

```bash
pnpm vitest run tests/unit/budget.test.ts
```
Expected: PASS (8 tests)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/budget.spec.ts
git commit -m "test: add budget E2E smoke test"
```

**Sub-Plan B Complete.**
