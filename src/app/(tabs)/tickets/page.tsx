"use client";
import React, { useState, useEffect } from "react";
import { TicketScanner } from "@/components/tickets/TicketScanner";
import { OCRResult } from "@/components/tickets/OCRResult";
import { TicketGallery } from "@/components/tickets/TicketGallery";
import type { Ticket } from "@/types";
import { runTesseract, TESSERACT_CONFIDENCE_THRESHOLD } from "@/lib/tickets/ocr";
import { parseTicket } from "@/lib/tickets/parse";
import { saveTicketBlob, loadTicketBlob, deleteTicketBlob } from "@/lib/idb/tickets";

const STORAGE_TICKETS_KEY = "mdf_offline_tickets_meta";

export default function TicketsPage() {
  const [currency] = useState("USD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastOCR, setLastOCR] = useState<{
    text: string;
    parsed: ReturnType<typeof parseTicket>;
    blob: Blob;
  } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    // Load metadata and resolve image blobs from IndexedDB
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_TICKETS_KEY);
      if (saved) {
        try {
          const metas: Ticket[] = JSON.parse(saved);
          Promise.all(
            metas.map(async (t) => {
              const blob = await loadTicketBlob(t.id);
              return {
                ...t,
                imageUrl: blob ? URL.createObjectURL(blob) : undefined,
              };
            })
          ).then(setTickets);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const saveTicketList = (updated: Ticket[]) => {
    setTickets(updated);
    if (typeof window !== "undefined") {
      // Save metadata without the transient ObjectURL
      const metas = updated.map((t) => {
        const { imageUrl, ...rest } = t;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _unused = imageUrl;
        return rest;
      });
      localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(metas));
    }
  };

  const handleCapture = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const { text, confidence } = await runTesseract(blob);
      const parsed = parseTicket(text);

      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      await saveTicketBlob(id, blob);

      const newTicket: Ticket = {
        id,
        imageUrl: URL.createObjectURL(blob),
        ocrText: text,
        parsedDate: parsed.date,
        parsedAmount: parsed.amount,
        parsedVenue: parsed.venue,
        createdAt: Date.now(),
      };

      saveTicketList([newTicket, ...tickets]);

      if (
        confidence < TESSERACT_CONFIDENCE_THRESHOLD &&
        !parsed.amount &&
        !parsed.date
      ) {
        setLastOCR({ text, parsed, blob });
      } else {
        setLastOCR(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryGemini = async () => {
    if (!lastOCR) return;
    setIsRetrying(true);
    try {
      // Simulating Gemini fallback response
      await new Promise((r) => setTimeout(r, 1500));
      const simulatedText =
        "Boarding Pass\nVenue: Airport Express Train\nTotal Amount: $18.50\nDate: 2026-09-17";
      const parsed = parseTicket(simulatedText);

      setLastOCR({
        text: simulatedText,
        parsed,
        blob: lastOCR.blob,
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTicketBlob(id);
    saveTicketList(tickets.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto p-4">
      <TicketScanner onCapture={handleCapture} isProcessing={isProcessing} />

      {lastOCR && (
        <OCRResult
          text={lastOCR.text}
          parsedDate={lastOCR.parsed.date}
          parsedAmount={lastOCR.parsed.amount}
          parsedVenue={lastOCR.parsed.venue}
          currency={currency}
          onRetryGemini={handleRetryGemini}
          isRetrying={isRetrying}
        />
      )}

      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Saved Tickets &amp; Receipts
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {tickets.length} total
          </span>
        </div>
        <TicketGallery
          tickets={tickets}
          currency={currency}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
