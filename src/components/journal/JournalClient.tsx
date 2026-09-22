"use client";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { MapView } from "@/components/map/MapView";
import { Icon } from "@/components/ui/Icon";
import { formatDistance } from "@/lib/utils/geo";
import { formatDayLabel, groupByDay, totalDistance } from "@/lib/journal/stats";

interface HistoryPoint {
  _id: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-3 text-center">
      <p className="text-body font-bold text-dragonfly-navy-50">{value}</p>
      <p className="text-caption text-dragonfly-navy-500">{label}</p>
    </div>
  );
}

export function JournalClient() {
  const deviceId = getDeviceId();
  const pointsData = useQuery(api.queries.historyQuery, { deviceId, limit: 1000 });
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });

  const chrono = useMemo<HistoryPoint[]>(
    () =>
      ((pointsData ?? []) as HistoryPoint[])
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp),
    [pointsData]
  );

  const trail = useMemo(
    () => chrono.map((p) => [p.lat, p.lng] as [number, number]),
    [chrono]
  );

  const totalMetres = useMemo(() => totalDistance(chrono), [chrono]);

  const days = useMemo(() => {
    const groups = groupByDay<HistoryPoint>(chrono.slice().reverse());
    return groups.map((g) => ({
      key: g.key,
      count: g.points.length,
      metres: totalDistance(g.points.slice().reverse()),
      points: g.points,
    }));
  }, [chrono]);

  const tripActive = !!prefs?.tripStartDate && Date.now() >= prefs.tripStartDate;
  const latest = chrono.length > 0 ? chrono[chrono.length - 1] : null;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 font-bold text-dragonfly-navy-50">Trip Journal</h1>
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold " +
            (tripActive
              ? "bg-dragonfly-orange-500/15 text-dragonfly-orange-400"
              : "bg-dragonfly-navy-800 text-dragonfly-navy-400")
          }
        >
          <span
            className={
              "h-2 w-2 rounded-full " +
              (tripActive ? "bg-dragonfly-orange-400 animate-pulse" : "bg-dragonfly-navy-500")
            }
          />
          {tripActive ? "Recording" : "Standby"}
        </span>
      </div>

      {!tripActive && (
        <p className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-3 text-caption text-dragonfly-navy-400">
          Your journal starts recording automatically once your trip start date begins. Set your
          trip start date in Settings.
        </p>
      )}

      {pointsData === undefined && (
        <div className="h-40 animate-pulse rounded-xl border border-dragonfly-navy-800 bg-surface-900/60" />
      )}

      {chrono.length >= 2 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Distance" value={formatDistance(totalMetres)} />
            <Stat label="Pins" value={String(chrono.length)} />
            <Stat label="Days" value={String(days.length)} />
          </div>

          <MapView
            pois={[]}
            center={latest ? [latest.lat, latest.lng] : undefined}
            onVerify={() => {}}
            trail={trail}
          />
        </>
      )}

      {pointsData !== undefined && chrono.length < 2 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-dragonfly-navy-700 bg-surface-900/60 px-6 py-10 text-center">
          <Icon name="route" size={36} className="mb-3 text-dragonfly-teal-400" />
          <p className="font-medium text-dragonfly-navy-300">No journey pins yet</p>
          <p className="mt-1 max-w-xs text-caption text-dragonfly-navy-500">
            Once your trip start date begins, Dragonfly quietly records where you go — every pin
            stays private to this device.
          </p>
        </div>
      )}

      {days.length > 0 && (
        <div className="flex flex-col gap-3">
          {days.map((day) => (
            <section
              key={day.key}
              className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-4"
            >
              <header className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold text-dragonfly-navy-100 text-body">
                  {formatDayLabel(day.key)}
                </h2>
                <span className="text-caption text-dragonfly-navy-500">
                  {day.count} pins · {formatDistance(day.metres)}
                </span>
              </header>
              <ul className="space-y-1.5">
                {day.points.slice(0, 40).map((p) => (
                  <li key={p._id} className="flex items-center justify-between gap-2 text-caption">
                    <span className="inline-flex items-center gap-1.5 text-dragonfly-navy-300">
                      <Icon name="map-pin" size={13} className="text-dragonfly-orange-400" />
                      {new Date(p.timestamp).toLocaleTimeString("en-ZA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="font-mono text-dragonfly-navy-500">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </span>
                  </li>
                ))}
                {day.count > 40 && (
                  <li className="text-caption text-dragonfly-navy-600">
                    + {day.count - 40} more pins
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-center text-caption text-dragonfly-navy-600">
        Journal pins are stored per device — no other user of Dragonfly can see them.
      </p>
    </div>
  );
}