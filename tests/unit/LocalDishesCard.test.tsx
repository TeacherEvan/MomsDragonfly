import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocalDishesCard } from "@/components/explore/LocalDishesCard";

const { getLocalDishesMock } = vi.hoisted(() => ({
  getLocalDishesMock: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useAction: () => getLocalDishesMock,
}));

vi.mock("@/app/providers", () => ({
  api: { actions: { getLocalDishes: "actions:getLocalDishes" } },
}));

vi.mock("@/lib/utils/deviceId", () => ({
  getDeviceId: () => "00000000-0000-4000-8000-000000000000",
}));

describe("LocalDishesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially while fetching", () => {
    getLocalDishesMock.mockReturnValue(new Promise(() => {}));
    render(<LocalDishesCard lat={-25.75} lng={28.24} />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading local dishes");
  });

  it("renders dishes list with Google Maps search link", async () => {
    getLocalDishesMock.mockResolvedValue({
      areaName: "Pretoria",
      dishes: [
        {
          name: "Bobotie",
          description: "A spiced minced meat bake with egg custard.",
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Bobotie.jpg/200px-Bobotie.jpg",
        },
      ],
      fetchedAt: Date.now(),
    });

    render(<LocalDishesCard lat={-25.75} lng={28.24} />);

    expect(await screen.findByText("Taste of Pretoria")).toBeInTheDocument();
    expect(screen.getByText("Bobotie")).toBeInTheDocument();
    expect(screen.getByText("A spiced minced meat bake with egg custard.")).toBeInTheDocument();

    const mapsLink = screen.getByRole("link", { name: /find places serving this/i });
    expect(mapsLink).toBeInTheDocument();
    expect(mapsLink).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Bobotie+Pretoria"
    );
  });
});
