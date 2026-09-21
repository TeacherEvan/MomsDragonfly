import { set, get, del, keys } from "idb-keyval";

/* ── Blobs (the actual photos) ─────────────────────────────────────────── */

const blobKey = (id: string) => `ticket:${id}`;

export async function saveTicketBlob(id: string, blob: Blob): Promise<void> {
  if (typeof window === "undefined") return;
  await set(blobKey(id), blob);
}

export async function loadTicketBlob(id: string): Promise<Blob | undefined> {
  if (typeof window === "undefined") return undefined;
  return get<Blob>(blobKey(id));
}

export async function deleteTicketBlob(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  await del(blobKey(id));
}

/* ── Records (local-first source of truth) ─────────────────────────────── */

export interface LocalTicketRecord {
  /** Local id (`local:<uuid>`) or `cloud:<cloudId>` for imported cloud records. */
  id: string;
  /** Convex document id once synced. */
  cloudId?: string;
  createdAt: number;
  ocrText?: string;
  parsedDate?: number;
  parsedAmount?: number;
  parsedVenue?: string;
  /** True until the record has been pushed to Convex. */
  pendingSync: boolean;
  /** Enrichment pipeline state: pending → done/failed. */
  enrichment: "pending" | "done" | "failed";
}

const recKey = (id: string) => `ticketRec:${id}`;

export async function saveLocalTicketRecord(rec: LocalTicketRecord): Promise<void> {
  if (typeof window === "undefined") return;
  await set(recKey(rec.id), rec);
}

export async function saveLocalTicket(rec: LocalTicketRecord, blob: Blob): Promise<void> {
  await saveLocalTicketRecord(rec);
  await saveTicketBlob(rec.id, blob);
}

export async function updateLocalTicket(
  id: string,
  patch: Partial<LocalTicketRecord>
): Promise<void> {
  if (typeof window === "undefined") return;
  const rec = await get<LocalTicketRecord>(recKey(id));
  if (!rec) return;
  await set(recKey(id), { ...rec, ...patch });
}

export async function listLocalTickets(): Promise<LocalTicketRecord[]> {
  if (typeof window === "undefined") return [];
  const allKeys = await keys();
  const recs = (
    await Promise.all(
      allKeys
        .filter((k): k is string => typeof k === "string" && k.startsWith("ticketRec:"))
        .map((k) => get<LocalTicketRecord>(k))
    )
  ).filter((r): r is LocalTicketRecord => Boolean(r));
  return recs.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteLocalTicket(id: string): Promise<void> {
  await del(recKey(id));
  await deleteTicketBlob(id);
}
