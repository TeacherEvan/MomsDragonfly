import { describe, it, expect } from "vitest";
import {
  buildBoltUrl,
  buildMapsUrl,
  buildDestinationText,
} from "@/lib/ride/links";

const dest = {
  name: "Safari Pantry",
  lat: -25.7461,
  lng: 28.237,
  address: "867 Cliffendale Dr",
};

describe("buildBoltUrl", () => {
  it("points at bolt.eu over https", () => {
    expect(buildBoltUrl()).toBe("https://bolt.eu/");
  });
});

describe("buildMapsUrl", () => {
  it("includes a prefilled destination", () => {
    const url = buildMapsUrl(dest);
    expect(url).toContain("destination=-25.7461%2C28.237");
    expect(url).toContain("travelmode=driving");
    expect(url).not.toContain("origin=");
  });

  it("includes pickup when provided", () => {
    const url = buildMapsUrl(dest, { lat: -25.75, lng: 28.24 });
    expect(url).toContain("origin=-25.75%2C28.24");
  });
});

describe("buildDestinationText", () => {
  it("joins name, address and coordinates", () => {
    expect(buildDestinationText(dest)).toBe(
      "Safari Pantry — 867 Cliffendale Dr — -25.74610, 28.23700"
    );
  });

  it("skips missing address", () => {
    expect(buildDestinationText({ name: "X", lat: 1, lng: 2 })).toBe(
      "X — 1.00000, 2.00000"
    );
  });
});