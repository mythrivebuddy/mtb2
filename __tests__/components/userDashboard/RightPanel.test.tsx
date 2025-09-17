// __tests__/RightPanel.test.tsx
import { render, screen } from "@testing-library/react";

import { useQuery } from "@tanstack/react-query";
import React from "react";
import '@testing-library/jest-dom';
import RightPanel from "@/components/dashboard/user/RightPanel";

// Mock React Query
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

// Mock ComingSoonWrapper to render children directly
jest.mock("@/components/wrappers/ComingSoonWrapper", () => ({
  ComingSoonWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

// Mock PageSkeleton
jest.mock("@/components/PageSkeleton", () => {
  return ({ type }: { type: string }) => <div data-testid="page-skeleton">{type}</div>;
});

describe("RightPanel Component", () => {
  const mockTransactionHistory = {
    transactions: [
      {
        id: "tx1",
        createdAt: "2025-09-16T12:00:00Z",
        amount: 100,
        jpAmount: 100,
        activity: {
          activity: "Test Activity",
          transactionType: "DEBIT",
          displayName: "Test Store",
        },
      },
      {
        id: "tx2",
        createdAt: "2025-09-15T12:00:00Z",
        amount: 50,
        jpAmount: 50,
        activity: {
          activity: "Test Activity",
          transactionType: "CREDIT",
          displayName: "Reward",
        },
      },
    ],
  };

  it("renders buddies section correctly", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });

    render(<RightPanel/>);

    // Check buddies
    expect(screen.getByText("Buddies")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getAllByText(/Full Access|Limited Access/)).toHaveLength(3);

    // Add Member button
    expect(screen.getByText("Add Member")).toBeInTheDocument();
  });

  it("renders loading skeleton when data is loading", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: true });

    render(<RightPanel />);

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("renders transaction history correctly after loading", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: mockTransactionHistory, isLoading: false });

    render(<RightPanel />);

    // Check history section
    expect(screen.getByText("History")).toBeInTheDocument();

    // Check transactions
    expect(screen.getByText("Spent on Test Store")).toBeInTheDocument();
    expect(screen.getByText("Earned for Reward")).toBeInTheDocument();

    // Check amounts
    expect(screen.getByText("100 JP")).toBeInTheDocument();
    expect(screen.getByText("50 JP")).toBeInTheDocument();
  });
});
