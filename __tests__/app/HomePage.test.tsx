// __tests__/app/Home.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SessionProvider } from "next-auth/react";
import Home, { metadata } from "@/app/page";

// Mock image imports
jest.mock("@/public/avtar.png", () => "test-file-stub");

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return { push: jest.fn() };
  },
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock react-query hooks
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      spotlight: {
        user: {
          userBusinessProfile: [
            {
              featuredWorkImage: "/test-image.jpg",
              featuredWorkTitle: "Developer",
            },
          ],
        },
      },
    },
    isLoading: false,
    error: null,
  }),
  useMutation: () => ({ mutate: jest.fn(), isLoading: false }),
}));

describe("Home Page", () => {
  it("renders the main heading", () => {
    render(
      <SessionProvider session={null}>
        <Home/>
      </SessionProvider>
    );

    // Only checks <h1> and ignores paragraphs
    const heading = screen.getByRole("heading", {
      name: /One Complete Growth Ecosystem/i,
      level: 1,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders Hero and SpotlightCard", () => {
    render(
      <SessionProvider session={null}>
        <Home />
      </SessionProvider>
    );

    // Hero heading (h1) specifically
    expect(
      screen.getByRole("heading", { name: /One Complete Growth Ecosystem/i, level: 1 })
    ).toBeInTheDocument();

    // SpotlightCard mock should show Developer text
    expect(
  screen.getAllByRole("heading", { name: /Spotlight of the Day/i }).length
).toBeGreaterThan(0);


  });

  it("has correct SEO metadata", () => {
    expect(metadata.title).toBe("MyThriveBuddy - One Complete Growth Ecosystem For Coaches, Solopreneurs & Self-Growth Enthusiasts.");
   expect(metadata.description).toContain("consistent growth");

    expect(metadata.openGraph?.siteName).toBe("MyThriveBuddy");
    expect(metadata.twitter?.title).toBe(
      "MyThriveBuddy - One Complete Growth Ecosystem For Coaches, Solopreneurs & Self-Growth Enthusiasts."
    );
  });
});
