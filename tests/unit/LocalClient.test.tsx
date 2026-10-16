import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LocalClient from "@/components/local/LocalClient";

const { useGeolocationMock, getHighlightsMock, getLocalDishesMock, getLocalPhrasesMock } =
  vi.hoisted(() => ({
    useGeolocationMock: vi.fn(),
    getHighlightsMock: vi.fn(),
    getLocalDishesMock: vi.fn(),
    getLocalPhrasesMock: vi.fn(),
  }));

vi.mock("@/hooks/useGeolocation", () => ({
  useGeolocation: () => useGeolocationMock(),
}));

vi.mock("convex/react", () => ({
  useAction: (name: string) => {
    if (name === "actions:getHighlights") return getHighlightsMock;
    if (name === "actions:getLocalDishes") return getLocalDishesMock;
    if (name === "actions:getLocalPhrases") return getLocalPhrasesMock;
    return vi.fn();
  },
}));

vi.mock("@/app/providers", () => ({
  api: {
    actions: {
      getHighlights: "actions:getHighlights",
      getLocalDishes: "actions:getLocalDishes",
      getLocalPhrases: "actions:getLocalPhrases",
    },
  },
}));

vi.mock("@/lib/utils/deviceId", () => ({
  getDeviceId: () => "00000000-0000-4000-8000-000000000000",
}));

vi.mock("@/components/shell/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe("LocalClient search box and filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    useGeolocationMock.mockReturnValue({
      lat: -25.75,
      lng: 28.24,
      error: null,
    });
    getHighlightsMock.mockResolvedValue({
      locationName: "Pretoria",
      weather: { tempC: 25, feelsC: 25, windKmh: 10, code: 0, isDay: true, maxC: 28, minC: 15 },
      news: [{ title: "Pretoria Botanical Gardens Bloom", url: "https://example.com/botanical" }],
      fetchedAt: Date.now(),
    });
    getLocalDishesMock.mockResolvedValue({
      areaName: "Pretoria",
      dishes: [{ name: "Bobotie", description: "Spiced mince bake", imageUrl: null }],
      fetchedAt: Date.now(),
    });
    getLocalPhrasesMock.mockResolvedValue({
      areaName: "Pretoria",
      language: "Afrikaans",
      phrases: [{ local: "Hallo", roman: "Hallo", english: "Hello", note: "" }],
      fetchedAt: Date.now(),
    });
  });

  it("renders search box when user location is available", async () => {
    await act(async () => {
      render(<LocalClient />);
    });

    const searchInput = screen.getByPlaceholderText(
      /filter by location, dish, phrase, or keyword/i
    );
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("type", "search");
  });

  it("updates search input value and clears on clear button click", async () => {
    await act(async () => {
      render(<LocalClient />);
    });

    const searchInput = screen.getByPlaceholderText(
      /filter by location, dish, phrase, or keyword/i
    );
    expect(searchInput).toHaveValue("");

    // Clear button is not visible when empty
    expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();

    // Type query
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Pretoria" } });
    });
    expect(searchInput).toHaveValue("Pretoria");

    // Clear button is visible
    const clearBtn = screen.getByRole("button", { name: /clear search/i });
    expect(clearBtn).toBeInTheDocument();

    // Click clear
    await act(async () => {
      fireEvent.click(clearBtn);
    });
    expect(searchInput).toHaveValue("");
  });

  it("passes search query across tab switches", async () => {
    await act(async () => {
      render(<LocalClient />);
    });

    const searchInput = screen.getByPlaceholderText(
      /filter by location, dish, phrase, or keyword/i
    );
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Bobotie" } });
    });

    // Switch to "Taste of the area" tab
    const tasteTab = screen.getByRole("tab", { name: /taste of the area/i });
    await act(async () => {
      fireEvent.click(tasteTab);
    });

    expect(await screen.findByText("Bobotie")).toBeInTheDocument();
    expect(searchInput).toHaveValue("Bobotie");
  });
});

