import React from "react";
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
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm transition-opacity",
        reminder.done && "opacity-55 bg-gray-50"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
          "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
          reminder.done
            ? "bg-brand-600 border-brand-600 text-white font-bold"
            : "border-gray-300 hover:border-brand-500"
        )}
        aria-label={reminder.done ? "Mark as active" : "Mark as completed"}
      >
        {reminder.done && "✓"}
      </button>

      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "font-semibold text-gray-900 text-sm",
            reminder.done && "line-through text-gray-500"
          )}
        >
          {reminder.title}
        </h4>
        {reminder.body && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{reminder.body}</p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
          <span>⏰ {due.toLocaleString()}</span>
          {reminder.repeat !== "none" && (
            <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 capitalize font-medium">
              {reminder.repeat}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="text-gray-300 hover:text-red-500 p-2 text-sm font-bold min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center transition-colors"
        aria-label={`Delete reminder: ${reminder.title}`}
      >
        ✕
      </button>
    </div>
  );
}
