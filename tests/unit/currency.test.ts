import { describe, it, expect } from "vitest";
import { formatAmount, resolveCurrency } from "@/lib/utils/currency";

describe("formatAmount", () => {
  it("formats USD amount", () => {
    expect(formatAmount(12.5, "USD")).toBe("USD 12.50");
  });
  it("formats zero", () => {
    expect(formatAmount(0, "EUR")).toBe("EUR 0.00");
  });
});

describe("resolveCurrency", () => {
  it("prefers the Settings value over a legacy fallback", () => {
    expect(resolveCurrency("ZAR", "USD")).toBe("ZAR");
  });
  it("falls back when the first candidate is missing", () => {
    expect(resolveCurrency(undefined, "ZAR")).toBe("ZAR");
  });
  it("skips empty and whitespace-only values", () => {
    expect(resolveCurrency("", "   ", "EUR")).toBe("EUR");
  });
  it("defaults to USD when nothing is set", () => {
    expect(resolveCurrency(undefined, null)).toBe("USD");
    expect(resolveCurrency()).toBe("USD");
  });
});
