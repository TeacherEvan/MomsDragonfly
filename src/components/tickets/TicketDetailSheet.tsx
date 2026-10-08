"use client";
import React from "react";

import { Icon } from "@/components/ui/Icon";
import { formatAmount } from "@/lib/utils/currency";
import type { Ticket } from "@/types";

export interface TicketDetailSheetProps {
  ticket: (Ticket & { pendingSync?: boolean }) | null;
  currency: string;
  onClose: () => void;
  onDelete: (ticket: Ticket) => void;
}

export function TicketDetailSheet({
  ticket,
  currency,
  onClose,
  onDelete,
}: TicketDetailSheetProps) {
  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-detail-title"
      aria-describedby="ticket-detail-meta"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-dragonfly-navy-900 border border-dragonfly-navy-700 rounded-2xl overflow-hidden shadow-strong"
        onClick={(e) => e.stopPropagation()}
      >
        {ticket.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ticket.imageUrl}
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
              <h3 id="ticket-detail-title" className="font-bold text-dragonfly-navy-50">
                {ticket.parsedVenue || "Scanned receipt"}
              </h3>
              <p id="ticket-detail-meta" className="text-caption text-dragonfly-navy-400">
                Scanned {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
            {ticket.pendingSync && (
              <span className="text-caption px-2 py-0.5 rounded-full bg-dragonfly-amber-500/15 text-dragonfly-amber-400 border border-dragonfly-amber-500/30 font-medium whitespace-nowrap">
                Saved offline
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-caption">
            {ticket.parsedAmount !== undefined && (
              <div>
                <span className="text-dragonfly-navy-400 block">Amount</span>
                <span className="font-bold text-dragonfly-teal-300">
                  {formatAmount(ticket.parsedAmount, currency)}
                </span>
              </div>
            )}
            {ticket.parsedDate && (
              <div>
                <span className="text-dragonfly-navy-400 block">Date</span>
                <span className="font-bold text-dragonfly-navy-50">
                  {new Date(ticket.parsedDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {ticket.ocrText && (
            <details className="text-caption text-dragonfly-navy-400">
              <summary className="cursor-pointer font-medium hover:text-dragonfly-navy-200 transition-colors">
                Recognised text
              </summary>
              <pre className="mt-1.5 p-2 bg-dragonfly-navy-950 rounded-lg border border-dragonfly-navy-700 whitespace-pre-wrap font-mono text-[10px] max-h-40 overflow-auto text-dragonfly-navy-300">
                {ticket.ocrText}
              </pre>
            </details>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onDelete(ticket)}
              className="flex-1 py-2.5 rounded-xl bg-dragonfly-rose-500/15 hover:bg-dragonfly-rose-500/25 border border-dragonfly-rose-500/40 text-dragonfly-rose-300 font-semibold text-caption transition-colors active:scale-[0.98]"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-dragonfly-navy-800 hover:bg-dragonfly-navy-700 border border-dragonfly-navy-700 text-dragonfly-navy-200 font-semibold text-caption transition-colors active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
