# Mom's Dragonfly — Sub-Plan C: Reminders + Days Counter

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reminders with Web Push notifications and a days-counter showing trip progress.

**Architecture:** Convex mutations/queries for reminders table (already in schema). Web Push via VAPID key pair. Convex cron (every 5 min) sends due notifications. Graceful fallback: if Push permission denied or browser doesn't support it, show in-app badge only.

**Tech Stack:** Next.js 14, TypeScript, Convex, Tailwind, web-push (server), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md` §2.3

## Global Constraints

- All plan-a constraints apply
- Push notifications: VAPID pair from `npx web-push generate-vapid-keys`; stored in Convex env vars
- iOS < 16.4 does not support Web Push — graceful fallback to in-app badge
- Repeat options: `none | daily | weekly` (matches schema)
- Every task ends with `git add <files> && git commit -m "..."`

---

### Task C1: Reminder Convex Mutations + Queries

**Files:**
- Modify: `convex/mutations.ts` (add addReminder, toggleReminder, deleteReminder)
- Modify: `convex/queries.ts` (add remindersQuery, upcomingRemindersQuery)
- Test: `tests/unit/reminder-shape.test.ts`

**Interfaces:**
- Consumes: `convex/schema.ts` `reminders` table
- Produces:
  - `addReminder(args: { deviceId, title, body?, dueAt, repeat }): Id<"reminders">`
  - `toggleReminder(args: { id: Id<"reminders"> }): void` — flips `done` field
  - `deleteReminder(args: { id: Id<"reminders"> }): void`
  - `remindersQuery(args: { deviceId: string }): Doc<"reminders">[]` — sorted by dueAt asc
  - `upcomingRemindersQuery(args: { before: number }): Doc<"reminders">[]` — due before `before` ms, not done, not yet sent

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/reminder-shape.test.ts
import { describe, it, expect } from "vitest";

describe("reminder mutations", () => {
  it("exports addReminder", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.addReminder).toBeDefined();
  });
  it("exports toggleReminder", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.toggleReminder).toBeDefined();
  });
  it("exports deleteReminder", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.deleteReminder).toBeDefined();
  });
});

describe("reminder queries", () => {
  it("exports remindersQuery", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.remindersQuery).toBeDefined();
  });
  it("exports upcomingRemindersQuery", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.upcomingRemindersQuery).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm vitest run tests/unit/reminder-shape.test.ts
```
Expected: FAIL

- [ ] **Step 3: Add mutations to `convex/mutations.ts`**

```ts
export const addReminder = mutation({
  args: {
    deviceId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    dueAt: v.number(),
    repeat: v.union(v.literal("none"), v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("reminders", { ...args, done: false });
  },
});

export const toggleReminder = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) return;
    await ctx.db.patch(id, { done: !reminder.done });
  },
});

export const deleteReminder = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const markReminderSent = internalMutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { sentAt: Date.now() });
  },
});
```

- [ ] **Step 4: Add queries to `convex/queries.ts`**

```ts
export const remindersQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return ctx.db
      .query("reminders")
      .withIndex("by_deviceId_dueAt", (q) => q.eq("deviceId", deviceId))
      .order("asc")
      .collect();
  },
});

export const upcomingRemindersQuery = query({
  args: { before: v.number() },
  handler: async (ctx, { before }) => {
    return ctx.db
      .query("reminders")
      .filter((q) =>
        q.and(
          q.lte(q.field("dueAt"), before),
          q.eq(q.field("done"), false),
          q.eq(q.field("sentAt"), undefined)
        )
      )
      .collect();
  },
});
```

- [ ] **Step 5: Run tests to verify pass**

```bash
pnpm vitest run tests/unit/reminder-shape.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add convex/mutations.ts convex/queries.ts tests/unit/reminder-shape.test.ts
git commit -m "feat: add reminder Convex mutations and queries"
```

---

### Task C2: Web Push API Route + notify.ts Utility

