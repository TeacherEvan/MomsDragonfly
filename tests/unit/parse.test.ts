import { describe, it, expect } from "vitest";
import { parseTicket } from "@/lib/tickets/parse";

describe("parseTicket", () => {
  it("extracts a DD/MM/YYYY date", () => {
    const result = parseTicket("Receipt from 15/08/2025\nTotal: $12.50");
    expect(result.date).toBeDefined();
    const d = new Date(result.date!);
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(7);
    expect(d.getFullYear()).toBe(2025);
  });

  it("extracts an ISO date", () => {
    const result = parseTicket("Date: 2025-08-15\nAmount: USD 45.00");
    expect(result.date).toBeDefined();
    expect(new Date(result.date!).getFullYear()).toBe(2025);
  });

  it("extracts a currency amount", () => {
    const result = parseTicket("Total: $12.50");
    expect(result.amount).toBeCloseTo(12.5);
  });

  it("extracts an amount with USD prefix", () => {
    const result = parseTicket("Grand Total USD 99.99");
    expect(result.amount).toBeCloseTo(99.99);
  });

  it("extracts a venue name", () => {
    const result = parseTicket("Grand Palace Restaurant\nTotal: $20.00");
    expect(result.venue).toBe("Grand Palace Restaurant");
  });

  it("returns empty object for garbled text", () => {
    const result = parseTicket("random junk !@#$");
    expect(result.date).toBeUndefined();
    expect(result.amount).toBeUndefined();
  });

  it("extracts a South African rand total (R 187.50)", () => {
    const text =
      "THE DRAGONFLY CAFE\nHatfield, Pretoria\nDate: 22/09/2026\nCoffee x2 R 68.00\nTOTAL R 187.50\nThank you!";
    const result = parseTicket(text);
    expect(result.amount).toBeCloseTo(187.5);
    expect(result.venue).toBe("THE DRAGONFLY CAFE");
  });

  it("prefers the TOTAL line over earlier amounts", () => {
    const result = parseTicket("Coffee R 68.00\nCheesecake R 55.00\nTOTAL R 187.50");
    expect(result.amount).toBeCloseTo(187.5);
  });

  it("ignores 'Subtotal' when a TOTAL exists", () => {
    const result = parseTicket("Subtotal R 100.00\nTOTAL R 115.00");
    expect(result.amount).toBeCloseTo(115.0);
  });

  it("handles comma decimals (EUR 9,99)", () => {
    const result = parseTicket("Amount due EUR 9,99");
    expect(result.amount).toBeCloseTo(9.99);
  });
});
