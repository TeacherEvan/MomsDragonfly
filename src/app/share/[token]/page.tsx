"use client";
import { useQuery } from "convex/react";
import { use } from "react";

import { api } from "@/app/providers";
import { MapView } from "@/components/map/MapView";

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const data = useQuery(api.queries.shareView, { token });

  if (data === undefined) {
    return (
      <main className="p-6 max-w-xl mx-auto text-dragonfly-navy-400 animate-pulse">
        Loading shared journal...
      </main>
    );
  }

  if (!data.shared) {
    return (
      <main className="p-6 max-w-xl mx-auto flex flex-col gap-2">
        <h1 className="text-h1 font-bold text-dragonfly-navy-50">
          Shared journal unavailable
        </h1>
        <p className="text-body text-dragonfly-navy-400">
          This share link is off or no longer valid. Ask the traveller to
          enable sharing again from their Trip Journal.
        </p>
      </main>
    );
  }

  const trail: Array<[number, number]> = data.points.map((p) => [p.lat, p.lng]);
  const latest = data.points[data.points.length - 1];

  return (
    <main className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 font-bold text-dragonfly-navy-50">
          Shared Trip Journal
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold bg-dragonfly-orange-500/15 text-dragonfly-orange-400">
          <span className="h-2 w-2 rounded-full bg-dragonfly-orange-400 animate-pulse" />
          Live
        </span>
      </div>
      <p className="text-caption text-dragonfly-navy-500">
        {latest
          ? `Last updated ${new Date(latest.timestamp).toLocaleString()} · ${data.points.length} pins · ${data.notes.length} notes`
          : "Waiting for the first recorded point..."}
      </p>
      <MapView
        pois={[]}
        center={latest ? [latest.lat, latest.lng] : undefined}
        onVerify={() => {}}
        trail={trail}
      />
      {data.notes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.notes.map((n) => (
            <li
              key={n._id}
              className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-3"
            >
              <p className="text-body text-dragonfly-navy-50">{n.text}</p>
              <p className="text-caption text-dragonfly-navy-500">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-caption text-dragonfly-navy-600 text-center">
        Shared via Mom&apos;s Dragonfly · read-only · updates automatically
      </p>
    </main>
  );
}
