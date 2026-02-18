// __tests__/components/home/Hero.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hero from "@/components/home/Hero";


// ✅ mock redirect hook
jest.mock("@/hooks/use-redirect-dashboard", () => jest.fn());

// ✅ IMPORTANT: mock next-auth FULLY
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ✅ mock SpotlightCard
jest.mock("@/components/home/SpotlightCard", () => () => (
  <div>Mocked SpotlightCard</div>
));

describe("Hero Component", () => {
  const renderHero = () => render(<Hero />);

  it("renders main heading", () => {
    renderHero();
    expect(
      screen.getByRole("heading", {
        name: /One Complete Growth Ecosystem/i,
      })
    ).toBeInTheDocument();
  });

  it("renders hero description text", () => {
    renderHero();
    expect(
      screen.getByText(
        /For Coaches, Solopreneurs & Self-Growth Enthusiasts/i
      )
    ).toBeInTheDocument();
  });

  it("renders SpotlightCard", () => {
    renderHero();
    expect(screen.getByText("Mocked SpotlightCard")).toBeInTheDocument();
  });
});
