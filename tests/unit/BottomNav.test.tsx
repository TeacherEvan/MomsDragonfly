import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { BottomNav } from "@/components/shell/BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/explore"),
}));

describe("BottomNav", () => {
  it("renders with correct structure", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass("bg-dragonfly-navy-900/95");
    expect(nav).toHaveClass("border-dragonfly-navy-800");
  });

  it("renders all four tab links", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: /explore/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /budget/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reminders/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tickets/i })).toBeInTheDocument();
  });

  it("applies dragonfly-teal color to active tab", () => {
    render(<BottomNav />);
    const activeLink = screen.getByRole("link", { name: /explore/i });
    expect(activeLink).toHaveClass("text-dragonfly-teal-400");
  });

  it("applies dragonfly-navy color to inactive tabs", () => {
    render(<BottomNav />);
    const budgetLink = screen.getByRole("link", { name: /budget/i });
    expect(budgetLink).toHaveClass("text-dragonfly-navy-400");
  });
});