import React from "react";
import type { Ticket } from "@/types";
import { formatAmount } from "@/lib/utils/currency";

interface TicketCardProps {
  ticket: Ticket;
  currency: string;
  onDelete: () => void;
}

export function TicketCard({ ticket, currency, onDelete }: TicketCardProps) {
  return (
    <div className="flex gap-3 p-3 bg-surface-900/80 backdrop-blur-sm rounded-xl border border-neutral-800 shadow-soft items-center">
      {ticket.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ticket.imageUrl}
          alt="Ticket receipt"
          className="w-16 h-16 object-cover rounded-lg border border-neutral-800 shrink-0 bg-neutral-900"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-primary-500/15 flex items-center justify-center text-xl shrink-0">
          🎟️
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-body text-neutral-50 truncate">
          {ticket.parsedVenue || "Scanned Receipt"}
        </h4>
        {ticket.parsedAmount !== undefined && (
          <p className="text-caption font-bold text-primary-400 mt-0.5">
            {formatAmount(ticket.parsedAmount, currency)}
          </p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
          {ticket.parsedDate && (
            <span>📅 {new Date(ticket.parsedDate).toLocaleDateString()}</span>
          )}
          <span>&bull; Scanned {new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="text-neutral-500 hover:text-rose-400 p-2 text-sm font-bold min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center transition-colors duration-fast"
        aria-label="Delete ticket"
      >
        ✕
      </button>
    </div>
  );
}
