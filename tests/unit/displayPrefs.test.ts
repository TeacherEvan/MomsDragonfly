import { describe, it, expect, beforeEach } from "vitest";
import {
  getDisplayPrefs,
  setDisplayPrefs,
  applyDisplayPrefs,
  DISPLAY_PREFS_KEY,
} from "@/lib/utils/displayPrefs";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

describe("displayPrefs", () => {
  it("returns defaults when empty", () => {
    expect(getDisplayPrefs()).toEqual({ largeText: false, reduceMotion: false, highContrast: false });
  });

  it("persists and reads back", () => {
    setDisplayPrefs({ largeText: true, reduceMotion: true, highContrast: false });
    expect(JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY)!).largeText).toBe(true);
    expect(getDisplayPrefs().reduceMotion).toBe(true);
  });

  it("applies html classes", () => {
    applyDisplayPrefs({ largeText: true, reduceMotion: true, highContrast: true });
    const cls = document.documentElement.classList;
    expect(cls.contains("large-text")).toBe(true);
    expect(cls.contains("reduce-motion")).toBe(true);
    expect(cls.contains("high-contrast")).toBe(true);
  });

  it("ignores corrupt JSON", () => {
    localStorage.setItem(DISPLAY_PREFS_KEY, "not-json");
    expect(getDisplayPrefs().largeText).toBe(false);
  });
});
