"use client";
import { useQuery, useMutation, useAction } from "convex/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { runTesseract } from "@/lib/tickets/ocr";
import { parseTicket } from "@/lib/tickets/parse";
import {
  listLocalTickets,
  saveLocalTicket,
  saveLocalTicketRecord,
  updateLocalTicket,
  deleteLocalTicket,
  loadTicketBlob,
  type LocalTicketRecord,
} from "@/lib/idb/tickets";
import { TicketScanner } from "@/components/tickets/TicketScanner";
import { OCRResult } from "@/components/tickets/OCRResult";
import { TicketGallery } from "@/components/tickets/TicketGallery";
import { formatAmount } from "@/lib/utils/currency";
import { Icon } from "@/components/ui/Icon";
import type { Ticket } from "@/types";

interface UITicket extends Ticket {
  localId: string;
  cloudId?: string;
  pendingSync: boolean;
  enrichment: LocalTicketRecord["enrichment"];
}

interface CloudTicket {
  _id: string;
  ocrText?: string;
  parsedDate?: number;
  parsedAmount?: number;
  parsedVenue?: string;
  createdAt: number;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function TicketsClient() {
  const deviceId = getDeviceId();
  const cloudTickets = useQuery(api.queries.ticketsQuery, { deviceId }) as
    | CloudTicket[]
    | undefined;
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const createTicketMut = useMutation(api.mutations.createTicket);
  const deleteTicketMut = useMutation(api.mutations.deleteTicket);
  const geminiAction = useAction(api.actions.geminiOCR);

  const [tickets, setTickets] = useState<UITicket[]>([]);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastCaptureId, setLastCaptureId] = useState<string | null>(null);
  const [aiState, setAiState] = useState<"idle" | "working" | "done" | "failed">("idle");
  const [selected, setSelected] = useState<UITicket | null>(null);
  const urlMapRef = useRef<Map<string, string>>(new Map());

  const refreshLocal = useCallback(async () => {
    const recs = await listLocalTickets();
    const items: UITicket[] = [];
    for (const r of recs) {
      let url = urlMapRef.current.get(r.id);
      if (!url) {
        const blob = await loadTicketBlob(r.id);
        if (blob) {
          url = URL.createObjectURL(blob);
          urlMapRef.current.set(r.id, url);
        }
      }
      items.push({
        id: r.cloudId ?? r.id,
        localId: r.id,
        cloudId: r.cloudId,
        imageUrl: url,
        ocrText: r.ocrText,
        parsedDate: r.parsedDate,
        parsedAmount: r.parsedAmount,
        parsedVenue: r.parsedVenue,
        createdAt: r.createdAt,
        pendingSync: r.pendingSync,
        enrichment: r.enrichment,
      });
    }
    setTickets(items);
  }, []);

  // Revoke object URLs on unmount
  useEffect(() => {
    const map = urlMapRef.current;
    return () => {
      map.forEach((u) => URL.revokeObjectURL(u));
      map.clear();
    };
  }, []);

  const trySync = useCallback(
    async (localId: string) => {
      const recs = await listLocalTickets();
      const rec = recs.find((r) => r.id === localId);
      if (!rec || !rec.pendingSync) return;
      try {
        const cloudId = (await createTicketMut({
          deviceId,
          ocrText: rec.ocrText,
          parsedDate: rec.parsedDate,
          parsedAmount: rec.parsedAmount,
          parsedVenue: rec.parsedVenue,
        })) as string;
        await updateLocalTicket(localId, { cloudId, pendingSync: false });
      } catch {
        // still offline — stays pending, retried on next load
      }
    },
    [createTicketMut, deviceId]
  );

