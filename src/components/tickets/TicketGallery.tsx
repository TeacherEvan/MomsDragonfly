import React from "react";
import type { Ticket } from "@/types";
import { TicketCard } from "./TicketCard";

interface TicketGalleryProps {
  tickets: Ticket[];
  currency: string;
  onDelete: (id: string) => void;
}

export function TicketGallery({
  tickets,
  currency,
  onDelete,
}: TicketGalleryProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
        <span className="text-3xl mb-1 block" role="img" aria-label="ticket">
          🎟️
        </span>
        <p className="text-sm font-medium text-gray-500">No tickets saved</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Scan paper receipts or boarding passes to retain offline copies
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
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
