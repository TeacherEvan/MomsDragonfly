/**
 * Pure helpers for the getLocalDishes action.
 *
 * Deliberately free of Convex imports so they can be unit-tested directly
 * (see tests/unit/dishes.test.ts).
 */

// Wiki lookup shared with the place-details fallback; re-exported here so the
// dishes flow keeps a single import surface for its image work.
export {
  wikipediaImages,
  wikipediaThumbnail,
  summaryThumbnail,
  searchResultTitles,
} from "./wikiHelpers";

export interface DishItem {
  name: string;
  description: string;
  imageUrl: string | null;
}

const MAX_DISHES = 8;

/**
 * Parse the model's reply into dish items.
 * Tolerates markdown fences and surrounding prose; returns null when unusable.
 */
export function parseDishResponse(raw: string): DishItem[] | null {
  if (!raw) return null;
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const items: DishItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const name =
      typeof (entry as { name?: unknown }).name === "string"
        ? (entry as { name: string }).name.trim()
        : "";
    const description =
      typeof (entry as { description?: unknown }).description === "string"
        ? (entry as { description: string }).description.trim()
        : "";
    if (!name || !description) continue;
    items.push({ name, description, imageUrl: null });
    if (items.length >= MAX_DISHES) break;
  }
  return items.length > 0 ? items : null;
}

/**
 * Curated fallback lists for areas we know by heart, used when the AI step is
 * unavailable. Matching is loose (case-insensitive substring) so "Pretoria",
 * "Tshwane" and a South Africa country match all land on the SA list.
 */
export function fallbackDishes(areaName: string | null, country: string | null): DishItem[] {
  const area = `${areaName ?? ""} ${country ?? ""}`.toLowerCase();

  if (
    area.includes("pretoria") ||
    area.includes("tshwane") ||
    area.includes("johannesburg") ||
    area.includes("south africa")
  ) {
    return [
      {
        name: "Boerewors",
        description:
          "South Africa's beloved coiled sausage, grilled over coals with coriander and cloves — best on a roll with tomato relish.",
        imageUrl: null,
      },
      {
        name: "Bobotie",
        description:
          "A gently spiced bake of minced beef under a golden egg custard, served with yellow rice, raisins and chutney.",
        imageUrl: null,
      },
      {
        name: "Pap and Chakalaka",
        description:
          "Creamy white maize porridge with a spicy relish of peppers, carrots and beans simmered in tomato.",
        imageUrl: null,
      },
      {
        name: "Vetkoek",
        description:
          "Golden fried dough buns — crisp outside, fluffy inside, split and filled with savoury mince or syrup.",
        imageUrl: null,
      },
      {
        name: "Melktert",
        description:
          "A silky cinnamon-dusted milk tart in a buttery crust — the dessert every South African gathering ends with.",
        imageUrl: null,
      },
      {
        name: "Koeksisters",
        description:
          "Plaited doughnuts fried golden then soaked in ice-cold syrup, crackling sticky-sweet with every bite.",
        imageUrl: null,
      },
    ];
  }

  if (area.includes("bangkok") || area.includes("thailand")) {
    return [
      {
        name: "Pad Thai",
        description:
          "Wok-fried rice noodles tossed with tamarind, palm sugar, egg, peanuts and lime — Thailand's most famous street dish.",
        imageUrl: null,
      },
      {
        name: "Som Tam",
        description:
          "Green papaya salad pounded with chilli, garlic, lime, fish sauce and peanuts — sour, sweet, salty and fiery at once.",
        imageUrl: null,
      },
      {
        name: "Tom Yum",
        description:
          "A hot-and-sour shrimp soup fragrant with lemongrass, galangal and kaffir lime leaves.",
        imageUrl: null,
      },
      {
        name: "Green Curry",
        description:
          "Coconut-milk curry simmered with green chillies and Thai basil — creamy yet bright, often with chicken.",
        imageUrl: null,
      },
      {
        name: "Mango Sticky Rice",
        description:
          "Warm coconut sticky rice served with sweet ripe mango and a drizzle of salted coconut cream.",
        imageUrl: null,
      },
      {
        name: "Boat Noodles",
        description:
          "Small, intensely savoury bowls of noodles in dark spiced broth — a Bangkok riverside tradition.",
        imageUrl: null,
      },
    ];
  }

  return [];
}