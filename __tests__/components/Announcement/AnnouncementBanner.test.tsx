import { render, screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import axios from "axios";

jest.mock("next-auth/react");
jest.mock("axios");

const mockUseSession = useSession as jest.Mock;
const mockAxios = axios as jest.Mocked<typeof axios>;

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("AnnouncementBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render if user is not authenticated", () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated" });
    renderWithQueryClient(<AnnouncementBanner />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders announcement when authenticated and data is available", async () => {
    mockUseSession.mockReturnValue({ status: "authenticated" });
    mockAxios.get.mockResolvedValueOnce({
      data: {
        announcements: [
          {
            _id: "1",
            title: "Test Announcement",
            backgroundColor: "#123456",
            fontColor: "#ffffff",
            linkUrl: "https://example.com",
            openInNewTab: true,
          },
        ],
      },
    });

    renderWithQueryClient(<AnnouncementBanner />);

    // Wait for data to load
    await waitFor(() =>
      expect(screen.getByText("Test Announcement")).toBeInTheDocument()
    );

    const link = screen.getByRole("link", { name: "Test Announcement" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders nothing if announcements are empty", async () => {
    mockUseSession.mockReturnValue({ status: "authenticated" });
    mockAxios.get.mockResolvedValueOnce({
      data: { announcements: [] },
    });

    renderWithQueryClient(<AnnouncementBanner />);

    await waitFor(() => {
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });
});
