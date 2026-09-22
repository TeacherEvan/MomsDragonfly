"use client";
import { useTripJournal } from "@/hooks/useTripJournal";

/** Headless component: runs the automatic journal recorder for the tab shell. */
export function TripRecorder() {
  useTripJournal();
  return null;
}