import { render, screen, fireEvent, waitFor } from "@testing-library/react";


// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));
import { usePathname } from "next/navigation";

// Mock react-query useQuery
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/user/Sidebar";

// Mock utils
jest.mock("@/utils/getInitials", () => ({
  getInitials: (name: string) => name.charAt(0),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default user name when no user provided", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

    render(<Sidebar/>);

    expect(screen.getByText("Your Name")).toBeInTheDocument();
  });

  it("renders with user name when provided", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

    render(<Sidebar user={{ id: "1", name: "Faizan" } as any} />);

    expect(screen.getByText("Faizan")).toBeInTheDocument();
  });

  it("toggles mobile menu open and close", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

    render(<Sidebar />);

    const toggleButton = screen.getByRole("button");

    // Sidebar closed initially
    expect(
      screen.getByRole("complementary", { hidden: true })
    ).toHaveClass("-translate-x-full");

    // Open sidebar
    fireEvent.click(toggleButton);
    expect(
      screen.getByRole("complementary", { hidden: true })
    ).toHaveClass("translate-x-0");

    // Close sidebar
    fireEvent.click(toggleButton);
    expect(
      screen.getByRole("complementary", { hidden: true })
    ).toHaveClass("-translate-x-full");
  });

  it("highlights active NavItem when pathname matches", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");

    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

    render(<Sidebar />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });

    expect(dashboardLink).toHaveClass("text-jp-orange");
  });

  it("shows search dropdown with users", async () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    (useQuery as jest.Mock).mockReturnValue({
      data: [{ id: "u1", name: "Alice", image: "" }],
      isLoading: false,
    });

    render(<Sidebar />);

    const input = screen.getByPlaceholderText("Search Anything Here...");

    fireEvent.change(input, { target: { value: "Alice" } });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("shows loading state in search dropdown", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: true });

    render(<Sidebar />);

    const input = screen.getByPlaceholderText("Search Anything Here...");

    fireEvent.change(input, { target: { value: "test" } });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows no users found in search dropdown", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

    render(<Sidebar />);

    const input = screen.getByPlaceholderText("Search Anything Here...");

    fireEvent.change(input, { target: { value: "unknown" } });

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });
});
