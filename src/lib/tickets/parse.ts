export interface ParsedTicket {
  date?: number;
  amount?: number;
  venue?: string;
}

const DATE_PATTERNS = [
  // DD/MM/YYYY or DD-MM-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
  // YYYY-MM-DD (ISO)
  /(\d{4})-(\d{2})-(\d{2})/,
];

const AMOUNT_PATTERNS = [
  // $12.50 or USD 12.50 or € 45.00
  /(?:USD|EUR|GBP|THB|AUD|SGD|MYR|JPY|[\$€£¥฿])\s?(\d{1,6}(?:[.,]\d{1,2})?)/i,
  // 12.50 USD (trailing)
  /(\d{1,6}(?:[.,]\d{1,2}))\s?(?:USD|EUR|GBP|THB|AUD|SGD)/i,
  // Total: 12.50
  /(?:total|amount|due|grand total)[:\s]+(\d{1,6}(?:[.,]\d{2})?)/i,
];

const VENUE_PATTERN = /^([A-Z][A-Za-z &'\-]{2,50})$/m;

export function parseTicket(text: string): ParsedTicket {
  const result: ParsedTicket = {};

  // Extract date
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      let ms: number;
      if (pattern === DATE_PATTERNS[1]) {
        // ISO: YYYY-MM-DD
        ms = new Date(`${m[1]}-${m[2]}-${m[3]}`).getTime();
      } else {
        // DD/MM/YYYY
        ms = new Date(
          `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
        ).getTime();
      }
      if (!isNaN(ms)) {
        result.date = ms;
        break;
      }
    }
  }

  // Extract amount
  for (const pattern of AMOUNT_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const raw = (m[1] || m[0]).replace(",", ".");
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        result.amount = parsed;
        break;
      }
    }
  }

  // Extract venue
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(VENUE_PATTERN);
    if (m && m[1].length > 4 && !/\d/.test(m[1])) {
      result.venue = m[1];
      break;
    }
  }

  return result;
}
