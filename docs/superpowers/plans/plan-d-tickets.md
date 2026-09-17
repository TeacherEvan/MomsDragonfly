# Mom's Dragonfly — Sub-Plan D: Ticket Storage + OCR

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ticket/receipt scanning — camera capture or file upload, offline OCR via Tesseract.js (WASM, lazy-loaded), Gemini Vision fallback, parsed data (date/amount/venue), and a ticket gallery.

**Architecture:** Image blobs stored in IndexedDB (idb-keyval). Ticket metadata (OCR text, parsed fields, expiresAt) stored in Convex (24 h TTL, purged by scheduled mutation). Tesseract.js lazy-imported only inside the scanner route. Gemini Vision triggered only when Tesseract confidence < 60%.

**Tech Stack:** Next.js 14, TypeScript, Convex, Tesseract.js, idb-keyval, Tailwind, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-moms-dragonfly-design.md` §2.4

## Global Constraints

- All plan-a constraints apply
- Tesseract.js: dynamic import only (never top-level) — keeps initial bundle < 200 kB
- Gemini model: `gemini-1.5-flash` (confirmed default; change to `gemini-1.5-pro` in GEMINI_MODEL env var if user prefers)
- Ticket TTL: 24 h from `createdAt`; Convex scheduled purge via `internalMutation`
- IndexedDB key: `ticket:${convexId}` → stored as Blob
- Parse confidence threshold for Gemini fallback: Tesseract `confidence < 60`
- Every task ends with `git add <files> && git commit -m "..."`

---

### Task D1: Ticket Convex Mutations + Queries + Purge Cron

**Files:**
- Modify: `convex/mutations.ts` (add createTicket, deleteTicket, purgeExpiredTickets)
- Modify: `convex/queries.ts` (add ticketsQuery)
- Modify: `convex/crons.ts` (add purgeExpiredTickets cron)
- Test: `tests/unit/ticket-shape.test.ts`

**Interfaces:**
- Consumes: `convex/schema.ts` `tickets` table
- Produces:
  - `createTicket(args: { deviceId, ocrText?, parsedDate?, parsedAmount?, parsedVenue? }): Id<"tickets">` — sets `createdAt = Date.now()`, `expiresAt = createdAt + 86400000`
  - `deleteTicket(args: { id: Id<"tickets"> }): void`
  - `purgeExpiredTickets(): void` (internalMutation) — deletes where `expiresAt < Date.now()`
  - `ticketsQuery(args: { deviceId: string }): Doc<"tickets">[]` — sorted by createdAt desc

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/ticket-shape.test.ts
import { describe, it, expect } from "vitest";

describe("ticket mutations", () => {
  it("exports createTicket", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.createTicket).toBeDefined();
  });
  it("exports deleteTicket", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.deleteTicket).toBeDefined();
  });
  it("exports purgeExpiredTickets", async () => {
    const mod = await import("../../convex/mutations");
    expect(mod.purgeExpiredTickets).toBeDefined();
  });
});

describe("ticket queries", () => {
  it("exports ticketsQuery", async () => {
    const mod = await import("../../convex/queries");
    expect(mod.ticketsQuery).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm vitest run tests/unit/ticket-shape.test.ts
```
Expected: FAIL

- [ ] **Step 3: Add mutations to `convex/mutations.ts`**

```ts
export const createTicket = mutation({
  args: {
    deviceId: v.string(),
    ocrText: v.optional(v.string()),
    parsedDate: v.optional(v.number()),
    parsedAmount: v.optional(v.number()),
    parsedVenue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    return ctx.db.insert("tickets", {
      ...args,
      createdAt,
      expiresAt: createdAt + 86_400_000,
    });
  },
});

export const deleteTicket = mutation({
  args: { id: v.id("tickets") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const purgeExpiredTickets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("tickets")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    for (const t of expired) {
      await ctx.db.delete(t._id);
    }
  },
});
```

- [ ] **Step 4: Add query to `convex/queries.ts`**

```ts
export const ticketsQuery = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return ctx.db
      .query("tickets")
      .withIndex("by_deviceId_createdAt", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .collect();
  },
});
```

- [ ] **Step 5: Register ticket purge cron in `convex/crons.ts`**

```ts
// Add to crons.ts:
crons.interval(
  "purge-expired-tickets",
  { hours: 1 },
  internal.mutations.purgeExpiredTickets
);
```

- [ ] **Step 6: Run tests to verify pass**

```bash
pnpm vitest run tests/unit/ticket-shape.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add convex/mutations.ts convex/queries.ts convex/crons.ts tests/unit/ticket-shape.test.ts
git commit -m "feat: add ticket Convex mutations, query, purge cron"
```

