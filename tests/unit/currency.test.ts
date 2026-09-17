import { describe, it, expect } from "vitest";
import { formatAmount } from "@/lib/utils/currency";

describe("formatAmount", () => {
  it("formats USD amount", () => {
    expect(formatAmount(12.5, "USD")).toBe("USD 12.50");
  });
  it("formats zero", () => {
    expect(formatAmount(0, "EUR")).toBe("EUR 0.00");
  });
});