  // Initial load: push pending records, import cloud-only records, then render
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const recs = await listLocalTickets();
      for (const r of recs.filter((r) => r.pendingSync)) {
        await trySync(r.id);
      }
      if (cloudTickets) {
        const known = new Set(
          (await listLocalTickets()).map((r) => r.cloudId).filter(Boolean)
        );
        for (const ct of cloudTickets) {
          if (!known.has(ct._id)) {
            await saveLocalTicketRecord({
              id: `cloud:${ct._id}`,
              cloudId: ct._id,
              createdAt: ct.createdAt,
              ocrText: ct.ocrText,
              parsedDate: ct.parsedDate,
              parsedAmount: ct.parsedAmount,
              parsedVenue: ct.parsedVenue,
              pendingSync: false,
              enrichment: "done",
            });
          }
        }
      }
      if (!cancelled) await refreshLocal();
    })();
    return () => {
      cancelled = true;
    };
  }, [cloudTickets, refreshLocal, trySync]);

  const handleCapture = useCallback(
    async (blob: Blob) => {
      setProcessing(true);
      setNotice(null);
      try {
        const localId = `local:${crypto.randomUUID()}`;
        const rec: LocalTicketRecord = {
          id: localId,
          createdAt: Date.now(),
          pendingSync: true,
          enrichment: "pending",
        };
        // 1) Save immediately — the photo is never lost
        await saveLocalTicket(rec, blob);
        await refreshLocal();
        setLastCaptureId(localId);
        setAiState("idle");
        setProcessing(false);

        // 2) Enrichment + sync in the background
        void (async () => {
          const { text } = await runTesseract(blob);
          const parsed = parseTicket(text);
          const hasData = Boolean(parsed.date || parsed.amount || parsed.venue);
          await updateLocalTicket(localId, {
            ocrText: text || undefined,
            parsedDate: parsed.date,
            parsedAmount: parsed.amount,
            parsedVenue: parsed.venue,
            enrichment: hasData ? "done" : "failed",
          });
          await refreshLocal();
          await trySync(localId);
          await refreshLocal();
        })();
      } catch (err) {
        console.warn("Ticket save failed", err);
        setNotice("Could not save the photo. Please try again.");
        setProcessing(false);
      }
    },
    [refreshLocal, trySync]
  );

  const handleAnalyzeWithAI = useCallback(async () => {
    if (!lastCaptureId) return;
    const blob = await loadTicketBlob(lastCaptureId);
    if (!blob) return;
    setAiState("working");
    setNotice(null);
    try {
      const base64 = await blobToBase64(blob);
      const result = await Promise.race([
        geminiAction({ imageBase64: base64, mimeType: blob.type || "image/jpeg" }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI analysis timed out")), 45_000)
        ),
      ]);
      if (!result.ok) {
        setAiState("failed");
        setNotice(result.reason ?? "AI analysis unavailable");
        return;
      }
      const parsed = parseTicket(result.text);
      await updateLocalTicket(lastCaptureId, {
        ocrText: result.text || undefined,
        parsedDate: parsed.date,
        parsedAmount: parsed.amount,
        parsedVenue: parsed.venue,
        enrichment: "done",
      });
      setAiState("done");
      await refreshLocal();
      await trySync(lastCaptureId);
      await refreshLocal();
    } catch (err) {
      console.warn("AI analysis failed", err);
      setAiState("failed");
      setNotice("AI analysis failed — your photo is saved.");
    }
  }, [lastCaptureId, geminiAction, refreshLocal, trySync]);

  const handleDelete = useCallback(
    async (ticket: Ticket) => {
      const t = ticket as UITicket;
      await deleteLocalTicket(t.localId);
      if (t.cloudId) {
        try {
          await deleteTicketMut({
            id: t.cloudId as Parameters<typeof deleteTicketMut>[0]["id"],
            deviceId,
          });
        } catch {
          // best-effort cloud cleanup
        }
      }
      setSelected(null);
      await refreshLocal();
    },
    [deleteTicketMut, deviceId, refreshLocal]
  );

  const lastCapture = tickets.find((t) => t.localId === lastCaptureId) ?? null;
  const showEnrichmentPanel = Boolean(
    lastCapture &&
      (lastCapture.enrichment === "failed" ||
        aiState === "working" ||
        aiState === "done")
  );
  const currency = prefs?.currency ?? "USD";

  return (
    <div>
      <header className="px-4 py-3 border-b border-dragonfly-navy-800">
        <h1 className="text-h1 font-bold text-dragonfly-navy-50">Tickets</h1>
      </header>
      <div className="p-4 space-y-4">
        <TicketScanner onCapture={handleCapture} isProcessing={processing} />

        {notice && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-dragonfly-amber-500/10 border border-dragonfly-amber-500/30 text-caption text-dragonfly-amber-400">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="font-bold px-2"
              aria-label="Dismiss"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        )}

        {lastCapture?.enrichment === "pending" && aiState === "idle" && (
          <div className="flex items-center gap-2 px-1 text-caption text-dragonfly-navy-400">
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-dragonfly-teal-400 border-t-transparent animate-spin" />
            Reading text from your photo…
          </div>
        )}

        {showEnrichmentPanel && lastCapture && (
          <OCRResult
            text={lastCapture.ocrText ?? ""}
            parsedDate={lastCapture.parsedDate}
            parsedAmount={lastCapture.parsedAmount}
            parsedVenue={lastCapture.parsedVenue}
            currency={currency}
            onRetryGemini={handleAnalyzeWithAI}
            isRetrying={aiState === "working"}
            aiError={aiState === "failed" ? notice : null}
          />
        )}
      </div>

      <TicketGallery
        tickets={tickets}
        currency={currency}
        onDelete={handleDelete}
        onOpen={(t) => setSelected(t as UITicket)}
      />

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md bg-dragonfly-navy-900 border border-dragonfly-navy-700 rounded-2xl overflow-hidden shadow-strong"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt="Ticket photo"
                className="w-full max-h-[55vh] object-contain bg-black"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-dragonfly-navy-950">
                <Icon name="ticket" size={44} className="text-dragonfly-navy-500" />
              </div>
            )}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-dragonfly-navy-50">
                    {selected.parsedVenue || "Scanned receipt"}
                  </h3>
                  <p className="text-caption text-dragonfly-navy-400">
                    Scanned {new Date(selected.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {selected.pendingSync && (
                  <span className="text-caption px-2 py-0.5 rounded-full bg-dragonfly-amber-500/15 text-dragonfly-amber-400 border border-dragonfly-amber-500/30 font-medium whitespace-nowrap">
                    Saved offline
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-caption">
                {selected.parsedAmount !== undefined && (
                  <div>
                    <span className="text-dragonfly-navy-400 block">Amount</span>
                    <span className="font-bold text-dragonfly-teal-300">
                      {formatAmount(selected.parsedAmount, currency)}
                    </span>
                  </div>
                )}
                {selected.parsedDate && (
                  <div>
                    <span className="text-dragonfly-navy-400 block">Date</span>
                    <span className="font-bold text-dragonfly-navy-50">
                      {new Date(selected.parsedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {selected.ocrText && (
                <details className="text-caption text-dragonfly-navy-400">
                  <summary className="cursor-pointer font-medium">
                    Recognised text
                  </summary>
                  <pre className="mt-1.5 p-2 bg-dragonfly-navy-950 rounded-lg border border-dragonfly-navy-700 whitespace-pre-wrap font-mono text-[10px] max-h-40 overflow-auto">
                    {selected.ocrText}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDelete(selected)}
                  className="flex-1 py-2.5 rounded-xl bg-dragonfly-rose-500/15 border border-dragonfly-rose-500/40 text-dragonfly-rose-300 font-semibold text-caption"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl bg-dragonfly-navy-800 border border-dragonfly-navy-700 text-dragonfly-navy-200 font-semibold text-caption"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
