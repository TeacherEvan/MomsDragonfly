"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { MapView } from "@/components/map/MapView";
import { Icon } from "@/components/ui/Icon";
import { formatDistance, getQuickPosition } from "@/lib/utils/geo";
import {
  formatDayLabel,
  mergeJournalDays,
  totalDistance,
} from "@/lib/journal/stats";
import type { Id } from "convex/_generated/dataModel";

interface HistoryPoint {
  _id: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface JournalNote {
  _id: string;
  text: string;
  lat?: number;
  lng?: number;
  createdAt: number;
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
  const notesData = useQuery(api.queries.journalNotesQuery, { deviceId });
  const prefs = useQuery(api.queries.prefsQuery, { deviceId });
  const addNoteMut = useMutation(api.mutations.addJournalNote);
  const deleteNoteMut = useMutation(api.mutations.deleteJournalNote);

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

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
    const merged = mergeJournalDays<JournalNote, HistoryPoint>(
      (notesData ?? []) as JournalNote[],
      chrono
    );
    return merged.map((d) => ({
      key: d.key,
      notes: d.notes,
      points: d.points,
      count: d.points.length,
      metres: totalDistance(d.points.slice().reverse()),
    }));
  }, [notesData, chrono]);

  const tripActive = !!prefs?.tripStartDate && Date.now() >= prefs.tripStartDate;
  const latest = chrono.length > 0 ? chrono[chrono.length - 1] : null;
  const noteCount = notesData === undefined ? null : (notesData as JournalNote[]).length;

  const handleAddNote = async () => {
    const text = noteText.trim();
    if (!text || noteSaving) return;
    setNoteSaving(true);
    setNoteError(null);
    try {
      // Optionally pin the note to where the writer is right now — never blocks.
      const pos = await getQuickPosition();
      await addNoteMut({
        deviceId,
        text,
        ...(pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : {}),
      });
      setNoteText("");
    } catch (err) {
      console.warn("Note save failed:", err);
      setNoteError("Couldn't save the note — check your connection and try again.");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    deleteNoteMut({ id: id as Id<"journalNotes">, deviceId }).catch((err) => {
      console.warn("Note delete failed:", err);
    });
  };

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

      {/* Write a note — always available, even before the trip starts */}
      <section
        aria-label="Add a journal note"
        className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-4"
      >
        <label
          htmlFor="journal-note"
          className="mb-1.5 block text-caption font-semibold uppercase tracking-wide text-dragonfly-navy-500"
        >
          Add a note
        </label>
        <textarea
          id="journal-note"
          rows={3}
          maxLength={500}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="A memory, a little moment, something to remember…"
          className="w-full resize-none rounded-lg border border-dragonfly-navy-700 bg-dragonfly-navy-950 px-3 py-2 text-body text-dragonfly-navy-50 placeholder-dragonfly-navy-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-caption text-dragonfly-navy-600">{noteText.length}/500</span>
          <button
            type="button"
            onClick={handleAddNote}
            disabled={!noteText.trim() || noteSaving}
            className="min-h-[var(--touch-target)] rounded-lg bg-dragonfly-orange-500 px-4 py-2 text-xs font-bold text-dragonfly-navy-950 transition-colors duration-fast hover:bg-dragonfly-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {noteSaving ? "Saving…" : "Save note"}
          </button>
        </div>
        {noteError && <p className="mt-2 text-caption text-dragonfly-rose-400">{noteError}</p>}
      </section>

      {!tripActive && (
        <p className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-3 text-caption text-dragonfly-navy-400">
          Your journal starts recording automatically once your trip start date begins. Set your
          trip start date in Settings.
        </p>
      )}

      {(pointsData === undefined || notesData === undefined) && (
        <div className="h-40 animate-pulse rounded-xl border border-dragonfly-navy-800 bg-surface-900/60" />
      )}

      {chrono.length >= 2 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Distance" value={formatDistance(totalMetres)} />
            <Stat label="Pins" value={String(chrono.length)} />
            <Stat label="Notes" value={noteCount === null ? "—" : String(noteCount)} />
          </div>

          <MapView
            pois={[]}
            center={latest ? [latest.lat, latest.lng] : undefined}
            onVerify={() => {}}
            trail={trail}
          />
        </>
      )}

      {pointsData !== undefined &&
        notesData !== undefined &&
        chrono.length < 2 &&
        (notesData as JournalNote[]).length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-dragonfly-navy-700 bg-surface-900/60 px-6 py-10 text-center">
            <Icon name="route" size={36} className="mb-3 text-dragonfly-teal-400" />
            <p className="font-medium text-dragonfly-navy-300">No journey pins yet</p>
            <p className="mt-1 max-w-xs text-caption text-dragonfly-navy-500">
              Once your trip start date begins, Dragonfly quietly records where you go — every pin
              stays private to this device. You can write notes any time, even now.
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
                  {day.notes.length > 0 && (
                    <>
                      {day.notes.length} note{day.notes.length === 1 ? "" : "s"}
                      {day.count > 0 ? " · " : ""}
                    </>
                  )}
                  {day.count > 0 && (
                    <>
                      {day.count} pins · {formatDistance(day.metres)}
                    </>
                  )}
                </span>
              </header>

              {day.notes.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {day.notes.map((note) => (
                    <li
                      key={note._id}
                      className="rounded-lg border border-dragonfly-orange-500/25 bg-dragonfly-orange-500/10 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="whitespace-pre-wrap text-body text-dragonfly-navy-100">
                          {note.text}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note._id)}
                          aria-label="Delete note"
                          className="shrink-0 rounded-md p-1 text-dragonfly-navy-500 transition-colors hover:text-dragonfly-rose-400"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-caption text-dragonfly-navy-500">
                        {new Date(note.createdAt).toLocaleTimeString("en-ZA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {note.lat !== undefined && note.lng !== undefined && (
                          <span className="inline-flex items-center gap-1 text-dragonfly-orange-400">
                            <Icon name="map-pin" size={11} /> pinned
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {day.count > 0 && (
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
              )}
            </section>
          ))}
        </div>
      )}

      <p className="text-center text-caption text-dragonfly-navy-600">
        Journal pins and notes are stored per device — no other user of Dragonfly can see them.
      </p>
    </div>
  );
}