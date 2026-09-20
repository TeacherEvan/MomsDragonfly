import { render, screen } from "@testing-library/react";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

describe("DragonflySilhouette", () => {
  it("renders with default size", () => {
    render(<DragonflySilhouette />);
    const svg = screen.getByRole("img", { name: /dragonfly/i });
    expect(svg).toBeInTheDocument();
  });

  it("applies size class for sm", () => {
    const { container } = render(<DragonflySilhouette size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
  });

  it("applies size class for lg", () => {
    const { container } = render(<DragonflySilhouette size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "64");
  });

  it("adds aria-hidden when decorative", () => {
    const { container } = render(<DragonflySilhouette decorative />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies animation classes when animated", () => {
    const { container } = render(<DragonflySilhouette animated />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("animate-float");
  });

  it("does not apply animation when reduced motion preferred", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { container } = render(<DragonflySilhouette animated />);
    const wrapper = container.firstElementChild;
    expect(wrapper).not.toHaveClass("animate-float");
  });
});