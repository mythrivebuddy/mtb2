import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomAccordion from "@/components/dashboard/user/ CustomAccordion";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("CustomAccordion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("toggles accordion open and close", async () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/miracle-log");

    render(<CustomAccordion />);

    const button = screen.getByRole("button", {
      name: /Read About This feature/i,
    });

    // 1️⃣ Initially: no content
    expect(
      screen.queryByText(/Creates a personal archive of uplifting events/i)
    ).not.toBeInTheDocument();

    // 2️⃣ Open accordion → content appears
    fireEvent.click(button);
    await waitFor(() =>
      expect(
        screen.getByText(/Creates a personal archive of uplifting events/i)
      ).toBeInTheDocument()
    );

    // 3️⃣ Close accordion → content unmounts
    fireEvent.click(button);
    await waitFor(() =>
      expect(
        screen.queryByText(/Creates a personal archive of uplifting events/i)
      ).not.toBeInTheDocument()
    );
  });
});
