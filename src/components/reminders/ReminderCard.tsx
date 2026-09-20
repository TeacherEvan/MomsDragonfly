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
        "flex items-center gap-3 p-4 bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 shadow-soft transition-all duration-fast",
        reminder.done && "opacity-60 border-neutral-700"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-fast",
          "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
          reminder.done
            ? "bg-primary-500 border-primary-500 text-neutral-950 font-bold"
            : "border-neutral-700 hover:border-primary-500"
        )}
        aria-label={reminder.done ? "Mark as active" : "Mark as completed"}
      >
        {reminder.done && "✓"}
      </button>

      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "font-semibold text-neutral-50 text-body",
            reminder.done && "line-through text-neutral-500"
          )}
        >
          {reminder.title}
        </h4>
        {reminder.body && (
          <p className="text-caption text-neutral-400 truncate mt-0.5">{reminder.body}</p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
          <span>⏰ {due.toLocaleString()}</span>
          {reminder.repeat !== "none" && (
            <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 capitalize font-medium">
              {reminder.repeat}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="text-neutral-500 hover:text-rose-400 p-2 text-sm font-bold min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center transition-colors duration-fast"
        aria-label={`Delete reminder: ${reminder.title}`}
      >
        ✕
      </button>
    </div>
  );
}
