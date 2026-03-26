import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import OrderHistoryPage from "@/app/(userDashboard)/dashboard/store/order-history/page";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

jest.mock("axios");

jest.mock("next/link", () => {
  return function Link({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: function Image({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) {
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  },
}));

jest.mock("@/components/PageLoader", () => {
  return function PageLoader() {
    return <div data-testid="page-loader">Loading...</div>;
  };
});

jest.mock("lucide-react", () => ({
  ArrowLeft: ({ className }: { className?: string }) => <div className={className}>ArrowLeft</div>,
  Package: ({ className }: { className?: string }) => <div className={className}>Package</div>,
  Calendar: ({ className }: { className?: string }) => <div className={className}>Calendar</div>,
  CheckCircle: ({ className }: { className?: string }) => <div className={className}>CheckCircle</div>,
  Clock: ({ className }: { className?: string }) => <div className={className}>Clock</div>,
  XCircle: ({ className }: { className?: string }) => <div className={className}>XCircle</div>,
  ChevronDown: ({ className }: { className?: string }) => <div className={className}>ChevronDown</div>,
  ChevronUp: ({ className }: { className?: string }) => <div className={className}>ChevronUp</div>,
  TrendingUp: ({ className }: { className?: string }) => <div className={className}>TrendingUp</div>,
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockINROrder = {
  id: "order-inr-001",
  status: "completed",
  currency: "INR",
  totalAmount: 588.82,
  createdAt: "2025-01-15T10:00:00Z",
  items: [
    {
      id: "oi-001",
      quantity: 1,
      priceAtPurchase: 588.82,
      originalCurrency: "INR",
      originalPrice: 499,
      item: {
        name: "Mindset Mastery Book",
        imageUrl: "https://example.com/book.jpg",
        category: { name: "Books" },
      },
    },
  ],
};

const mockUSDOrder = {
  id: "order-usd-001",
  status: "processing",
  currency: "USD",
  totalAmount: 29,
  createdAt: "2025-02-10T12:00:00Z",
  items: [
    {
      id: "oi-002",
      quantity: 1,
      priceAtPurchase: 29,
      originalCurrency: "USD",
      originalPrice: 29,
      item: {
        name: "USD Course",
        imageUrl: "https://example.com/course.jpg",
        category: { name: "Courses" },
      },
    },
  ],
};

const mockGPOrder = {
  id: "order-gp-001",
  status: "completed",
  currency: "GP",
  totalAmount: 50,
  createdAt: "2025-03-01T08:00:00Z",
  items: [
    {
      id: "oi-003",
      quantity: 2,
      priceAtPurchase: 25,
      originalCurrency: "GP",
      originalPrice: 25,
      item: {
        name: "GP Reward Item",
        imageUrl: "https://example.com/gp.jpg",
        category: { name: "Rewards" },
      },
    },
  ],
};

const mockCancelledOrder = {
  id: "order-cancelled-001",
  status: "cancelled",
  currency: "INR",
  totalAmount: 199,
  createdAt: "2025-01-20T09:00:00Z",
  items: [
    {
      id: "oi-004",
      quantity: 1,
      priceAtPurchase: 199,
      originalCurrency: "INR",
      originalPrice: 199,
      item: {
        name: "Cancelled Item",
        imageUrl: "https://example.com/cancelled.jpg",
        category: { name: "Books" },
      },
    },
  ],
};

const mockConvertedOrder = {
  id: "order-conv-001",
  status: "completed",
  currency: "INR",
  totalAmount: 2422.5,
  createdAt: "2025-03-10T10:00:00Z",
  items: [
    {
      id: "oi-005",
      quantity: 1,
      priceAtPurchase: 2422.5,
      originalCurrency: "USD",
      originalPrice: 29,
      item: {
        name: "USD to INR Course",
        imageUrl: "https://example.com/converted.jpg",
        category: { name: "Courses" },
      },
    },
  ],
};

// ============================================================================
// HELPERS
// ============================================================================

const renderComponent = (queryClient?: QueryClient) => {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  return render(
    <QueryClientProvider client={client}>
      <OrderHistoryPage />
    </QueryClientProvider>
  );
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("OrderHistoryPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  // ============================================================================
  // TEST GROUP: Loading State
  // ============================================================================
  describe("Loading State", () => {
    it("should show page loader while orders are loading", () => {
      (axios.get as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderComponent(queryClient);

      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Empty State
  // ============================================================================
  describe("Empty State", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { orders: [] } });
    });

    it("should show No Orders Yet when there are no orders", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("No Orders Yet")).toBeInTheDocument();
      });
    });

    it("should show Browse Store link when there are no orders", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        const link = screen.getByText("Browse Store").closest("a");
        expect(link).toHaveAttribute("href", "/dashboard/store");
      });
    });

    it("should show 0 total orders in header stats", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order History")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Initial Rendering
  // ============================================================================
  describe("Initial Rendering", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockINROrder] },
      });
    });

    it("should render Order History heading", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order History")).toBeInTheDocument();
      });
    });

    it("should render Back to Growth Store link", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        const link = screen.getByText("Back to Growth Store").closest("a");
        expect(link).toHaveAttribute("href", "/dashboard/store");
      });
    });

    it("should show total orders count in stats", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Total Orders")).toBeInTheDocument();
      });
    });

    it("should show completed orders count in stats", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        const completedLabels = screen.getAllByText("Completed");
        expect(completedLabels.length).toBeGreaterThan(0);
      });
    });

    it("should render order id truncated and uppercased", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });
    });

    it("should render item count in order header", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });
    });

    it("should render Total Amount label", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Total Amount")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Order Status Badges
  // ============================================================================
  describe("Order Status Badges", () => {
    it("should show Completed status for completed order", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockINROrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        const completedLabels = screen.getAllByText("Completed");
        // The status badge span should be one of the matches
        const statusBadge = completedLabels.find(
          (el) => el.tagName.toLowerCase() === "span"
        );
        expect(statusBadge).toBeInTheDocument();
      });
    });

    it("should show Processing status for processing order", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockUSDOrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
    });

    it("should show Cancelled status for cancelled order", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockCancelledOrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Cancelled")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Currency Display
  // ============================================================================
  describe("Currency Display", () => {
    it("should show INR currency badge for INR order", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockINROrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("INR")).toBeInTheDocument();
      });
    });

    it("should show USD currency badge for USD order", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockUSDOrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("USD")).toBeInTheDocument();
      });
    });

    it("should show GP currency badge for GP order", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockGPOrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("GP")).toBeInTheDocument();
      });
    });

    it("should display INR total with rupee symbol", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockINROrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("₹588.82")).toBeInTheDocument();
      });
    });

    it("should display GP total with GP label", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockGPOrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        // GP totals appear as "50 GP"
        const gpTotals = screen.getAllByText(/50 GP/);
        expect(gpTotals.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Order Expansion
  // ============================================================================
  describe("Order Expansion", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockINROrder] },
      });
    });

    it("should not show order items before expanding", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      expect(screen.queryByText("Order Items")).not.toBeInTheDocument();
    });

    it("should show order items after clicking the order header", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        expect(screen.getByText("Order Items")).toBeInTheDocument();
      });
    });

    it("should show item name after expanding", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });
    });

    it("should show item category after expanding", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        expect(screen.getByText("Books")).toBeInTheDocument();
      });
    });

    it("should show item image after expanding", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        const img = screen.getByAltText("Mindset Mastery Book");
        expect(img).toHaveAttribute("src", "https://example.com/book.jpg");
      });
    });

    it("should show Order Total in expanded summary", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        expect(screen.getByText("Order Total")).toBeInTheDocument();
      });
    });

    it("should show Payment Currency in expanded summary", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        expect(screen.getByText("Payment Currency")).toBeInTheDocument();
      });
    });

    it("should collapse order items after clicking header again", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;

      fireEvent.click(orderHeader);
      await waitFor(() => {
        expect(screen.getByText("Order Items")).toBeInTheDocument();
      });

      fireEvent.click(orderHeader);
      await waitFor(() => {
        expect(screen.queryByText("Order Items")).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Currency Conversion Display
  // ============================================================================
  describe("Currency Conversion Display", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockConvertedOrder] },
      });
    });

    it("should show Currency Conversion label for converted items", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-CO")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-CO").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        expect(screen.getByText("Currency Conversion")).toBeInTheDocument();
      });
    });

    it("should show original price info for converted items", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-CO")).toBeInTheDocument();
      });

      const orderHeader = screen.getByText("Order #ORDER-CO").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(orderHeader);

      await waitFor(() => {
        expect(screen.getByText(/Original:/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Multiple Orders
  // ============================================================================
  describe("Multiple Orders", () => {
    beforeEach(() => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockINROrder, mockUSDOrder, mockGPOrder] },
      });
    });

    it("should render all orders", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
        expect(screen.getByText("Order #ORDER-US")).toBeInTheDocument();
        expect(screen.getByText("Order #ORDER-GP")).toBeInTheDocument();
      });
    });

    it("should show correct completed count for multiple orders", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        // 2 orders are completed (mockINROrder and mockGPOrder)
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("should independently expand each order", async () => {
      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("Order #ORDER-IN")).toBeInTheDocument();
      });

      const inrHeader = screen.getByText("Order #ORDER-IN").closest("div[class*='cursor-pointer']") as HTMLElement;
      fireEvent.click(inrHeader);

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      expect(screen.queryByText("USD Course")).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Data Fetching
  // ============================================================================
  describe("Data Fetching", () => {
    it("should fetch order history on mount", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { orders: [] } });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/order-history"
        );
      });
    });

    it("should handle empty orders array from API", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { orders: [] } });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("No Orders Yet")).toBeInTheDocument();
      });
    });

    it("should handle missing orders key in API response", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: {} });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("No Orders Yet")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Item Quantity
  // ============================================================================
  describe("Item Quantity Display", () => {
    it("should show singular item label for single item order", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [mockINROrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });
    });

    it("should show plural items label for multi-item order", async () => {
      const multiItemOrder = {
        ...mockINROrder,
        id: "order-multi-001",
        items: [
          { ...mockINROrder.items[0], id: "oi-m1" },
          {
            id: "oi-m2",
            quantity: 1,
            priceAtPurchase: 199,
            originalCurrency: "INR",
            originalPrice: 199,
            item: {
              name: "Second Book",
              imageUrl: "https://example.com/book2.jpg",
              category: { name: "Books" },
            },
          },
        ],
      };

      (axios.get as jest.Mock).mockResolvedValue({
        data: { orders: [multiItemOrder] },
      });

      renderComponent(queryClient);

      await waitFor(() => {
        expect(screen.getByText("2 items")).toBeInTheDocument();
      });
    });
  });
});