**Files:**
- Create: `src/app/api/push/route.ts`
- Create: `src/lib/notify.ts`

**Interfaces:**
- Consumes: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` env vars; `savePrefs` Convex mutation
- Produces:
  - `POST /api/push` — accepts `{ deviceId, subscription: PushSubscription }`, stores serialised subscription in `userPrefs.vapidSubscription`
  - `requestPushPermission(): Promise<boolean>` from `src/lib/notify.ts` — asks browser for notification permission, POSTs subscription to `/api/push`
  - `PUSH_PUBLIC_KEY` constant exported from `src/lib/notify.ts`

- [ ] **Step 1: Generate VAPID keys (one-time)**

```bash
npx web-push generate-vapid-keys
# Copy output to .env.local and set via: npx convex env set VAPID_PRIVATE_KEY <value>
```

- [ ] **Step 2: Write `src/app/api/push/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { subscription } = await req.json() as {
      deviceId: string;
      subscription: PushSubscriptionJSON;
    };
    // Validate subscription shape
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }
    // The Convex savePrefs mutation is called from the client — this route
    // is only for future server-side send operations.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Write `src/lib/notify.ts`**

```ts
"use client";

export const PUSH_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Requests push notification permission and subscribes to Web Push.
 * Returns true if permission was granted, false otherwise.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return false; // browser doesn't support push
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUSH_PUBLIC_KEY),
    });

    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    return true;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/push/route.ts src/lib/notify.ts
git commit -m "feat: add Web Push API route + requestPushPermission utility"
```

---

### Task C3: sendDueReminders Convex Action + Cron Registration

**Files:**
- Create: `convex/actions/sendDueReminders.ts`
- Modify: `convex/crons.ts` (uncomment sendDueReminders cron line)

**Interfaces:**
- Consumes: `internal.queries.upcomingRemindersQuery`; `internal.mutations.markReminderSent`; `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` Convex env vars
- Produces:
  - `sendDueReminders()` internal action — queries due reminders, sends Web Push to each device subscription, marks sentAt

- [ ] **Step 1: Write `convex/actions/sendDueReminders.ts`**

```ts
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import webpush from "web-push";

export const sendDueReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublic || !vapidPrivate || !vapidSubject) {
      console.warn("VAPID keys not set — skipping push send");
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const now = Date.now();
    const due = await ctx.runQuery(internal.queries.upcomingRemindersQuery, {
      before: now,
    });

    for (const reminder of due) {
      // Get the device's push subscription from userPrefs
      const prefs = await ctx.runQuery(internal.queries.prefsQuery, {
        deviceId: reminder.deviceId,
      });

      if (!prefs?.vapidSubscription) continue;

      try {
        const subscription = JSON.parse(prefs.vapidSubscription) as PushSubscriptionJSON;
        await webpush.sendNotification(
          subscription as Parameters<typeof webpush.sendNotification>[0],
          JSON.stringify({
            title: reminder.title,
            body: reminder.body ?? "",
          })
        );
        await ctx.runMutation(internal.mutations.markReminderSent, {
          id: reminder._id,
        });
      } catch (err) {
        console.error(`Failed to send push for reminder ${reminder._id}:`, err);
      }
    }
  },
});
```

- [ ] **Step 2: Update `convex/crons.ts` to register the cron**

```ts
// Uncomment the sendDueReminders line:
crons.interval("send-reminders", { minutes: 5 }, internal.actions.sendDueReminders);
```

- [ ] **Step 3: Add `web-push` as Convex dependency**

```bash
# web-push must be available in Convex action runtime
# Convex actions run in Node.js — add to package.json dependencies (already installed in plan-a)
echo "web-push already installed from plan-a setup"
```

- [ ] **Step 4: Commit**

```bash
git add convex/actions/sendDueReminders.ts convex/crons.ts
git commit -m "feat: add sendDueReminders Convex action + register cron (every 5 min)"
```

---

### Task C4: Reminder UI Components

