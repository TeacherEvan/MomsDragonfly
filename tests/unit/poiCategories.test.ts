import { describe, expect, it } from "vitest";

import { categoryLabel, sourceLabel } from "@/lib/poi/categories";

describe("categoryLabel", () => {
  it("maps known category keys to friendly labels", () => {
    expect(categoryLabel("pharmacy")).toBe("Pharmacy");
    expect(categoryLabel("toilets")).toBe("Restroom");
    expect(categoryLabel("restaurant")).toBe("Food");
    expect(categoryLabel("entertainment")).toBe("Events");
  });

  it("sentence-cases unknown keys instead of showing raw tag values", () => {
    expect(categoryLabel("tourist_attraction")).toBe("Tourist attraction");
  });

  it("falls back to Place when there is no category", () => {
    expect(categoryLabel("")).toBe("Place");
    expect(categoryLabel(undefined)).toBe("Place");
  });

  it("does not resolve Object.prototype keys as labels", () => {
    expect(categoryLabel("constructor")).toBe("Constructor");
  });
});

describe("sourceLabel", () => {
  it("names the data source in plain words", () => {
    expect(sourceLabel("google")).toBe("Google");
    expect(sourceLabel("osm")).toBe("OpenStreetMap");
    expect(sourceLabel("brave")).toBe("Web search");
  });

  it("returns null for a missing source", () => {
    expect(sourceLabel(undefined)).toBeNull();
  });
});
