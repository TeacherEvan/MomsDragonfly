import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { POICard } from "@/components/poi/POICard";
import type { NormalizedPOI } from "@/types";

const poi: NormalizedPOI = {
  id: "p1",
  placeId: "ChIJ1",
  source: "google",
  name: "Corner Cafe",
  category: "restaurant",
  lat: -25.8,
  lng: 28.1,
  address: "1 Main Rd",
  rating: 4.5,
  verifiedCount: 2,
};

function setup() {
  const handlers = {
    onVerify: vi.fn(),
    onSelect: vi.fn(),
    onShowOnMap: vi.fn(),
    onRequestRide: vi.fn(),
  };
  render(<POICard poi={poi} {...handlers} />);
  return handlers;
}

describe("POICard selection", () => {
  it("opens details when the card itself is clicked", () => {
    const h = setup();
    fireEvent.click(screen.getByRole("button", { name: "Details for Corner Cafe" }));
    expect(h.onSelect).toHaveBeenCalledWith(poi);
    expect(h.onVerify).not.toHaveBeenCalled();
  });

  it("verifying a place does not open its details", () => {
    const h = setup();
    fireEvent.click(screen.getByRole("button", { name: "Verify Corner Cafe" }));
    expect(h.onVerify).toHaveBeenCalledTimes(1);
    expect(h.onSelect).not.toHaveBeenCalled();
  });

  it("pressing Enter on the verify button does not open its details", () => {
    const h = setup();
    fireEvent.keyDown(screen.getByRole("button", { name: "Verify Corner Cafe" }), {
      key: "Enter",
    });
    expect(h.onSelect).not.toHaveBeenCalled();
  });

  it("pressing Enter on the card opens its details", () => {
    const h = setup();
    fireEvent.keyDown(screen.getByRole("button", { name: "Details for Corner Cafe" }), {
      key: "Enter",
    });
    expect(h.onSelect).toHaveBeenCalledWith(poi);
  });

  it("the ride button requests a ride without opening details", () => {
    const h = setup();
    fireEvent.click(screen.getByRole("button", { name: "Request a ride to Corner Cafe" }));
    expect(h.onRequestRide).toHaveBeenCalledWith(poi);
    expect(h.onSelect).not.toHaveBeenCalled();
  });
});