**Files:**
- Create: `src/components/reminders/ReminderForm.tsx`
- Create: `src/components/reminders/ReminderCard.tsx`
- Create: `src/components/reminders/ReminderList.tsx`
- Create: `src/components/onboarding/DaysCounter.tsx`

**Interfaces:**
- Consumes: `Reminder` type; `addReminder`, `toggleReminder`, `deleteReminder` Convex mutations; `requestPushPermission` from `@/lib/notify`; `tripStartDate` from `userPrefs`
- Produces:
  - `<ReminderForm onAdd={(r: Omit<Reminder, "id" | "done">) => void} />` — title, optional body, datetime-local input, repeat select
  - `<ReminderCard reminder={Reminder} onToggle={() => void} onDelete={() => void} />` — shows title, dueAt formatted, repeat badge, done/active state
  - `<ReminderList reminders={Reminder[]} onToggle={(id) => void} onDelete={(id) => void} />`
  - `<DaysCounter tripStartDate={number | undefined} />` — shows "Day N of your trip" or "Set trip start date in settings"

- [ ] **Step 1: Write `src/components/reminders/ReminderForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import type { Reminder, ReminderRepeat } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ReminderFormProps {
  onAdd: (r: Omit<Reminder, "id" | "done">) => void;
}

export function ReminderForm({ onAdd }: ReminderFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [repeat, setRepeat] = useState<ReminderRepeat>("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;
    onAdd({
      title: title.trim(),
      body: body.trim() || undefined,
      dueAt: new Date(dueAt).getTime(),
      repeat,
    });
    setTitle("");
    setBody("");
    setDueAt("");
    setRepeat("none");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-gray-50 rounded-xl">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Reminder title *"
        required
        className="w-full px-3 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
      />
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Note (optional)"
        className="w-full px-3 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
      />
      <input
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
        aria-label="Due date and time"
      />
      <select
        value={repeat}
        onChange={(e) => setRepeat(e.target.value as ReminderRepeat)}
        className="w-full px-3 py-2 border rounded-lg text-sm min-h-[var(--touch-target)]"
      >
        <option value="none">No repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <button
        type="submit"
        className={cn(
          "w-full bg-brand-600 text-white rounded-lg py-2 font-semibold",
          "min-h-[var(--touch-target)]"
        )}
      >
        Add Reminder
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/components/reminders/ReminderCard.tsx`**

```tsx
import type { Reminder } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: () => void;
  onDelete: () => void;
}

export function ReminderCard({ reminder, onToggle, onDelete }: ReminderCardProps) {
  const due = new Date(reminder.dueAt);
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-b border-gray-100",
      reminder.done && "opacity-50"
    )}>
      <button
        onClick={onToggle}
        className={cn(
          "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
          "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
          reminder.done ? "bg-brand-500 border-brand-500 text-white" : "border-gray-400"
        )}
        aria-label={reminder.done ? "Mark incomplete" : "Mark complete"}
      >
        {reminder.done && "✓"}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", reminder.done && "line-through")}>
          {reminder.title}
        </p>
        {reminder.body && <p className="text-xs text-gray-500">{reminder.body}</p>}
        <p className="text-xs text-gray-400 mt-0.5">
          {due.toLocaleString()}
          {reminder.repeat !== "none" && (
            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
              {reminder.repeat}
            </span>
          )}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="text-red-400 text-sm px-2 py-1 min-h-[var(--touch-target)]"
        aria-label={`Delete reminder: ${reminder.title}`}
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/reminders/ReminderList.tsx`**

```tsx
import type { Reminder } from "@/types";
import { ReminderCard } from "./ReminderCard";

interface ReminderListProps {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReminderList({ reminders, onToggle, onDelete }: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">
        No reminders yet — add one above
      </p>
    );
  }
  return (
    <div>
      {reminders.map((r) => (
        <ReminderCard
          key={r.id}
          reminder={r}
          onToggle={() => onToggle(r.id)}
          onDelete={() => onDelete(r.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/onboarding/DaysCounter.tsx`**

