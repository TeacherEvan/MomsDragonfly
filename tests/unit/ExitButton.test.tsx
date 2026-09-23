import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ExitButton } from "@/components/shell/ExitButton";
import { ToastProvider } from "@/components/shell/Toast";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const closeMock = vi.fn();
let closedFlag = false;

beforeEach(() => {
  closedFlag = false;
  closeMock.mockReset();
  pushMock.mockClear();
  vi.useFakeTimers();
  // jsdom windows can never really close — stub both close() and the
  // `closed` getter so we can simulate "blocked close" and "closed" cases.
  Object.defineProperty(window, "close", {
    configurable: true,
    writable: true,
    value: closeMock,
  });
  Object.defineProperty(window, "closed", {
    configurable: true,
    get: () => closedFlag,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderExitButton() {
  return render(
    <ToastProvider>
      <ExitButton />
    </ToastProvider>
  );
}

describe("ExitButton", () => {
  it("renders an Exit App button", () => {
    renderExitButton();
    const button = screen.getByTestId("exit-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Exit App");
  });

  it("asks for confirmation and does nothing when cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderExitButton();

    fireEvent.click(screen.getByTestId("exit-button"));

    expect(window.confirm).toHaveBeenCalledWith("Exit Mom's Dragonfly?");
    expect(closeMock).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("tries to close the window when confirmed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderExitButton();

    fireEvent.click(screen.getByTestId("exit-button"));

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("shows a graceful exit hint and returns to Explore when the close is blocked", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderExitButton();

    fireEvent.click(screen.getByTestId("exit-button"));
    expect(closeMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(pushMock).toHaveBeenCalledWith("/explore");
    expect(screen.getByRole("alert")).toHaveTextContent(/back button or gesture to exit/i);
  });

  it("stays quiet when the window actually closes", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderExitButton();

    fireEvent.click(screen.getByTestId("exit-button"));
    closedFlag = true; // simulate the browser closing the window

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
