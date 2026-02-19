import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "@/components/navbars/navbar/Navbar";
import { useSession } from "next-auth/react";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Next.js Link & Image
jest.mock("next/link", () => ({ children, href }: any) => (
  <a href={href}>{children}</a>
));
jest.mock("next/image", () => (props: any) => (
  <img {...props} alt={props.alt || "image"} />
));

describe("Navbar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders logo and primary links", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Navbar />);

    expect(screen.getByText("MyThriveBuddy.com")).toBeInTheDocument();
    expect(screen.getByText("Challenges")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("shows Sign In button when logged out", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Navbar />);

    expect(
      screen.getByRole("button", { name: /Sign In/i })
    ).toBeInTheDocument();
  });

  it("shows Dashboard when logged in", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
    });

    render(<Navbar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("toggles mobile menu correctly", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Navbar />);

    const menuButton = screen.getByLabelText("menu");

    // open
    fireEvent.click(menuButton);
    expect(screen.getByText("Blog")).toBeInTheDocument();

    // close
    fireEvent.click(menuButton);
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
  });
});
