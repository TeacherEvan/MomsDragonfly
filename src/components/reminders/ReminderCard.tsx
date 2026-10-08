import React from "react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { Reminder } from "@/types";

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
        "flex items-center gap-3 p-4 bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-700 shadow-soft transition-all duration-fast",
        reminder.done && "opacity-60 border-dragonfly-navy-600"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-fast",
          "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
          reminder.done
            ? "bg-dragonfly-teal-500 border-dragonfly-teal-500 text-dragonfly-navy-950 font-bold"
            : "border-dragonfly-navy-700 hover:border-dragonfly-teal-500"
        )}
        aria-label={reminder.done ? "Mark as active" : "Mark as completed"}
      >
        {reminder.done && <Icon name="check" size={14} />}
      </button>

      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "font-semibold text-dragonfly-navy-50 text-body",
            reminder.done && "line-through text-dragonfly-navy-400"
          )}
        >
          {reminder.title}
        </h4>
        {reminder.body && (
          <p className="text-caption text-dragonfly-navy-400 truncate mt-0.5">{reminder.body}</p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-dragonfly-navy-400 mt-1">
          <span className="inline-flex items-center gap-1">
            <Icon name="bell" size={12} />
            {due.toLocaleString()}
          </span>
          {reminder.repeat !== "none" && (
            <span className="px-1.5 py-0.2 rounded bg-dragonfly-navy-700 text-dragonfly-navy-200 capitalize font-medium">
              {reminder.repeat}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="text-dragonfly-navy-400 hover:text-dragonfly-rose-400 p-2 min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center transition-colors duration-fast"
        aria-label={`Delete reminder: ${reminder.title}`}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
