import { render, screen, fireEvent, act } from "@testing-library/react";
import PWAInstallButton from "../../components/PWAInstallButton";

// Proper custom event mock
class MockBeforeInstallPromptEvent extends Event {
  prompt = jest.fn().mockResolvedValue(undefined);
  userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
}

describe("PWAInstallButton", () => {
  test("should not render button initially", () => {
    render(<PWAInstallButton />);
    expect(screen.queryByText(/Install App/i)).toBeNull();
  });

  test("should show install button when beforeinstallprompt fires", async () => {
    render(<PWAInstallButton />);

    await act(async () => {
      const event = new MockBeforeInstallPromptEvent("beforeinstallprompt");
      window.dispatchEvent(event);
    });

    expect(screen.getByText(/Install App/i)).toBeInTheDocument();
  });

  test("should call prompt when install button clicked", async () => {
    render(<PWAInstallButton />);

    const event = new MockBeforeInstallPromptEvent("beforeinstallprompt");

    await act(async () => {
      window.dispatchEvent(event);
    });

    const button = screen.getByText(/Install App/i);

    await act(async () => {
      fireEvent.click(button);
    });

    expect(event.prompt).toHaveBeenCalled();
  });
});

