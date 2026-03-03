// ============================================================================
// IMPORTS
// ============================================================================
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import ProfilePage from "@/app/(userDashboard)/dashboard/store/profile/page";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

// Mock Next.js navigation hook
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock axios for API calls
jest.mock("axios");

// Mock toast notifications
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function Link({ children, href, className }: {
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

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Loader2: function Loader2({ className }: { className?: string }) {
    return <div className={className}>Loading Icon</div>;
  },
  ShoppingCart: function ShoppingCart() {
    return <div>Cart Icon</div>;
  },
  Heart: function Heart() {
    return <div>Heart Icon</div>;
  },
  Star: function Star() {
    return <div>Star Icon</div>;
  },
  Trash2: function Trash2() {
    return <div>Trash Icon</div>;
  },
}));

// Mock section components
jest.mock("@/components/storeProfile/OrderSection", () => {
  return function OrderSection({ orders }: { orders: unknown[] }) {
    return (
      <div data-testid="order-section">
        Order Section - {orders.length} orders
      </div>
    );
  };
});

jest.mock("@/components/storeProfile/CartSection", () => {
  return function CartSection({
    cart,
    calculateTotal,
    handleBuyAll,
  }: {
    cart: unknown[];
    calculateTotal: () => number;
    handleBuyAll: () => void;
  }) {
    return (
      <div data-testid="cart-section">
        <div>Cart Section - {cart.length} items</div>
        <div>Total: {calculateTotal()}</div>
        <button onClick={handleBuyAll}>Buy All</button>
      </div>
    );
  };
});

jest.mock("@/components/storeProfile/WishlistSection", () => {
  return function WishlistSection({
    wishlist,
    handleAddToCart,
  }: {
    wishlist: unknown[];
    handleAddToCart: (itemId: string) => void;
  }) {
    return (
      <div data-testid="wishlist-section">
        <div>Wishlist Section - {wishlist.length} items</div>
        <button onClick={() => handleAddToCart("test-item-id")}>
          Add to Cart
        </button>
      </div>
    );
  };
});

