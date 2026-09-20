import React from "react";
import type { Reminder } from "@/types";
import { ReminderCard } from "./ReminderCard";

interface ReminderListProps {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReminderList({
  reminders,
  onToggle,
  onDelete,
}: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-10 px-4 bg-surface-900/60 backdrop-blur-sm rounded-2xl border border-dashed border-neutral-700">
        <span className="text-3xl mb-1 block" role="img" aria-label="bell">
          🔔
        </span>
        <p className="text-sm font-medium text-neutral-500">
          No reminders scheduled
        </p>
        <p className="text-caption text-neutral-500 mt-0.5">
          Add travel alarms, flight alerts, or daily check-ins above
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
