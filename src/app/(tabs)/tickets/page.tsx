"use client";
import { useQuery, useMutation, useAction } from "convex/react";
import { useState, useEffect, useMemo } from "react";
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
  const stableRawTickets = useMemo(
    () => rawTickets,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawTickets.length, rawTickets[0]?.createdAt]
  );
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
    let mounted = true;
    Promise.all(
      stableRawTickets.map(async (t: { _id: string; ocrText?: string; parsedDate?: number; parsedAmount?: number; parsedVenue?: string; createdAt: number }) => {
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
    ).then((tickets) => {
      if (mounted) setTickets(tickets);
    });
    return () => { mounted = false; };
  }, [stableRawTickets]);

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