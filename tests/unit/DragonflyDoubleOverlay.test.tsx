import { render, screen } from "@testing-library/react";

import { DragonflyDoubleOverlay } from "@/components/ui/DragonflyDoubleOverlay";

describe("DragonflyDoubleOverlay", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("renders children without creating duplicate main landmark", () => {
    const { container } = render(
      <DragonflyDoubleOverlay>
        <span data-testid="child-content">Content</span>
      </DragonflyDoubleOverlay>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("renders static fallback without canvas when prefers-reduced-motion is active", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { container } = render(
      <DragonflyDoubleOverlay>
        <div>Content</div>
      </DragonflyDoubleOverlay>
    );

    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders static fallback without canvas when reduce-motion html class is present", () => {
    document.documentElement.classList.add("reduce-motion");

    const { container } = render(
      <DragonflyDoubleOverlay>
        <div>Content</div>
      </DragonflyDoubleOverlay>
    );

    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders canvas when motion is enabled", () => {
    const { container } = render(
      <DragonflyDoubleOverlay>
        <div>Content</div>
      </DragonflyDoubleOverlay>
    );

    expect(container.querySelector("canvas")).not.toBeNull();
  });
});
