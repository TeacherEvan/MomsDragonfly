"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { ReminderList } from "@/components/reminders/ReminderList";
import { DaysCounter } from "@/components/onboarding/DaysCounter";
import { requestPushPermission } from "@/lib/notify";
import type { Reminder } from "@/types";

export default function RemindersClient() {
  const deviceId = getDeviceId();
  const rawReminders = useQuery(api.queries.remindersQuery, { deviceId }) ?? [];
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const addReminderMut = useMutation(api.mutations.addReminder);
  const toggleMut = useMutation(api.mutations.toggleReminder);
  const deleteMut = useMutation(api.mutations.deleteReminder);

  const reminders: Reminder[] = rawReminders.map((r: { _id: string; title: string; body?: string; dueAt: number; repeat: "none" | "daily" | "weekly"; done: boolean }) => ({
    id: r._id,
    title: r.title,
    body: r.body,
    dueAt: r.dueAt,
    repeat: r.repeat,
    done: r.done,
  }));

  const pushEnabled = prefs?.notificationsEnabled ?? false;

  const handleAdd = async (r: Omit<Reminder, "id" | "done">) => {
    if (!pushEnabled) {
      await requestPushPermission();
    }
    addReminderMut({ ...r, deviceId });
  };

  const handleToggle = (id: string) => {
    toggleMut({ id: id as Parameters<typeof toggleMut>[0]["id"], deviceId });
  };

  const handleDelete = (id: string) => {
    deleteMut({ id: id as Parameters<typeof deleteMut>[0]["id"], deviceId });
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold text-gray-900">Reminders</h1>
      <DaysCounter tripStartDate={prefs?.tripStartDate} />

      {!pushEnabled && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span>Get push notifications even when this tab is closed.</span>
          <button
            type="button"
            onClick={async () => {
              const ok = await requestPushPermission();
              if (ok) {
                // Trigger a re-render by updating local state would be ideal
                // but the prefs query will auto-update when the mutation completes
              }
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