import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PhrasebookCard } from "@/components/local/PhrasebookCard";

const { getLocalPhrasesMock, copyTextMock, showToastMock } = vi.hoisted(() => ({
  getLocalPhrasesMock: vi.fn(),
  copyTextMock: vi.fn(),
  showToastMock: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useAction: () => getLocalPhrasesMock,
}));

vi.mock("@/app/providers", () => ({
  api: { actions: { getLocalPhrases: "actions:getLocalPhrases" } },
}));

vi.mock("@/lib/utils/deviceId", () => ({
  getDeviceId: () => "00000000-0000-4000-8000-000000000000",
}));

vi.mock("@/lib/utils/clipboard", () => ({
  copyText: copyTextMock,
}));

vi.mock("@/components/shell/Toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

describe("PhrasebookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially while fetching", () => {
    getLocalPhrasesMock.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<PhrasebookCard lat={-25.75} lng={28.24} />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading local phrases");
  });

  it("renders phrases list with local text, pronunciation, and translation", async () => {
    getLocalPhrasesMock.mockResolvedValue({
      areaName: "Pretoria",
      language: "Afrikaans",
      phrases: [
        { local: "Hallo", roman: "Hallo", english: "Hello", note: "Any time of day" },
        { local: "Dankie", roman: "DUNK-ee", english: "Thank you", note: "Common" },
      ],
      fetchedAt: Date.now(),
    });

    await act(async () => {
      render(<PhrasebookCard lat={-25.75} lng={28.24} />);
    });

    expect(screen.getByText("Essential Afrikaans")).toBeInTheDocument();
    expect(screen.getByText("Pretoria")).toBeInTheDocument();
    expect(screen.getByText("Hallo")).toBeInTheDocument();
    expect(screen.getByText("/Hallo/")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Dankie")).toBeInTheDocument();
    expect(screen.getByText("/DUNK-ee/")).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
  });

  it("copies phrase to clipboard when copy button is tapped", async () => {
    copyTextMock.mockResolvedValue(true);
    getLocalPhrasesMock.mockResolvedValue({
      areaName: "Bangkok",
      language: "Thai",
      phrases: [
        { local: "สวัสดี", roman: "sà-wàt-dee", english: "Hello", note: "Polite" },
      ],
      fetchedAt: Date.now(),
    });

    await act(async () => {
      render(<PhrasebookCard lat={13.75} lng={100.5} />);
    });

    const copyBtn = screen.getByRole("button", { name: /Copy phrase สวัสดี/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(copyTextMock).toHaveBeenCalledWith("สวัสดี (sà-wàt-dee) — Hello");
    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        message: 'Copied "สวัสดี"',
      })
    );
  });

  it("renders retry view on failure and retries on tap", async () => {
    getLocalPhrasesMock.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      render(<PhrasebookCard lat={-25.75} lng={28.24} />);
    });

    expect(screen.getByText("Local phrases unavailable offline")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Retry/i });

    getLocalPhrasesMock.mockResolvedValueOnce({
      areaName: "Pretoria",
      language: "Afrikaans",
      phrases: [{ local: "Hallo", roman: "Hallo", english: "Hello", note: "" }],
      fetchedAt: Date.now(),
    });

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    expect(screen.getByText("Essential Afrikaans")).toBeInTheDocument();
  });
});
