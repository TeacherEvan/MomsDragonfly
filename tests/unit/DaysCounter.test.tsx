import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DaysCounter } from "@/components/onboarding/DaysCounter";

describe("DaysCounter", () => {
  const BASE_TIME = 1_700_000_000_000; // Fixed timestamp for reproducible diffs

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders placeholder banner when tripStartDate is undefined", () => {
    render(<DaysCounter />);
    expect(
      screen.getByText(/Safe Travels! You can track your trip duration/i)
    ).toBeInTheDocument();
  });

  it("renders 'Trip starts today!' when start date matches today", () => {
    render(<DaysCounter tripStartDate={BASE_TIME} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Trip starts today! 🎉")).toBeInTheDocument();
  });

  it("renders past trip elapsed days correctly", () => {
    const threeDaysAgo = BASE_TIME - 3 * 86_400_000;
    render(<DaysCounter tripStartDate={threeDaysAgo} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Day 4 of your journey 🌍")).toBeInTheDocument();
  });

  it("renders future countdown with plural days", () => {
    const threeDaysFuture = BASE_TIME + 3 * 86_400_000;
    render(<DaysCounter tripStartDate={threeDaysFuture} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByText("3 days until your journey begins! ✈️")
    ).toBeInTheDocument();
  });

  it("renders future countdown with single day", () => {
    const oneDayFuture = BASE_TIME + 1 * 86_400_000;
    render(<DaysCounter tripStartDate={oneDayFuture} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByText("1 day until your journey begins! ✈️")
    ).toBeInTheDocument();
  });
});
