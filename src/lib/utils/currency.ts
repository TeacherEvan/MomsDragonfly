/** Format an amount with its ISO 4217 currency code. */
export function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Detect the user's likely currency from their browser locale.
 * Falls back to "USD" if detection fails.
 */
export function detectLocaleCurrency(): string {
  if (typeof navigator === "undefined") return "USD";
  try {
    const locale = navigator.language || "en-US";
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
    }).format(0);
    const match = formatted.match(/[A-Z]{3}/);
    return match ? match[0] : "USD";
  } catch {
    return "USD";
  }
}
