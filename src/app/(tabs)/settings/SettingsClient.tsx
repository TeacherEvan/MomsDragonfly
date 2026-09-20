"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";

import { cn } from "@/lib/utils/cn";
import { useNetworkToast } from "@/components/shell/Toast";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "THB", "SGD", "MYR"];
const RADIUS_OPTIONS = [
  { value: 10, label: "10 m" },
  { value: 100, label: "100 m" },
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 20000, label: "20 km+" },
];

export default function SettingsClient() {
  const deviceId = getDeviceId();
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const savePrefsMut = useMutation(api.mutations.savePrefs);
  const { showSuccess } = useNetworkToast();

  const [tripStartDate, setTripStartDate] = useState("");
  const [defaultRadius, setDefaultRadius] = useState(1000);
  const [currency, setCurrency] = useState("USD");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (prefs) {
      setDefaultRadius(prefs.defaultRadius ?? 1000);
      setCurrency(prefs.currency ?? "USD");
      setNotificationsEnabled(prefs.notificationsEnabled ?? false);
      if (prefs.tripStartDate) {
        const date = new Date(prefs.tripStartDate);
        setTripStartDate(date.toISOString().split("T")[0]);
      }
    }
  }, [prefs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {
        defaultRadius,
        currency,
        notificationsEnabled,
      };
      if (tripStartDate) {
        updates.tripStartDate = new Date(tripStartDate).getTime();
      }
      await savePrefsMut({ deviceId, ...updates });
      showSuccess("Settings saved");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto p-4 pb-24">
      <header className="px-4 py-3 border-b border-neutral-800">
        <h1 className="text-h1 font-bold text-neutral-50">Settings</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-6 px-4">
        {/* Default Search Radius */}
        <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 p-4">
          <label htmlFor="default-radius" className="block font-semibold text-neutral-50 mb-3">
            Default Search Radius
          </label>
          <select
            id="default-radius"
            value={defaultRadius}
            onChange={(e) => setDefaultRadius(Number(e.target.value))}
            className="w-full px-3 py-2 border border-neutral-700 rounded-lg text-sm min-h-[var(--touch-target)] bg-surface-950 text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {RADIUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 p-4">
          <label htmlFor="currency" className="block font-semibold text-neutral-50 mb-3">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-700 rounded-lg text-sm min-h-[var(--touch-target)] bg-surface-950 text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-50">Push Notifications</h3>
              <p className="text-caption text-neutral-400">Receive reminders even when the app is closed</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>

        {/* Trip Start Date */}
        <div className="bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 p-4">
          <h3 className="font-semibold text-neutral-50 mb-3">Trip Start Date</h3>
          <p className="text-caption text-neutral-400 mb-3">Used for the Days Counter on the Reminders page</p>
          <input
            type="date"
            value={tripStartDate}
            onChange={(e) => setTripStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-700 rounded-lg text-sm min-h-[var(--touch-target)] bg-surface-950 text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            "w-full bg-primary-500 hover:bg-primary-400 text-neutral-950 font-semibold py-3 rounded-xl text-sm transition-all duration-fast active:scale-[0.98]",
            "min-h-[var(--touch-target)]",
            isSaving && "opacity-60 cursor-not-allowed"
          )}
        >
          {isSaving ? "Saving…" : "Save Settings"}
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset all settings to defaults? This cannot be undone.")) {
              savePrefsMut({
                deviceId,
                defaultRadius: 1000,
                currency: "USD",
                notificationsEnabled: false,
                onboardingComplete: false,
                tripStartDate: undefined,
              });
              showSuccess("Settings reset to defaults");
            }
          }}
          className="w-full text-primary-400 hover:text-primary-300 font-semibold py-2 text-sm underline transition-colors duration-fast"
        >
          Reset to Defaults
        </button>
      </form>
    </div>
  );
}