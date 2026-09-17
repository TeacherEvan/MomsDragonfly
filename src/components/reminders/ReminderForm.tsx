"use client";
import React, { useState } from "react";
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
    <form
      onSubmit={handleSubmit}
      className="p-4 space-y-3 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm"
    >
      <h3 className="font-bold text-gray-900 text-sm">Add Alert or Reminder</h3>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Flight boarding, Train depart, Take vitamins"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[var(--touch-target)]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Note (Optional)
        </label>
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Gate B12, remember passports & water"
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[var(--touch-target)]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Date &amp; Time *
          </label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[var(--touch-target)] bg-white"
            aria-label="Due date and time"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Repeat
          </label>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as ReminderRepeat)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[var(--touch-target)] bg-white"
          >
            <option value="none">Once only</option>
            <option value="daily">Every Day</option>
            <option value="weekly">Every Week</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className={cn(
          "w-full bg-brand-600 hover:bg-brand-500 text-white rounded-xl py-2.5 font-bold text-sm shadow-sm transition-all active:scale-98",
          "min-h-[var(--touch-target)]"
        )}
      >
        + Set Reminder
      </button>
    </form>
  );
}
