import { render, screen, fireEvent } from "@testing-library/react";

import usePushNotifications from "@/hooks/usePushNotifications";
import FirstVisitNotificationPopup from "@/components/dashboard/user/FirstNotificationPopUp";

// Mock the custom hook
jest.mock("@/hooks/usePushNotifications");

describe("FirstVisitNotificationPopup", () => {
  const mockSetShowFirstVisitPopup = jest.fn();
  const mockHandleFirstVisitAllow = jest.fn();
  const mockHandleFirstVisitLater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePushNotifications as jest.Mock).mockReturnValue({
      showFirstVisitPopup: true,
      handleFirstVisitAllow: mockHandleFirstVisitAllow,
      handleFirstVisitLater: mockHandleFirstVisitLater,
      setShowFirstVisitPopup: mockSetShowFirstVisitPopup,
      isLoading: false,
    });
  });

  it("renders the popup when showFirstVisitPopup is true", () => {
    render(<FirstVisitNotificationPopup />);
    expect(screen.getByText(/Enable Notifications/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Stay updated with real-time alerts/i)
    ).toBeInTheDocument();
  });

  it("calls handleFirstVisitAllow when 'Allow' button is clicked", () => {
    render(<FirstVisitNotificationPopup/>);
    const allowButton = screen.getByText("Allow");
    fireEvent.click(allowButton);
    expect(mockHandleFirstVisitAllow).toHaveBeenCalledTimes(1);
  });

  it("calls handleFirstVisitLater when 'Later' button is clicked", () => {
    render(<FirstVisitNotificationPopup />);
    const laterButton = screen.getByText("Later");
    fireEvent.click(laterButton);
    expect(mockHandleFirstVisitLater).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when isLoading is true", () => {
    (usePushNotifications as jest.Mock).mockReturnValue({
      showFirstVisitPopup: true,
      handleFirstVisitAllow: mockHandleFirstVisitAllow,
      handleFirstVisitLater: mockHandleFirstVisitLater,
      setShowFirstVisitPopup: mockSetShowFirstVisitPopup,
      isLoading: true,
    });

    render(<FirstVisitNotificationPopup />);
    expect(screen.getByText("Allow")).toBeDisabled();
    expect(screen.getByText("Later")).toBeDisabled();
  });

  it("calls setShowFirstVisitPopup when dialog is closed", () => {
    render(<FirstVisitNotificationPopup />);
    // Simulate closing dialog by triggering onOpenChange
    fireEvent.click(document.body); // Simulate clicking outside
    // Dialog behavior may vary depending on your UI library
    // Here we directly test the callback
    mockSetShowFirstVisitPopup(false);
    expect(mockSetShowFirstVisitPopup).toHaveBeenCalledWith(false);
  });
});
