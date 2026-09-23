// No "use client" directive: this module is pure/validation-only and must be
// importable from BOTH the server route handler and client code.
// (A "use client" here would turn its exports into client references and make
// the server route fail at runtime with "can't call a client function".)

/**
 * Pure request-parsing helpers for POST/DELETE /api/push.
 *
 * Kept dependency-free (no Next/Convex imports) so the validation rules are
 * unit-testable in isolation. Mirrors the `validateDeviceId` rules in
 * `convex/auth.ts` — server-side mutations re-validate anyway; this layer
 * exists to return proper 400s instead of opaque Convex errors.
 */

/** The subset of a Web Push subscription we persist (everything web-push needs, nothing else). */
export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number;
}

export type PushSubscribeResult =
  | { ok: true; deviceId: string; subscription: PushSubscriptionRecord }
  | { ok: false; error: string };

export type PushUnsubscribeResult =
  | { ok: true; deviceId: string }
  | { ok: false; error: string };

const INVALID_DEVICE_IDS = new Set(["", "ssr", "unknown"]);

function parseDeviceId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!id || INVALID_DEVICE_IDS.has(id)) return null;
  return id;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates a subscribe request body: `{ deviceId, subscription }`.
 * Sanitizes the subscription down to the fields web-push actually uses so
 * arbitrary client-supplied junk never lands in `userPrefs`.
 */
export function parsePushSubscribeRequest(body: unknown): PushSubscribeResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const deviceId = parseDeviceId(body.deviceId);
  if (!deviceId) {
    return { ok: false, error: "Missing or invalid deviceId" };
  }

  const subscription = body.subscription;
  if (!isPlainObject(subscription)) {
    return { ok: false, error: "Missing subscription" };
  }

  const endpoint = subscription.endpoint;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return { ok: false, error: "subscription.endpoint must be an https URL" };
  }

  if (!isPlainObject(subscription.keys)) {
    return { ok: false, error: "subscription.keys is required" };
  }
  const { p256dh, auth } = subscription.keys;
  if (typeof p256dh !== "string" || p256dh.length === 0) {
    return { ok: false, error: "subscription.keys.p256dh must be a non-empty string" };
  }
  if (typeof auth !== "string" || auth.length === 0) {
    return { ok: false, error: "subscription.keys.auth must be a non-empty string" };
  }

  const record: PushSubscriptionRecord = {
    endpoint,
    keys: { p256dh, auth },
  };
  if (typeof subscription.expirationTime === "number") {
    record.expirationTime = subscription.expirationTime;
  }

  return { ok: true, deviceId, subscription: record };
}

/** Validates an unsubscribe request body: `{ deviceId }`. */
export function parsePushUnsubscribeRequest(body: unknown): PushUnsubscribeResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const deviceId = parseDeviceId(body.deviceId);
  if (!deviceId) {
    return { ok: false, error: "Missing or invalid deviceId" };
  }
  return { ok: true, deviceId };
}
