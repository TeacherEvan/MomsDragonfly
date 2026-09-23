"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";

import { cn } from "@/lib/utils/cn";
import { useNetworkToast } from "@/components/shell/Toast";
import { ExitButton } from "@/components/shell/ExitButton";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";

const CURRENCIES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "ZAR", label: "ZAR — South African Rand" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "THB", label: "THB — Thai Baht" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "MYR", label: "MYR — Malaysian Ringgit" },
];
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
  const { prefs: displayPrefs, update: updateDisplay, reset: resetDisplay } = useDisplayPrefs();

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
      <header className="px-4 py-3 border-b border-dragonfly-navy-800">
        <h1 className="text-h1 font-bold text-dragonfly-navy-50">Settings</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-6 px-4">
        {/* Default Search Radius */}
        <div className="bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-700 p-4">
          <label htmlFor="default-radius" className="block font-semibold text-dragonfly-navy-50 mb-3">
            Default Search Radius
          </label>
          <select
            id="default-radius"
            value={defaultRadius}
            onChange={(e) => setDefaultRadius(Number(e.target.value))}
            className="w-full px-3 py-2 border border-dragonfly-navy-700 rounded-lg text-sm min-h-[var(--touch-target)] bg-dragonfly-navy-950 text-dragonfly-navy-50 focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 focus:border-transparent"
          >
            {RADIUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-700 p-4">
          <label htmlFor="currency" className="block font-semibold text-dragonfly-navy-50 mb-3">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-dragonfly-navy-700 rounded-lg text-sm min-h-[var(--touch-target)] bg-dragonfly-navy-950 text-dragonfly-navy-50 focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 focus:border-transparent"
          >
            {CURRENCIES.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <div className="bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-dragonfly-navy-50">Push Notifications</h3>
              <p className="text-caption text-dragonfly-navy-400">Receive reminders even when the app is closed</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dragonfly-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-dragonfly-teal-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dragonfly-teal-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dragonfly-teal-500"></div>
            </label>
          </div>
        </div>

        {/* Display & Layout */}
        <div className="bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-700 p-4">
          <h3 className="font-semibold text-dragonfly-navy-50 mb-1">Display &amp; Layout</h3>
          <p className="text-caption text-dragonfly-navy-400 mb-3">Applies instantly on this device</p>
          <div className="space-y-3">
            {(
              [
                { key: "largeText", title: "Large text", hint: "Bigger fonts + touch targets", testId: "display-large-text" },
                { key: "reduceMotion", title: "Reduce motion", hint: "Stops floating + shimmer animations", testId: "display-reduce-motion" },
                { key: "highContrast", title: "High contrast", hint: "Brighter text, plainer background", testId: "display-high-contrast" },
              ] as const
            ).map(({ key, title, hint, testId }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-dragonfly-navy-50 text-sm">{title}</p>
                  <p className="text-caption text-dragonfly-navy-400">{hint}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid={testId}
                    aria-label={title}
                    checked={displayPrefs[key]}
                    onChange={(e) => {
                      updateDisplay({ [key]: e.target.checked });
                      showSuccess(`${title} ${e.target.checked ? "on" : "off"}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dragonfly-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-dragonfly-teal-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dragonfly-teal-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dragonfly-teal-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Start Date */}
        <div className="bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-700 p-4">
          <h3 className="font-semibold text-dragonfly-navy-50 mb-3">Trip Start Date</h3>
          <p className="text-caption text-dragonfly-navy-400 mb-3">Used for the Days Counter on the Reminders page</p>
          <input
            type="date"
            value={tripStartDate}
            onChange={(e) => setTripStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-dragonfly-navy-700 rounded-lg text-sm min-h-[var(--touch-target)] bg-dragonfly-navy-950 text-dragonfly-navy-50 focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 focus:border-transparent"
            aria-label="Trip start date"
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            "w-full bg-dragonfly-teal-500 hover:bg-dragonfly-teal-400 text-dragonfly-navy-950 font-semibold py-3 rounded-xl text-sm transition-all duration-fast active:scale-[0.98]",
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
              resetDisplay();
              showSuccess("Settings reset to defaults");
            }
          }}
          className="w-full text-dragonfly-teal-400 hover:text-dragonfly-teal-300 font-semibold py-2 text-sm underline transition-colors duration-fast"
        >
          Reset to Defaults
        </button>
      </form>

      <div className="px-4">
        <ExitButton />
      </div>
    </div>
  );
}