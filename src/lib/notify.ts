"use client";

import { getDeviceId } from "./utils/deviceId";

export const PUSH_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Requests push notification permission and subscribes to Web Push.
 * Sends the deviceId so the server can store the subscription against this
 * device's prefs (which the `sendDueReminders` cron reads).
 */
export async function requestPushPermission(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    if (!PUSH_PUBLIC_KEY) {
      // No VAPID public key configured — local notifications only.
      console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push subscription skipped");
      return true;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUSH_PUBLIC_KEY) as BufferSource,
    });

    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        subscription: subscription.toJSON(),
      }),
    });

    if (!res.ok) {
      console.warn("Push subscription registration failed:", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Push subscription failed", err);
    return false;
  }
}

/**
 * Removes this device's stored push subscription (notifications turned off).
 * Best-effort: resolves false on failure so callers can degrade gracefully.
 */
export async function removePushSubscription(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const res = await fetch("/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getDeviceId() }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Push unsubscribe failed", err);
    return false;
  }
}

