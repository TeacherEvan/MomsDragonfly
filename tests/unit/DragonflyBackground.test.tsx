import { render, screen } from "@testing-library/react";
import { DragonflyBackground } from "@/components/ui/DragonflyBackground";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

describe("DragonflyBackground", () => {
  it("renders children", () => {
    render(<DragonflyBackground><span data-testid="child">Content</span></DragonflyBackground>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies wing pattern background class", () => {
    const { container } = render(<DragonflyBackground><div /></DragonflyBackground>);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("bg-wing-pattern");
  });

  it("renders DragonflySilhouette when mode is ambient", () => {
    render(<DragonflyBackground mode="ambient"><div /></DragonflyBackground>);
    const silhouette = screen.getByTestId("dragonfly-silhouette");
    expect(silhouette).toBeInTheDocument();
  });

  it("does not render DragonflySilhouette when mode is immersive", () => {
    render(<DragonflyBackground mode="immersive"><div /></DragonflyBackground>);
    const silhouette = screen.queryByTestId("dragonfly-silhouette");
    expect(silhouette).not.toBeInTheDocument();
  });

  it("respects prefers-reduced-motion for ambient mode", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<DragonflyBackground mode="ambient"><div /></DragonflyBackground>);
    const silhouette = screen.getByTestId("dragonfly-silhouette");
    const wrapper = silhouette.parentElement;
    expect(wrapper).not.toHaveClass("animate-float");
  });
});