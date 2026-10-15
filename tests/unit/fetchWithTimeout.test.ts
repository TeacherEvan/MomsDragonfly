import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchJson,
  FetchTimeoutError,
  fetchWithTimeout,
  HttpError,
  isRetryable,
} from "../../convex/fetchWithTimeout";

describe("fetchWithTimeout utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isRetryable", () => {
    it("returns true for 429 and 5xx errors", () => {
      expect(isRetryable(429)).toBe(true);
      expect(isRetryable(500)).toBe(true);
      expect(isRetryable(502)).toBe(true);
      expect(isRetryable(503)).toBe(true);
      expect(isRetryable(504)).toBe(true);
    });

    it("returns false for 2xx, 3xx, and client 4xx errors", () => {
      expect(isRetryable(200)).toBe(false);
      expect(isRetryable(201)).toBe(false);
      expect(isRetryable(301)).toBe(false);
      expect(isRetryable(400)).toBe(false);
      expect(isRetryable(401)).toBe(false);
      expect(isRetryable(404)).toBe(false);
    });
  });

  describe("HttpError & FetchTimeoutError", () => {
    it("HttpError carries status and message", () => {
      const err = new HttpError(404, "Not Found");
      expect(err.name).toBe("HttpError");
      expect(err.status).toBe(404);
      expect(err.message).toBe("Not Found");
    });

    it("FetchTimeoutError carries name and message", () => {
      const err = new FetchTimeoutError("Timed out");
      expect(err.name).toBe("FetchTimeoutError");
      expect(err.message).toBe("Timed out");
    });
  });

  describe("fetchJson", () => {
    it("parses valid JSON response", async () => {
      const mockData = { message: "ok" };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await fetchJson<{ message: string }>("https://example.com/api");
      expect(res).toEqual(mockData);
    });

    it("returns null on non-OK response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Server Error", { status: 500 })
      );

      const res = await fetchJson("https://example.com/api");
      expect(res).toBeNull();
    });

    it("returns null when fetch rejects", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network offline"));

      const res = await fetchJson("https://example.com/api");
      expect(res).toBeNull();
    });
  });

  describe("fetchWithTimeout", () => {
    it("passes through successful fetch response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("OK", { status: 200 })
      );

      const res = await fetchWithTimeout("https://example.com/test", { timeoutMs: 5000 });
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("OK");
    });
  });
});
