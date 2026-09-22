import { describe, it, expect } from "vitest";
import { parseDishResponse, fallbackDishes } from "../../convex/dishHelpers";

describe("parseDishResponse", () => {
  it("parses a clean JSON array", () => {
    const raw = JSON.stringify([
      { name: "Pad Thai", description: "Noodles with tamarind." },
      { name: "Som Tam", description: "Papaya salad." },
    ]);
    const out = parseDishResponse(raw);
    expect(out).toHaveLength(2);
    expect(out?.[0]).toEqual({
      name: "Pad Thai",
      description: "Noodles with tamarind.",
      imageUrl: null,
    });
  });

  it("tolerates markdown fences and surrounding prose", () => {
    const raw =
      'Sure! Here you go:\n```json\n[{"name":"Bobotie","description":"Spiced bake."}]\n```';
    expect(parseDishResponse(raw)).toHaveLength(1);
  });

  it("returns null for garbage or empty input", () => {
    expect(parseDishResponse("no json here")).toBeNull();
    expect(parseDishResponse("")).toBeNull();
    expect(parseDishResponse("[not valid json")).toBeNull();
  });

  it("skips invalid entries and caps the list at 8", () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      name: `Dish ${i}`,
      description: "Tasty.",
    }));
    const out = parseDishResponse(JSON.stringify(items));
    expect(out).toHaveLength(8);
    expect(
      parseDishResponse(
        JSON.stringify([
          { name: "" , description: "x" },
          { name: "Ok", description: "" },
        ])
      )
    ).toBeNull();
  });
});

describe("fallbackDishes", () => {
  it("matches Pretoria (case-insensitive, country helps)", () => {
    const out = fallbackDishes("Pretoria", "South Africa");
    expect(out).toHaveLength(6);
    expect(out.some((d) => d.name === "Bobotie")).toBe(true);
  });

  it("matches Bangkok", () => {
    const out = fallbackDishes("bangkok", "Thailand");
    expect(out.some((d) => d.name === "Pad Thai")).toBe(true);
  });

  it("returns [] for unknown areas", () => {
    expect(fallbackDishes("Paris", "France")).toEqual([]);
    expect(fallbackDishes(null, null)).toEqual([]);
  });
});