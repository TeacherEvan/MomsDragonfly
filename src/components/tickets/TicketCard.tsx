import React from "react";
import type { Ticket } from "@/types";
import { formatAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/Icon";

interface TicketCardProps {
  ticket: Ticket;
  currency: string;
  onDelete: () => void;
  onOpen?: () => void;
}

export function TicketCard({ ticket, currency, onDelete, onOpen }: TicketCardProps) {
  return (
    <div
      onClick={onOpen}
      className={cn(
        "flex gap-3 p-3 bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-xl border border-dragonfly-navy-700 shadow-soft items-center card-hover",
        onOpen && "cursor-pointer"
      )}
    >
      {ticket.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ticket.imageUrl}
          alt="Ticket receipt"
          className="w-16 h-16 object-cover rounded-lg border border-dragonfly-navy-700 shrink-0 bg-dragonfly-navy-950"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-dragonfly-teal-500/15 flex items-center justify-center shrink-0">
          <Icon name="ticket" size={26} className="text-dragonfly-teal-300/80" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-body text-dragonfly-navy-50 truncate">
          {ticket.parsedVenue || "Scanned Receipt"}
        </h4>
        {ticket.parsedAmount !== undefined && (
          <p className="text-caption font-bold text-dragonfly-teal-400 mt-0.5">
            {formatAmount(ticket.parsedAmount, currency)}
          </p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-dragonfly-navy-400 mt-1">
          {ticket.parsedDate && (
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={12} />
              {new Date(ticket.parsedDate).toLocaleDateString()}
            </span>
          )}
          <span>&bull; Scanned {new Date(ticket.createdAt).toLocaleDateString()}</span>
          {ticket.pendingSync && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dragonfly-amber-500/15 text-dragonfly-amber-400 border border-dragonfly-amber-500/30 font-medium">
              Saved offline
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-dragonfly-navy-400 hover:text-dragonfly-rose-400 p-2 min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center transition-colors duration-fast"
        aria-label="Delete ticket"
      >
        <Icon name="trash" size={17} />
      </button>
    </div>
  );
}
