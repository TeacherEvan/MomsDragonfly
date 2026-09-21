import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { BottomNav } from "@/components/shell/BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/explore"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

describe("BottomNav", () => {
  it("renders with correct structure", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass("bg-dragonfly-navy-900/95");
    expect(nav).toHaveClass("border-dragonfly-navy-800");
  });

  it("renders all four tab buttons", () => {
    render(<BottomNav />);
    expect(screen.getByRole("button", { name: /explore/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /budget/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reminders/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tickets/i })).toBeInTheDocument();
  });

  it("applies dragonfly-gold color to active tab", () => {
    render(<BottomNav />);
    const activeButton = screen.getByRole("button", { name: /explore/i });
    expect(activeButton).toHaveClass("text-dragonfly-gold-500");
  });

  it("applies dragonfly-navy color to inactive tabs", () => {
    render(<BottomNav />);
    const budgetButton = screen.getByRole("button", { name: /budget/i });
    expect(budgetButton).toHaveClass("text-dragonfly-navy-400");
  });
});