---

### Task D2: parse.ts — OCR Text Parser

**Files:**
- Create: `src/lib/tickets/parse.ts`
- Test: `tests/unit/parse.test.ts`

**Interfaces:**
- Consumes: raw OCR text string
- Produces:
  - `parseTicket(text: string): { date?: number; amount?: number; venue?: string }` — extracts date (epoch ms), amount (number), venue (first title-cased phrase)

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/parse.test.ts
import { describe, it, expect } from "vitest";
import { parseTicket } from "@/lib/tickets/parse";

describe("parseTicket", () => {
  it("extracts a DD/MM/YYYY date", () => {
    const result = parseTicket("Receipt from 15/08/2025\nTotal: $12.50");
    expect(result.date).toBeDefined();
    const d = new Date(result.date!);
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(7); // 0-indexed August
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
    const result = parseTicket("xkcd 1234 !!!!");
    expect(result.date).toBeUndefined();
    expect(result.amount).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm vitest run tests/unit/parse.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write `src/lib/tickets/parse.ts`**

```ts
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
        ms = new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`).getTime();
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

  // Extract venue: first line that looks like a proper-cased name
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
```

- [ ] **Step 4: Run tests to verify pass**

```bash
pnpm vitest run tests/unit/parse.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/tickets/parse.ts tests/unit/parse.test.ts
git commit -m "feat: add OCR text parser (date/amount/venue extraction) + tests"
```

---

### Task D3: Gemini Vision OCR Convex Action

**Files:**
- Create: `convex/actions/geminiOCR.ts`

**Interfaces:**
- Consumes: `GEMINI_API_KEY` and `GEMINI_MODEL` (default `gemini-1.5-flash`) Convex env vars; base64-encoded image string
- Produces:
  - `geminiOCR(args: { imageBase64: string; mimeType: string }): { text: string }` — calls Gemini Vision API, returns extracted text

- [ ] **Step 1: Write `convex/actions/geminiOCR.ts`**

```ts
import { action } from "../_generated/server";
import { v } from "convex/values";

export const geminiOCR = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, { imageBase64, mimeType }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: { mimeType, data: imageBase64 },
                },
                {
                  text: "Extract all text from this ticket or receipt. Return only the raw text, no formatting.",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return { text };
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/actions/geminiOCR.ts
git commit -m "feat: add geminiOCR Convex action (gemini-1.5-flash fallback)"
```

---

### Task D4: OCR Wrapper + IndexedDB Blob Store

**Files:**
- Create: `src/lib/tickets/ocr.ts`
- Create: `src/lib/idb/tickets.ts`
- Test: `tests/unit/idb-tickets.test.ts`

**Interfaces:**
- Consumes: `parseTicket` from `@/lib/tickets/parse`; `geminiOCR` Convex action (via `useAction` hook, called from UI layer)
- Produces:
  - `runTesseract(imageBlob: Blob): Promise<{ text: string; confidence: number }>` — lazy-loads Tesseract.js WASM, runs recognition on blob
  - `TESSERACT_CONFIDENCE_THRESHOLD = 60` constant
  - `saveTicketBlob(id: string, blob: Blob): Promise<void>` from idb/tickets.ts
  - `loadTicketBlob(id: string): Promise<Blob | undefined>` from idb/tickets.ts
  - `deleteTicketBlob(id: string): Promise<void>` from idb/tickets.ts

- [ ] **Step 1: Write failing test for idb/tickets.ts**

```ts
// tests/unit/idb-tickets.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock idb-keyval since jsdom doesn't have IndexedDB
vi.mock("idb-keyval", () => ({
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(new Blob(["test"])),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("idb ticket store", () => {
  it("exports saveTicketBlob", async () => {
    const mod = await import("@/lib/idb/tickets");
    expect(mod.saveTicketBlob).toBeDefined();
  });
  it("exports loadTicketBlob", async () => {
    const mod = await import("@/lib/idb/tickets");
    expect(mod.loadTicketBlob).toBeDefined();
  });
  it("exports deleteTicketBlob", async () => {
    const mod = await import("@/lib/idb/tickets");
    expect(mod.deleteTicketBlob).toBeDefined();
  });
  it("saveTicketBlob calls idb-keyval set", async () => {
    const { set } = await import("idb-keyval");
    const { saveTicketBlob } = await import("@/lib/idb/tickets");
    await saveTicketBlob("test-id", new Blob(["data"]));
    expect(set).toHaveBeenCalledWith("ticket:test-id", expect.any(Blob));
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm vitest run tests/unit/idb-tickets.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write `src/lib/idb/tickets.ts`**

```ts
import { set, get, del } from "idb-keyval";

const key = (id: string) => `ticket:${id}`;

export async function saveTicketBlob(id: string, blob: Blob): Promise<void> {
  await set(key(id), blob);
}

export async function loadTicketBlob(id: string): Promise<Blob | undefined> {
  return get<Blob>(key(id));
}

export async function deleteTicketBlob(id: string): Promise<void> {
  await del(key(id));
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
pnpm vitest run tests/unit/idb-tickets.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 5: Write `src/lib/tickets/ocr.ts`**

```ts
export const TESSERACT_CONFIDENCE_THRESHOLD = 60;

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Runs Tesseract.js OCR on the provided image blob.
 * Tesseract.js WASM is lazy-loaded — not included in the main bundle.
 */
export async function runTesseract(imageBlob: Blob): Promise<OCRResult> {
  // Dynamic import ensures WASM is not loaded on initial page load
  const Tesseract = (await import("tesseract.js")).default;

  const { data } = await Tesseract.recognize(imageBlob, "eng", {
    logger: () => {}, // suppress progress logs
  });

  return {
    text: data.text,
    confidence: data.confidence,
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/idb/ src/lib/tickets/ocr.ts tests/unit/idb-tickets.test.ts
git commit -m "feat: add Tesseract.js OCR wrapper (lazy WASM) + IndexedDB blob store"
```

---

### Task D5: TicketScanner + OCRResult + TicketCard + TicketGallery

**Files:**
- Create: `src/components/tickets/TicketScanner.tsx`
- Create: `src/components/tickets/OCRResult.tsx`
- Create: `src/components/tickets/TicketCard.tsx`
- Create: `src/components/tickets/TicketGallery.tsx`

**Interfaces:**
- Consumes: `runTesseract` + `TESSERACT_CONFIDENCE_THRESHOLD` from ocr.ts; `parseTicket` from parse.ts; `saveTicketBlob`, `loadTicketBlob`, `deleteTicketBlob` from idb/tickets.ts; `Ticket` type; `createTicket`, `deleteTicket` Convex mutations; `geminiOCR` Convex action (via `useAction`)
- Produces:
  - `<TicketScanner onCapture={(blob: Blob) => void} />` — MediaStream camera preview, capture button, or file upload fallback
  - `<OCRResult text={string} parsedDate?: number parsedAmount?: number parsedVenue?: string onRetryGemini={() => void} />` — shows parsed fields, "Try with Gemini" button
  - `<TicketCard ticket={Ticket} onDelete={() => void} />` — shows image thumbnail, venue, amount, date
  - `<TicketGallery tickets={Ticket[]} onDelete={(id) => void} />`

- [ ] **Step 1: Write `src/components/tickets/TicketScanner.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface TicketScannerProps {
  onCapture: (blob: Blob) => void;
  isProcessing?: boolean;
}

export function TicketScanner({ onCapture, isProcessing }: TicketScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        setStream(s);
        setHasCamera(true);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setHasCamera(false));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, "image/jpeg", 0.85);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  if (hasCamera === false) {
    // File upload fallback
    return (
      <label className={cn(
        "flex flex-col items-center justify-center gap-2 p-6",
        "border-2 border-dashed border-gray-300 rounded-xl cursor-pointer",
        "min-h-[200px]"
      )}>
        <span className="text-4xl">📷</span>
        <span className="text-sm text-gray-500">Tap to upload ticket photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileUpload}
        />
      </label>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-xl bg-black"
        style={{ maxHeight: "60vh" }}
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-4 inset-x-0 flex justify-center">
        <button
          onClick={capture}
          disabled={!!isProcessing}
          className={cn(
            "w-16 h-16 rounded-full bg-white shadow-lg",
            "flex items-center justify-center text-2xl",
            "border-4 border-gray-300",
            isProcessing && "opacity-50"
          )}
          aria-label="Capture ticket photo"
        >
          {isProcessing ? "⏳" : "📸"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/tickets/OCRResult.tsx`**

```tsx
import { formatAmount } from "@/lib/utils/currency";

interface OCRResultProps {
  text: string;
  parsedDate?: number;
  parsedAmount?: number;
  parsedVenue?: string;
  currency: string;
  onRetryGemini: () => void;
  isRetrying?: boolean;
}

export function OCRResult({
  text,
  parsedDate,
  parsedAmount,
  parsedVenue,
  currency,
  onRetryGemini,
  isRetrying,
}: OCRResultProps) {
  const hasData = parsedDate || parsedAmount || parsedVenue;

  return (
    <div className="p-4 space-y-3 bg-gray-50 rounded-xl">
      <h3 className="font-semibold text-sm">Scan Result</h3>
      {hasData ? (
        <div className="space-y-1">
          {parsedVenue && <p className="text-sm"><span className="text-gray-500">Venue:</span> {parsedVenue}</p>}
          {parsedAmount !== undefined && (
            <p className="text-sm"><span className="text-gray-500">Amount:</span> {formatAmount(parsedAmount, currency)}</p>
          )}
          {parsedDate && (
            <p className="text-sm"><span className="text-gray-500">Date:</span> {new Date(parsedDate).toLocaleDateString()}</p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-amber-600 mb-2">Could not extract ticket details.</p>
          <button
            onClick={onRetryGemini}
            disabled={isRetrying}
            className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium min-h-[44px]"
          >
            {isRetrying ? "Analysing with AI…" : "Try with AI (Gemini)"}
          </button>
        </div>
      )}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer">Raw OCR text</summary>
        <pre className="mt-1 whitespace-pre-wrap break-all">{text}</pre>
      </details>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/tickets/TicketCard.tsx`**

```tsx
import type { Ticket } from "@/types";
import { formatAmount } from "@/lib/utils/currency";

interface TicketCardProps {
  ticket: Ticket;
  currency: string;
  onDelete: () => void;
}

export function TicketCard({ ticket, currency, onDelete }: TicketCardProps) {
  return (
    <div className="flex gap-3 p-3 border-b border-gray-100">
      {ticket.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ticket.imageUrl}
          alt="Ticket"
          className="w-16 h-16 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        {ticket.parsedVenue && (
          <p className="font-medium text-sm truncate">{ticket.parsedVenue}</p>
        )}
        {ticket.parsedAmount !== undefined && (
          <p className="text-sm text-gray-600">{formatAmount(ticket.parsedAmount, currency)}</p>
        )}
        {ticket.parsedDate && (
          <p className="text-xs text-gray-400">
            {new Date(ticket.parsedDate).toLocaleDateString()}
          </p>
        )}
        <p className="text-xs text-gray-300 mt-0.5">
          Added {new Date(ticket.createdAt).toLocaleDateString()} · expires in 24 h
        </p>
      </div>
      <button
        onClick={onDelete}
        className="text-red-400 text-sm px-2 py-1 min-h-[44px]"
        aria-label={`Delete ticket${ticket.parsedVenue ? ` from ${ticket.parsedVenue}` : ""}`}
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/tickets/TicketGallery.tsx`**

```tsx
import type { Ticket } from "@/types";
import { TicketCard } from "./TicketCard";

interface TicketGalleryProps {
  tickets: Ticket[];
  currency: string;
  onDelete: (id: string) => void;
}

export function TicketGallery({ tickets, currency, onDelete }: TicketGalleryProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-gray-400">
        <p className="text-4xl mb-2">🎟️</p>
        <p className="text-sm">No tickets yet — scan one above</p>
        <p className="text-xs text-gray-300 mt-1">Tickets are kept for 24 hours</p>
      </div>
    );
  }
  return (
    <div>
      {tickets.map((t) => (
        <TicketCard
          key={t.id}
          ticket={t}
          currency={currency}
          onDelete={() => onDelete(t.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/tickets/
git commit -m "feat: add TicketScanner, OCRResult, TicketCard, TicketGallery components"
```

---

### Task D6: Tickets Page (Wired) + E2E Test

**Files:**
- Modify: `src/app/(tabs)/tickets/page.tsx`
- Create: `tests/e2e/tickets.spec.ts`

**Interfaces:**
- Consumes: all D1–D5 components; `useQuery`, `useMutation`, `useAction` from `convex/react`; `ticketsQuery`, `createTicket`, `deleteTicket` Convex; `geminiOCR` Convex action; `runTesseract`, `TESSERACT_CONFIDENCE_THRESHOLD` from ocr.ts; `parseTicket` from parse.ts; `saveTicketBlob`, `loadTicketBlob`, `deleteTicketBlob` from idb/tickets.ts; `getDeviceId()`; `prefsQuery` for currency
- Produces: Fully working tickets page

- [ ] **Step 1: Update `src/app/(tabs)/tickets/page.tsx`**

```tsx
"use client";
import { useQuery, useMutation, useAction } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "@/lib/convex/client";
import { getDeviceId } from "@/lib/utils/deviceId";
import { runTesseract, TESSERACT_CONFIDENCE_THRESHOLD } from "@/lib/tickets/ocr";
import { parseTicket } from "@/lib/tickets/parse";
import { saveTicketBlob, loadTicketBlob, deleteTicketBlob } from "@/lib/idb/tickets";
import { TicketScanner } from "@/components/tickets/TicketScanner";
import { OCRResult } from "@/components/tickets/OCRResult";
import { TicketGallery } from "@/components/tickets/TicketGallery";
import type { Ticket } from "@/types";

export default function TicketsPage() {
  const deviceId = getDeviceId();
  const rawTickets = useQuery(api.queries.ticketsQuery, { deviceId }) ?? [];
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const createTicketMut = useMutation(api.mutations.createTicket);
  const deleteTicketMut = useMutation(api.mutations.deleteTicket);
  const geminiAction = useAction(api.actions.geminiOCR);

  const [processing, setProcessing] = useState(false);
  const [lastOCR, setLastOCR] = useState<{
    text: string;
    parsed: ReturnType<typeof parseTicket>;
    blob: Blob;
  } | null>(null);
  const [retrying, setRetrying] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    // Load image blobs from IndexedDB for each ticket
    Promise.all(
      rawTickets.map(async (t) => {
        const blob = await loadTicketBlob(t._id);
        const imageUrl = blob ? URL.createObjectURL(blob) : undefined;
        return {
          id: t._id,
          imageUrl,
          ocrText: t.ocrText,
          parsedDate: t.parsedDate,
          parsedAmount: t.parsedAmount,
          parsedVenue: t.parsedVenue,
          createdAt: t.createdAt,
        } satisfies Ticket;
      })
    ).then(setTickets);
  }, [rawTickets]);

  const handleCapture = async (blob: Blob) => {
    setProcessing(true);
    try {
      const { text, confidence } = await runTesseract(blob);
      const parsed = parseTicket(text);

      if (confidence >= TESSERACT_CONFIDENCE_THRESHOLD && (parsed.date || parsed.amount || parsed.venue)) {
        const id = await createTicketMut({
          deviceId,
          ocrText: text,
          parsedDate: parsed.date,
          parsedAmount: parsed.amount,
          parsedVenue: parsed.venue,
        });
        await saveTicketBlob(id, blob);
        setLastOCR(null);
      } else {
        setLastOCR({ text, parsed, blob });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryGemini = async () => {
    if (!lastOCR) return;
    setRetrying(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(lastOCR.blob);
      const dataUrl = await new Promise<string>((res) => {
        reader.onload = () => res(reader.result as string);
      });
      const base64 = dataUrl.split(",")[1];
      const mimeType = lastOCR.blob.type || "image/jpeg";

      const { text } = await geminiAction({ imageBase64: base64, mimeType });
      const parsed = parseTicket(text);

      const id = await createTicketMut({
        deviceId,
        ocrText: text,
        parsedDate: parsed.date,
        parsedAmount: parsed.amount,
        parsedVenue: parsed.venue,
      });
      await saveTicketBlob(id, lastOCR.blob);
      setLastOCR(null);
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTicketMut({ id: id as Parameters<typeof deleteTicketMut>[0]["id"] });
    await deleteTicketBlob(id);
  };

  const currency = prefs?.currency ?? "USD";

  return (
    <div>
      <header className="px-4 py-3 border-b">
        <h1 className="text-xl font-bold">Tickets</h1>
      </header>
      <div className="p-4 space-y-4">
        <TicketScanner onCapture={handleCapture} isProcessing={processing} />
        {lastOCR && (
          <OCRResult
            text={lastOCR.text}
            parsedDate={lastOCR.parsed.date}
            parsedAmount={lastOCR.parsed.amount}
            parsedVenue={lastOCR.parsed.venue}
            currency={currency}
            onRetryGemini={handleRetryGemini}
            isRetrying={retrying}
          />
        )}
      </div>
      <TicketGallery tickets={tickets} currency={currency} onDelete={handleDelete} />
    </div>
  );
}
```

- [ ] **Step 2: Write `tests/e2e/tickets.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("tickets page loads", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
});

test("ticket gallery shows empty state", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page.getByText("No tickets yet")).toBeVisible();
});
```

- [ ] **Step 3: Run parse unit tests**

```bash
pnpm vitest run tests/unit/parse.test.ts tests/unit/idb-tickets.test.ts
```
Expected: PASS (10 tests total)

- [ ] **Step 4: Verify build**

```bash
pnpm build
```
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/(tabs)/tickets/page.tsx tests/e2e/tickets.spec.ts
git commit -m "feat: wire tickets page — Tesseract OCR + Gemini fallback + IndexedDB + Convex"
```

**Sub-Plan D Complete.**
