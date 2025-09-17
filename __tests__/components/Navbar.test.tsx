import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "@/components/navbars/navbar/Navbar"; // adjust import if needed
import { useSession, signOut } from "next-auth/react";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Next.js Link and Image
jest.mock("next/link", () => ({ children, href }: any) => (
  <a href={href}>{children}</a>
));
jest.mock("next/image", () => (props: any) => (
  <img {...props} alt={props.alt || "mocked-image"} />
));

describe("Navbar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders logo and basic links", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Navbar />);

    expect(screen.getByText("MyThriveBuddy.com")).toBeInTheDocument();
    expect(screen.getByText("Challenges")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
  });

  it("shows Sign In and Sign Up buttons when logged out", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Navbar />);

    expect(screen.getByRole("button", { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("shows Dashboard and Sign Out when logged in", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
    });

    render(<Navbar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    const signOutButton = screen.getByRole("button", { name: /Sign Out/i });
    expect(signOutButton).toBeInTheDocument();

    fireEvent.click(signOutButton);
    expect(signOut).toHaveBeenCalled();
  });

  it("toggles mobile menu when hamburger button is clicked", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Navbar />);

    const menuButton = screen.getByRole("button", { name: /menu/i });

    // Open menu
    fireEvent.click(menuButton);

    // Desktop + mobile both render "Challenges"
    const challengesLinks = screen.getAllByText("Challenges");
    expect(challengesLinks.length).toBeGreaterThan(0);

    // Desktop + mobile both render "Sign In"
    const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
    // last one is the mobile menu button
    const mobileSignInButton = signInButtons[signInButtons.length - 1];
    expect(mobileSignInButton).toBeInTheDocument();
    expect(mobileSignInButton).toBeVisible();

    // Close menu
    fireEvent.click(menuButton);

    // After closing, the mobile one should not be visible anymore
    expect(mobileSignInButton).not.toBeVisible();
  });
});
