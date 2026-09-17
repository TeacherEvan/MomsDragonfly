export type POISource = "google" | "osm" | "brave";
export type ExpenseCategory = "food" | "transport" | "accommodation" | "attraction" | "other";
export type ReminderRepeat = "none" | "daily" | "weekly";

export interface NormalizedPOI {
  id: string;
  placeId: string;
  source: POISource;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distanceMetres?: number;
  address?: string;
  rating?: number;
  phone?: string;
  openNow?: boolean;
  verifiedCount: number;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note?: string;
  date: number;
  ticketId?: string;
}

export interface Reminder {
  id: string;
  title: string;
  body?: string;
  dueAt: number;
  repeat: ReminderRepeat;
  done: boolean;
}

export interface Ticket {
  id: string;
  imageUrl?: string;
  ocrText?: string;
  parsedDate?: number;
  parsedAmount?: number;
  parsedVenue?: string;
  createdAt: number;
}
