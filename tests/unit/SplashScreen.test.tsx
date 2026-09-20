import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SplashScreen } from "@/components/onboarding/SplashScreen";

describe("SplashScreen", () => {
  it("renders full-screen overlay", () => {
    render(<SplashScreen onComplete={vi.fn()} />);
    const overlay = screen.getByTestId("splash-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("fixed inset-0 z-50");
  });

  it("shows intro.jpg as background", () => {
    render(<SplashScreen onComplete={vi.fn()} />);
    const bg = screen.getByTestId("splash-background");
    expect(bg).toHaveStyle({ backgroundImage: expect.stringContaining("intro.jpg") });
  });

  it("renders DragonflySilhouette centered", () => {
    render(<SplashScreen onComplete={vi.fn()} />);
    const dragonfly = screen.getByTestId("splash-dragonfly");
    expect(dragonfly).toBeInTheDocument();
  });

  it("has correct structure", () => {
    render(<SplashScreen onComplete={vi.fn()} />);
    const overlay = screen.getByTestId("splash-overlay");
    expect(overlay).toHaveClass("fixed inset-0 z-50");
    expect(screen.getByTestId("splash-background")).toBeInTheDocument();
    expect(screen.getByTestId("splash-dragonfly")).toBeInTheDocument();
    expect(screen.getByText("Mom's Dragonfly")).toBeInTheDocument();
  });

  it("does not animate when prefers-reduced-motion", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<SplashScreen onComplete={vi.fn()} />);
    const dragonfly = screen.getByTestId("splash-dragonfly");
    expect(dragonfly).not.toHaveClass("animate-float");
  });
});