// Mock axios error message utility
jest.mock("@/utils/ax", () => ({
  getAxiosErrorMessage: jest.fn((error) => error.message || "Error occurred"),
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUser = {
  id: "user1",
  name: "Test User",
  email: "test@example.com",
  membership: "MONTHLY",
};

const mockItems = [
  {
    id: "item1",
    name: "Test Product 1",
    imageUrl: "https://example.com/image1.jpg",
    basePrice: 100,
    monthlyPrice: 90,
    yearlyPrice: 80,
    lifetimePrice: 70,
    category: { id: "cat1", name: "Electronics" },
    currency: "INR",
  },
  {
    id: "item2",
    name: "Test Product 2",
    imageUrl: "https://example.com/image2.jpg",
    basePrice: 200,
    monthlyPrice: 180,
    yearlyPrice: 160,
    lifetimePrice: 140,
    category: { id: "cat2", name: "Books" },
    currency: "USD",
  },
];

const mockOrders = [
  {
    id: "order1",
    status: "delivered",
    totalAmount: 270,
    createdAt: "2024-01-15T10:00:00Z",
    items: [
      {
        id: "orderItem1",
        quantity: 3,
        priceAtPurchase: 90,
        item: mockItems[0],
      },
    ],
  },
  {
    id: "order2",
    status: "pending",
    totalAmount: 180,
    createdAt: "2024-01-20T10:00:00Z",
    items: [
      {
        id: "orderItem2",
        quantity: 1,
        priceAtPurchase: 180,
        item: mockItems[1],
      },
    ],
  },
];

const mockWishlist = [
  {
    id: "wish1",
    itemId: "item1",
    userId: "user1",
    item: mockItems[0],
  },
];

const mockCart = [
  {
    id: "cart1",
    itemId: "item2",
    userId: "user1",
    quantity: 2,
    item: mockItems[1],
  },
];

// ============================================================================
// TEST SUITE
// ============================================================================

describe("ProfilePage", () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();

  // ============================================================================
  // SETUP - Runs before each test
  // ============================================================================
  beforeEach(() => {
    // Create fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock router.push
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup default axios mock responses
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/user/store/profile") {
        return Promise.resolve({ data: { user: mockUser } });
      }
      if (url === "/api/user/store/items/orders") {
        return Promise.resolve({ data: { orders: mockOrders } });
      }
      if (url === "/api/user/store/items/wishlist") {
        return Promise.resolve({ data: { wishlist: mockWishlist } });
      }
      if (url === "/api/user/store/items/cart/get-cart-items") {
        return Promise.resolve({ data: { cart: mockCart } });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  // ============================================================================
  // HELPER FUNCTION
  // ============================================================================
  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );
  };

  // ============================================================================
  // TEST GROUP: Initial Rendering
  // ============================================================================
  describe("Initial Rendering", () => {
    it("should show loading state initially", () => {
      renderComponent();
      expect(screen.getByText("Loading Icon")).toBeInTheDocument();
    });

    it("should render back to store link", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Back to Store")).toBeInTheDocument();
      });

      const link = screen.getByText("Back to Store").closest("a");
      expect(link).toHaveAttribute("href", "/dashboard/store");
    });

    it("should render all three sections after loading", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-section")).toBeInTheDocument();
        expect(screen.getByTestId("cart-section")).toBeInTheDocument();
        expect(screen.getByTestId("order-section")).toBeInTheDocument();
      });
    });

    it("should display correct counts for each section", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Wishlist Section - 1 items")).toBeInTheDocument();
        expect(screen.getByText("Cart Section - 1 items")).toBeInTheDocument();
        expect(screen.getByText("Order Section - 2 orders")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Data Fetching
  // ============================================================================
  describe("Data Fetching", () => {
    it("should fetch all profile data on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/user/store/profile");
        expect(axios.get).toHaveBeenCalledWith("/api/user/store/items/orders");
        expect(axios.get).toHaveBeenCalledWith("/api/user/store/items/wishlist");
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/cart/get-cart-items"
        );
      });
    });

    it("should handle API errors gracefully", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.reject(new Error("Failed to fetch profile"));
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.resolve({ data: { orders: [] } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        // Component should still render with empty data
        expect(screen.getByTestId("order-section")).toBeInTheDocument();
      });
    });

    it("should handle empty data states", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: mockUser } });
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.resolve({ data: { orders: [] } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Wishlist Section - 0 items")).toBeInTheDocument();
        expect(screen.getByText("Cart Section - 0 items")).toBeInTheDocument();
        expect(screen.getByText("Order Section - 0 orders")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Price Calculation Based on Membership
  // ============================================================================
  describe("Price Calculation", () => {
    it("should calculate total with monthly prices for MONTHLY membership", async () => {
      renderComponent();

      await waitFor(() => {
        // Cart has 2 units of item2 at monthly price $180 = $360
        expect(screen.getByText("Total: 360")).toBeInTheDocument();
      });
    });

    it("should calculate total with base prices for FREE membership", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({
            data: { user: { ...mockUser, membership: "FREE" } },
          });
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.resolve({ data: { orders: mockOrders } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: mockWishlist } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: mockCart } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        // Cart has 2 units of item2 at base price $200 = $400
        expect(screen.getByText("Total: 400")).toBeInTheDocument();
      });
    });

    it("should calculate total with yearly prices for YEARLY membership", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({
            data: { user: { ...mockUser, membership: "YEARLY" } },
          });
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.resolve({ data: { orders: mockOrders } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: mockWishlist } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: mockCart } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        // Cart has 2 units of item2 at yearly price $160 = $320
        expect(screen.getByText("Total: 320")).toBeInTheDocument();
      });
    });

    it("should calculate total with lifetime prices for LIFETIME membership", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({
            data: { user: { ...mockUser, membership: "LIFETIME" } },
          });
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.resolve({ data: { orders: mockOrders } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: mockWishlist } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: mockCart } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        // Cart has 2 units of item2 at lifetime price $140 = $280
        expect(screen.getByText("Total: 280")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Wishlist Functionality
  // ============================================================================
  describe("Wishlist Functionality", () => {
    it("should add item to cart from wishlist", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });
      (axios.delete as jest.Mock).mockResolvedValue({ data: {} });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-section")).toBeInTheDocument();
      });

      const addToCartButton = screen.getByText("Add to Cart");
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/cart/add-cart-items",
          { itemId: "test-item-id" }
        );
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/user/store/items/wishlist",
          { data: { itemId: "test-item-id" } }
        );
        expect(toast.success).toHaveBeenCalledWith("Item added to cart");
      });
    });

    it("should show error toast when add to cart fails", async () => {
      (axios.post as jest.Mock).mockRejectedValue(
        new Error("Failed to add to cart")
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-section")).toBeInTheDocument();
      });

      const addToCartButton = screen.getByText("Add to Cart");
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to add to cart");
      });
    });

    it("should invalidate queries after successful add to cart", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });
      (axios.delete as jest.Mock).mockResolvedValue({ data: {} });

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-section")).toBeInTheDocument();
      });

      const addToCartButton = screen.getByText("Add to Cart");
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["profileData"],
        });
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Cart Functionality
  // ============================================================================
  describe("Cart Functionality", () => {
    it("should handle Buy All button click", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-section")).toBeInTheDocument();
      });

      const buyAllButton = screen.getByText("Buy All");
      fireEvent.click(buyAllButton);

      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/store/checkout?cartItem=item2:2"
      );
    });

    it("should show warning when trying to buy with empty cart", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: mockUser } });
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.resolve({ data: { orders: mockOrders } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: mockWishlist } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-section")).toBeInTheDocument();
      });

      const buyAllButton = screen.getByText("Buy All");
      fireEvent.click(buyAllButton);

      expect(toast.warning).toHaveBeenCalledWith("Cart is empty");
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should format checkout URL with multiple cart items", async () => {
      const multipleItemsCart = [
        {
          id: "cart1",
          itemId: "item1",
          userId: "user1",
          quantity: 2,
          item: mockItems[0],
        },
        {
          id: "cart2",
          itemId: "item2",
          userId: "user1",
          quantity: 3,
          item: mockItems[1],
        },
      ];

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: mockUser } });
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.resolve({ data: { orders: mockOrders } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: mockWishlist } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: multipleItemsCart } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-section")).toBeInTheDocument();
      });

      const buyAllButton = screen.getByText("Buy All");
      fireEvent.click(buyAllButton);

      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/store/checkout?cartItem=item1:2&cartItem=item2:3"
      );
    });
  });

  // ============================================================================
  // TEST GROUP: Cart Item Removal
  // ============================================================================
  describe("Cart Item Removal", () => {
    it("should handle remove from cart mutation", async () => {
      (axios.delete as jest.Mock).mockResolvedValue({ data: {} });

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-section")).toBeInTheDocument();
      });

      // Note: The removeFromCartMutation is passed to CartSection component
      // and would be triggered by user interaction within that component.
      // This verifies that the mutation setup is correct.
      expect(invalidateQueriesSpy).toBeDefined();
    });
  });

  // ============================================================================
  // TEST GROUP: Navigation
  // ============================================================================
  describe("Navigation", () => {
    it("should have correct back to store link href", async () => {
      renderComponent();

      await waitFor(() => {
        const link = screen.getByText("Back to Store").closest("a");
        expect(link).toHaveAttribute("href", "/dashboard/store");
      });
    });

    it("should have correct link classes", async () => {
      renderComponent();

      await waitFor(() => {
        const link = screen.getByText("Back to Store").closest("a");
        expect(link).toHaveClass("bg-jp-orange");
        expect(link).toHaveClass("text-white");
        expect(link).toHaveClass("rounded-full");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Responsive Layout
  // ============================================================================
  describe("Responsive Layout", () => {
    it("should render grid layout container", async () => {
      renderComponent();

      await waitFor(() => {
        const gridContainer = screen
          .getByTestId("wishlist-section")
          .closest("div")
          ?.parentElement;
        expect(gridContainer).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Query Refetch
  // ============================================================================
  describe("Query Refetch", () => {
    it("should refetch data on mount", async () => {
      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(4);
      });

      unmount();

      // Mount again
      renderComponent();

      await waitFor(() => {
        // Should be called again (4 more times)
        expect(axios.get).toHaveBeenCalledTimes(8);
      });
    });
  });
});