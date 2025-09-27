import { render, screen } from "@testing-library/react";
import AppLayout from "@/components/layout/AppLayout";

// Mock child components
jest.mock("@/components/navbars/navbar/Navbar", () => () => <div>Navbar Mock</div>);
jest.mock("@/components/AnnouncementBanner", () => () => <div>AnnouncementBanner Mock</div>);

describe("AppLayout", () => {
  it("renders children and layout components", () => {
    render(
      <AppLayout>
        <div>Test Child</div>
      </AppLayout>
    );

    // Check children rendered
    expect(screen.getByText("Test Child")).toBeInTheDocument();

    // Check Navbar and AnnouncementBanner are rendered
    expect(screen.getByText("Navbar Mock")).toBeInTheDocument();
    expect(screen.getByText("AnnouncementBanner Mock")).toBeInTheDocument();
  });
});
