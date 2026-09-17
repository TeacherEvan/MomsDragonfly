"use client";
import React, { useState, useEffect } from "react";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { ReminderList } from "@/components/reminders/ReminderList";
import { DaysCounter } from "@/components/onboarding/DaysCounter";
import { requestPushPermission } from "@/lib/notify";
import type { Reminder } from "@/types";

const STORAGE_REMINDERS_KEY = "mdf_offline_reminders";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_REMINDERS_KEY);
      if (saved) {
        try {
          setReminders(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
      if ("Notification" in window && Notification.permission === "granted") {
        setPushEnabled(true);
      }
    }
  }, []);

  const saveReminders = (updated: Reminder[]) => {
    setReminders(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_REMINDERS_KEY, JSON.stringify(updated));
    }
  };

  const handleAdd = async (r: Omit<Reminder, "id" | "done">) => {
    if (!pushEnabled) {
      const granted = await requestPushPermission();
      if (granted) setPushEnabled(true);
    }

    const item: Reminder = {
      ...r,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      done: false,
    };
    saveReminders([item, ...reminders]);
  };

  const handleToggle = (id: string) => {
    saveReminders(
      reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
  };

  const handleDelete = (id: string) => {
    saveReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto p-4">
      <DaysCounter />

      {!pushEnabled && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>Get push notifications even when this tab is closed.</span>
          <button
            type="button"
            onClick={async () => {
              const ok = await requestPushPermission();
              if (ok) setPushEnabled(true);
            }}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0 ml-2"
          >
            Enable
          </button>
        </div>
      )}

      <ReminderForm onAdd={handleAdd} />

      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Your Schedule
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {reminders.length} total
          </span>
        </div>
        <ReminderList
          reminders={reminders}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
