import { set, get, del } from "idb-keyval";

const key = (id: string) => `ticket:${id}`;

export async function saveTicketBlob(id: string, blob: Blob): Promise<void> {
  if (typeof window === "undefined") return;
  await set(key(id), blob);
}

export async function loadTicketBlob(id: string): Promise<Blob | undefined> {
  if (typeof window === "undefined") return undefined;
  return get<Blob>(key(id));
}

export async function deleteTicketBlob(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  await del(key(id));
}