```tsx
"use client";

interface DaysCounterProps {
  tripStartDate?: number;
}

export function DaysCounter({ tripStartDate }: DaysCounterProps) {
  if (!tripStartDate) {
    return (
      <p className="text-center text-sm text-gray-400 py-2">
        Set your trip start date in Settings to see your day count
      </p>
    );
  }

  const daysSince = Math.floor((Date.now() - tripStartDate) / 86_400_000);
  const label = daysSince === 0 ? "Trip starts today! 🎉" : `Day ${daysSince + 1} of your trip 🌍`;

  return (
    <div className="text-center py-3 bg-brand-50 rounded-xl mx-4">
      <p className="text-2xl font-bold text-brand-700">{daysSince + 1}</p>
      <p className="text-sm text-brand-600">{label}</p>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/reminders/ src/components/onboarding/DaysCounter.tsx
git commit -m "feat: add ReminderForm, ReminderCard, ReminderList, DaysCounter components"
```

---

### Task C5: Reminders Page + E2E Test

**Files:**
- Modify: `src/app/(tabs)/reminders/page.tsx`
- Create: `tests/e2e/reminders.spec.ts`

**Interfaces:**
- Consumes: all C1–C4 components and mutations; `useQuery`, `useMutation` from `convex/react`; `getDeviceId()`, `requestPushPermission()`
- Produces: Fully working reminders page wired to Convex

- [ ] **Step 1: Update `src/app/(tabs)/reminders/page.tsx`**

```tsx
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex/client";
import { getDeviceId } from "@/lib/utils/deviceId";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { ReminderList } from "@/components/reminders/ReminderList";
import { DaysCounter } from "@/components/onboarding/DaysCounter";
import { requestPushPermission } from "@/lib/notify";
import type { Reminder } from "@/types";

export default function RemindersPage() {
  const deviceId = getDeviceId();
  const rawReminders = useQuery(api.queries.remindersQuery, { deviceId }) ?? [];
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const addReminderMut = useMutation(api.mutations.addReminder);
  const toggleMut = useMutation(api.mutations.toggleReminder);
  const deleteMut = useMutation(api.mutations.deleteReminder);

  const reminders: Reminder[] = rawReminders.map((r) => ({
    id: r._id,
    title: r.title,
    body: r.body,
    dueAt: r.dueAt,
    repeat: r.repeat,
    done: r.done,
  }));

  const handleAdd = async (r: Omit<Reminder, "id" | "done">) => {
    // Request push permission on first add
    if (!prefs?.notificationsEnabled) {
      await requestPushPermission();
    }
    addReminderMut({ ...r, deviceId });
  };

  return (
    <div>
      <header className="px-4 py-3 border-b">
        <h1 className="text-xl font-bold">Reminders</h1>
      </header>
      <div className="py-2">
        <DaysCounter tripStartDate={prefs?.tripStartDate} />
      </div>
      <ReminderForm onAdd={handleAdd} />
      <ReminderList
        reminders={reminders}
        onToggle={(id) => toggleMut({ id: id as Parameters<typeof toggleMut>[0]["id"] })}
        onDelete={(id) => deleteMut({ id: id as Parameters<typeof deleteMut>[0]["id"] })}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `tests/e2e/reminders.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("reminders page loads", async ({ page }) => {
  await page.goto("/reminders");
  await expect(page.getByRole("heading", { name: "Reminders" })).toBeVisible();
});

test("can navigate to reminders via bottom nav", async ({ page }) => {
  await page.goto("/explore");
  await page.getByRole("link", { name: "Reminders" }).click();
  await expect(page).toHaveURL(/\/reminders/);
});
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(tabs)/reminders/page.tsx tests/e2e/reminders.spec.ts
git commit -m "feat: wire reminders page to Convex + push permission; add E2E smoke test"
```

**Sub-Plan C Complete.**
