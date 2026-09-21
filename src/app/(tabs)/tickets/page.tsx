"use client";
import dynamic from "next/dynamic";

const TicketsClient = dynamic(() => import("./TicketsClient"), {
  ssr: false,
  loading: () => (
    <div className="p-4 text-center text-dragonfly-navy-400">
      Loading tickets...
    </div>
  ),
});

export default function TicketsPage() {
  return <TicketsClient />;
}