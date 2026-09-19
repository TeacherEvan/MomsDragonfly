const LOCALE_CURRENCY_MAP: Record<string, string> = {
  "en-US": "USD",
  "en-GB": "GBP",
  "en-EU": "EUR",
  "en-CA": "CAD",
  "en-AU": "AUD",
  "de-DE": "EUR",
  "fr-FR": "EUR",
  "es-ES": "EUR",
  "it-IT": "EUR",
  "ja-JP": "JPY",
  "zh-CN": "CNY",
  "zh-TW": "TWD",
  "ko-KR": "KRW",
  "th-TH": "THB",
  "vi-VN": "VND",
  "id-ID": "IDR",
  "ms-MY": "MYR",
  "pt-BR": "BRL",
  "ru-RU": "RUB",
  "pl-PL": "PLN",
  "nl-NL": "EUR",
  "sv-SE": "SEK",
  "no-NO": "NOK",
  "da-DK": "DKK",
  "fi-FI": "EUR",
  "cs-CZ": "CZK",
  "hu-HU": "HUF",
  "ro-RO": "RON",
  "bg-BG": "BGN",
  "hr-HR": "HRK",
  "sk-SK": "EUR",
  "sl-SI": "EUR",
  "et-EE": "EUR",
  "lv-LV": "EUR",
  "lt-LT": "EUR",
  "el-GR": "EUR",
  "tr-TR": "TRY",
  "he-IL": "ILS",
  "ar-SA": "SAR",
  "fa-IR": "IRR",
  "hi-IN": "INR",
  "bn-BD": "BDT",
  "ur-PK": "PKR",
};

/** Format an amount with its ISO 4217 currency code using locale-aware formatting. */
export function formatAmount(amount: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Detect the user's likely currency from their browser locale.
 * Falls back to "USD" if detection fails.
 */
export function detectLocaleCurrency(): string {
  if (typeof navigator === "undefined") return "USD";
  try {
    const locale = navigator.language || "en-US";
    // Try exact match first
    if (LOCALE_CURRENCY_MAP[locale]) {
      return LOCALE_CURRENCY_MAP[locale];
    }
    // Try language-only match (e.g., "de" -> "de-DE")
    const lang = locale.split("-")[0];
    const langEntry = Object.entries(LOCALE_CURRENCY_MAP).find(([k]) => k.startsWith(lang));
    if (langEntry) return langEntry[1];
    // Fallback to Intl detection
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