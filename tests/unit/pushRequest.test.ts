import { describe, it, expect } from "vitest";
import {
  parsePushSubscribeRequest,
  parsePushUnsubscribeRequest,
} from "@/lib/push/request";

const VALID_SUBSCRIPTION = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  keys: { p256dh: "BPtestkey", auth: "BQtestauth" },
  expirationTime: 1790000000000,
};

describe("parsePushSubscribeRequest", () => {
  it("accepts a valid request and returns a sanitized subscription", () => {
    const result = parsePushSubscribeRequest({
      deviceId: "device-abc",
      subscription: { ...VALID_SUBSCRIPTION, userAgent: "junk-that-is-stripped" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deviceId).toBe("device-abc");
      expect(result.subscription).toEqual({
        endpoint: VALID_SUBSCRIPTION.endpoint,
        keys: VALID_SUBSCRIPTION.keys,
        expirationTime: VALID_SUBSCRIPTION.expirationTime,
      });
      expect(result.subscription).not.toHaveProperty("userAgent");
    }
  });

  it("accepts a subscription without expirationTime (null from browsers)", () => {
    const result = parsePushSubscribeRequest({
      deviceId: "device-abc",
      subscription: {
        endpoint: VALID_SUBSCRIPTION.endpoint,
        keys: VALID_SUBSCRIPTION.keys,
        expirationTime: null,
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subscription.expirationTime).toBeUndefined();
    }
  });

  it("rejects non-object bodies", () => {
    for (const body of [undefined, null, "string", 42, []]) {
      const result = parsePushSubscribeRequest(body);
      expect(result.ok).toBe(false);
    }
  });

  it("rejects missing/invalid deviceIds (mirrors convex/auth rules)", () => {
    for (const deviceId of [undefined, null, "", "   ", "ssr", "unknown", 123]) {
      const result = parsePushSubscribeRequest({ deviceId, subscription: VALID_SUBSCRIPTION });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/deviceId/);
    }
  });

  it("rejects a missing or non-object subscription", () => {
    for (const subscription of [undefined, null, "https://...", 42]) {
      const result = parsePushSubscribeRequest({ deviceId: "device-abc", subscription });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects endpoints that are not https", () => {
    for (const endpoint of ["http://insecure.example.com", "not-a-url", "", 42]) {
      const result = parsePushSubscribeRequest({
        deviceId: "device-abc",
        subscription: { endpoint, keys: VALID_SUBSCRIPTION.keys },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/endpoint/);
    }
  });

  it("rejects malformed keys", () => {
    const base = { deviceId: "device-abc", endpoint: VALID_SUBSCRIPTION.endpoint };
    const cases = [
      { ...base, subscription: { endpoint: VALID_SUBSCRIPTION.endpoint } },
      { ...base, subscription: { endpoint: VALID_SUBSCRIPTION.endpoint, keys: null } },
      { ...base, subscription: { endpoint: VALID_SUBSCRIPTION.endpoint, keys: { auth: "a" } } },
      { ...base, subscription: { endpoint: VALID_SUBSCRIPTION.endpoint, keys: { p256dh: "p" } } },
      {
        ...base,
        subscription: { endpoint: VALID_SUBSCRIPTION.endpoint, keys: { p256dh: "", auth: "a" } },
      },
    ];
    for (const body of cases) {
      const result = parsePushSubscribeRequest(body);
      expect(result.ok).toBe(false);
    }
  });
});

describe("parsePushUnsubscribeRequest", () => {
  it("accepts a valid deviceId", () => {
    const result = parsePushUnsubscribeRequest({ deviceId: "device-abc" });
    expect(result).toEqual({ ok: true, deviceId: "device-abc" });
  });

  it("trims whitespace around the deviceId", () => {
    const result = parsePushUnsubscribeRequest({ deviceId: "  device-abc  " });
    expect(result).toEqual({ ok: true, deviceId: "device-abc" });
  });

  it("rejects invalid bodies and deviceIds", () => {
    for (const body of [
      undefined,
      null,
      [],
      {},
      { deviceId: "" },
      { deviceId: "ssr" },
      { deviceId: "unknown" },
      { deviceId: 42 },
    ]) {
      const result = parsePushUnsubscribeRequest(body);
      expect(result.ok).toBe(false);
    }
  });
});
