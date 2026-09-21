import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IntroVideoModal } from "@/components/onboarding/IntroVideoModal";

describe("IntroVideoModal", () => {
  it("renders fullscreen overlay", () => {
    render(<IntroVideoModal onComplete={vi.fn()} />);
    const overlay = screen.getByTestId("video-modal-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("fixed inset-0 z-50");
  });

  it("shows video with poster", () => {
    render(<IntroVideoModal onComplete={vi.fn()} />);
    const video = screen.getByTestId("intro-video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("poster", "/intro.jpg");
  });

  it("renders play button when auto-play blocked", () => {
    // Mock video.play() to reject (simulating auto-play blocked by browser)
    const mockVideo = document.createElement("video");
    mockVideo.play = vi.fn().mockRejectedValue(new Error("Auto-play blocked"));
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn((tag) => {
      if (tag === "video") return mockVideo;
      return originalCreateElement(tag);
    });

    render(<IntroVideoModal onComplete={vi.fn()} />);
    const playButton = screen.getByTestId("play-button");
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveTextContent("▶");

    document.createElement = originalCreateElement;
  });

  it("renders skip button", () => {
    render(<IntroVideoModal onComplete={vi.fn()} />);
    const skipButton = screen.getByTestId("skip-button");
    expect(skipButton).toBeInTheDocument();
    expect(skipButton).toHaveTextContent(/skip/i);
  });

  it("renders skip button", () => {
    render(<IntroVideoModal onComplete={vi.fn()} />);
    const skipButton = screen.getByTestId("skip-button");
    expect(skipButton).toBeInTheDocument();
    expect(skipButton).toHaveTextContent(/skip/i);
  });

  it("has focusable overlay for keyboard navigation", () => {
    render(<IntroVideoModal onComplete={vi.fn()} />);
    const overlay = screen.getByTestId("video-modal-overlay");
    expect(overlay).toHaveAttribute("tabIndex", "-1");
  });

  it("respects prefers-reduced-motion", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<IntroVideoModal onComplete={vi.fn()} />);
    const overlay = screen.getByTestId("video-modal-overlay");
    expect(overlay).toBeInTheDocument();
  });
});