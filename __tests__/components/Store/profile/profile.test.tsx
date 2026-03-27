// ============================================================================
// IMPORTS
// ============================================================================
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import StoreProfilePageComponent from "@/app/(userDashboard)/dashboard/store/profile/page";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock axios
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

// Mock Next.js Image component
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

// Mock PageLoader
jest.mock("@/components/PageLoader", () => {
  return function PageLoader() {
    return <div data-testid="page-loader">Loading...</div>;
  };
});

// Mock AppLayout
jest.mock("@/components/layout/AppLayout", () => {
  return function AppLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="app-layout">{children}</div>;
  };
});

// Mock child section components so we isolate the parent page
jest.mock("@/components/storeProfile/OrderSection", () => {
  return function OrderSection({ orders }: { orders: unknown[] }) {
    return (
      <div data-testid="order-section">
        <span data-testid="order-count">{orders.length}</span>
      </div>
    );
  };
});

jest.mock("@/components/storeProfile/CartSection", () => {
  return function CartSection({
    cart,
    handleRemoveFromCart,
    handleBuyAll,
  }: {
    cart: { id: string; item?: { id: string; name: string; basePrice: number }; quantity?: number }[];
    handleRemoveFromCart: (id: string) => void;
    handleBuyAll: () => void;
  }) {
    return (
      <div data-testid="cart-section">
        {cart.map((c) => (
          <div key={c.id} data-testid={`cart-item-${c.id}`}>
            <span>{c.item?.name}</span>
            <button onClick={() => handleRemoveFromCart(c.id)}>Remove</button>
          </div>
        ))}
        <button onClick={handleBuyAll}>Buy All</button>
        <span data-testid="cart-count">{cart.length}</span>
      </div>
    );
  };
});

jest.mock("@/components/storeProfile/WishlistSection", () => {
  return function WishlistSection({
    wishlist,
    handleAddToCart,
  }: {
    wishlist: { id: string; item?: { id: string; name: string } }[];
    handleAddToCart: (id: string) => void;
  }) {
    return (
      <div data-testid="wishlist-section">
        {wishlist.map((w) => (
          <div key={w.id} data-testid={`wishlist-item-${w.id}`}>
            <span>{w.item?.name}</span>
            <button onClick={() => handleAddToCart(w.id)}>Add to Cart</button>
          </div>
        ))}
        <span data-testid="wishlist-count">{wishlist.length}</span>
      </div>
    );
  };
});

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  ArrowLeft: function ArrowLeft({ className }: { className?: string }) {
    return <div className={className}>ArrowLeft Icon</div>;
  },
}));

// Mock axios error utility
jest.mock("@/utils/ax", () => ({
  getAxiosErrorMessage: jest.fn((error, defaultMsg) => defaultMsg || "Error occurred"),
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockAuthenticatedSession = {
  user: { name: "Test User", email: "test@example.com" },
  expires: "2025-12-31",
};

const mockOrders = [
  {
    id: "order1",
    status: "COMPLETED",
    total: 499,
    createdAt: "2025-01-01T00:00:00Z",
    items: [
      {
        id: "oi1",
        item: { id: "item1", name: "Mindset Mastery Book", basePrice: 499 },
        quantity: 1,
      },
    ],
  },
  {
    id: "order2",
    status: "PENDING",
    total: 999,
    createdAt: "2025-01-02T00:00:00Z",
    items: [
      {
        id: "oi2",
        item: { id: "item2", name: "Coach Leadership Course", basePrice: 999 },
        quantity: 1,
      },
    ],
  },
];

const mockWishlist = [
  {
    id: "w1",
    itemId: "item3",
    item: { id: "item3", name: "GP Reward Item", basePrice: 50 },
  },
];

const mockCart = [
  {
    id: "c1",
    itemId: "item1",
    quantity: 1,
    item: { id: "item1", name: "Mindset Mastery Book", basePrice: 499 },
  },
  {
    id: "c2",
    itemId: "item2",
    quantity: 2,
    item: { id: "item2", name: "Coach Leadership Course", basePrice: 999 },
  },
];

// Shared mock search params (no payment by default)
const mockSearchParams = {
  get: jest.fn(() => null),
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("StoreProfilePageComponent", () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  // ============================================================================
  // SETUP
  // ============================================================================
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);

    // Default: authenticated user
    (useSession as jest.Mock).mockReturnValue({
      data: mockAuthenticatedSession,
      status: "authenticated",
    });

    // Default axios mocks
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/user/store/profile") {
        return Promise.resolve({ data: { user: mockAuthenticatedSession.user } });
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

    jest.clearAllMocks();
  });

  // ============================================================================
  // HELPER FUNCTION
  // ============================================================================
  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <StoreProfilePageComponent />
      </QueryClientProvider>
    );
  };

  // ============================================================================
  // TEST GROUP: Loading State
  // ============================================================================
  describe("Loading State", () => {
    it("should show page loader while profile data is being fetched", () => {
      (axios.get as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });

    it("should show page loader when auth status is loading", () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "loading",
      });

      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Layout & Authentication
  // ============================================================================
  describe("Layout & Authentication", () => {
    it("should NOT render inside AppLayout for authenticated users", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/My Cart & Orders/i)).toBeInTheDocument();
      });

      expect(screen.queryByTestId("app-layout")).not.toBeInTheDocument();
    });

    it("should render inside AppLayout for unauthenticated users", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("app-layout")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Initial Rendering
  // ============================================================================
  describe("Initial Rendering", () => {
    it("should render page title and description", async () => {
      renderComponent();

      await waitFor(() => {
        // h1 includes emoji — use regex
        expect(screen.getByText(/My Cart & Orders/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Manage your wishlist, cart, and orders/i)
        ).toBeInTheDocument();
      });
    });

    it("should render Back to Growth Store link", async () => {
      renderComponent();

      await waitFor(() => {
        const backLink = screen.getByText("Back to Growth Store").closest("a");
        expect(backLink).toHaveAttribute("href", "/dashboard/store");
      });
    });

    it("should render all three section components", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("order-section")).toBeInTheDocument();
        expect(screen.getByTestId("cart-section")).toBeInTheDocument();
        expect(screen.getByTestId("wishlist-section")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Data Fetching
  // ============================================================================
  describe("Data Fetching", () => {
    it("should fetch profile data on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/user/store/profile");
      });
    });

    it("should fetch orders on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/user/store/items/orders");
      });
    });

    it("should fetch wishlist on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/user/store/items/wishlist");
      });
    });

    it("should fetch cart items on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/cart/get-cart-items"
        );
      });
    });

    it("should NOT fetch profile data when user is unauthenticated", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      renderComponent();

      // Wait a tick — no fetch should happen since query is disabled
      await new Promise((r) => setTimeout(r, 50));

      expect(axios.get).not.toHaveBeenCalledWith("/api/user/store/profile");
      expect(axios.get).not.toHaveBeenCalledWith("/api/user/store/items/orders");
      expect(axios.get).not.toHaveBeenCalledWith("/api/user/store/items/wishlist");
    });

    it("should pass correct order count to OrderSection", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("order-count").textContent).toBe("2");
      });
    });

    it("should pass correct cart count to CartSection", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-count").textContent).toBe("2");
      });
    });

    it("should pass correct wishlist count to WishlistSection", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-count").textContent).toBe("1");
      });
    });

    it("should handle partial API failures gracefully using Promise.allSettled", async () => {
      // Orders fails, but profile and wishlist succeed
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: mockAuthenticatedSession.user } });
        }
        if (url === "/api/user/store/items/orders") {
          return Promise.reject(new Error("Orders API failed"));
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: mockWishlist } });
        }
        if (url === "/api/user/store/items/cart/get-cart-items") {
          return Promise.resolve({ data: { cart: [] } });
        }
        return Promise.reject(new Error("Unknown"));
      });

      renderComponent();

      // Should still render with 0 orders (fallback) without crashing
      await waitFor(() => {
        expect(screen.getByTestId("order-count").textContent).toBe("0");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Cart Interactions
  // ============================================================================
  describe("Cart Interactions", () => {
    it("should call remove-cart-items API when Remove is clicked", async () => {
      (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-item-c1")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId("cart-item-c1").querySelector("button")!
      );

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/user/store/items/cart/delete-cart-items",
          { data: { cartItemId: "c1" } }
        );
      });
    });

    it("should show success toast when item is removed from cart", async () => {
      (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-item-c1")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId("cart-item-c1").querySelector("button")!
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Item removed");
      });
    });

    it("should navigate to checkout with all cart items when Buy All is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Buy All")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Buy All"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/dashboard/store/checkout?")
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("cartItem=item1:1")
        );
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("cartItem=item2:2")
        );
      });
    });

    it("should show warning toast when Buy All is clicked with empty cart", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: {} } });
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
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Buy All")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Buy All"));

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith("Cart is empty");
      });
    });

    it("should NOT navigate to checkout when cart is empty", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: {} } });
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
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Buy All")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Buy All"));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TEST GROUP: Wishlist Interactions
  // ============================================================================
  describe("Wishlist Interactions", () => {
    it("should call add-cart-items and delete wishlist API when Add to Cart is clicked", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });
      (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-item-w1")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId("wishlist-item-w1").querySelector("button")!
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/cart/add-cart-items",
          { itemId: "w1" }
        );
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/user/store/items/wishlist",
          { data: { itemId: "w1" } }
        );
      });
    });

    it("should show success toast when wishlist item is added to cart", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });
      (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-item-w1")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId("wishlist-item-w1").querySelector("button")!
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Item added to cart");
      });
    });

    it("should show error toast when adding wishlist item to cart fails", async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-item-w1")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId("wishlist-item-w1").querySelector("button")!
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Payment Success Toast
  // ============================================================================
  describe("Payment Success Toast", () => {
    it("should show payment success toast when payment=success is in URL", async () => {
      mockSearchParams.get.mockImplementation((key: string) =>
        key === "payment" ? "success" : null
      );

      renderComponent();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining("Payment Successful")
        );
      });
    });

    it("should include item name in payment success toast when order exists", async () => {
      mockSearchParams.get.mockImplementation((key: string) =>
        key === "payment" ? "success" : null
      );

      renderComponent();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining("Mindset Mastery Book")
        );
      });
    });

    it("should NOT show payment success toast when payment param is absent", async () => {
      mockSearchParams.get.mockReturnValue(null);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("order-section")).toBeInTheDocument();
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it("should NOT show payment success toast twice on re-render", async () => {
      mockSearchParams.get.mockImplementation((key: string) =>
        key === "payment" ? "success" : null
      );

      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledTimes(1);
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <StoreProfilePageComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Still only called once — hasShownPaymentToast ref prevents duplicate
        expect(toast.success).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Empty States
  // ============================================================================
  describe("Empty States", () => {
    it("should pass empty orders array to OrderSection when API returns none", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: {} } });
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
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("order-count").textContent).toBe("0");
      });
    });

    it("should pass empty wishlist array to WishlistSection when API returns none", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: {} } });
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
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-count").textContent).toBe("0");
      });
    });

    it("should pass empty cart array to CartSection when API returns none", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: {} } });
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
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("cart-count").textContent).toBe("0");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Navigation
  // ============================================================================
  describe("Navigation", () => {
    it("should have Back to Growth Store link pointing to /dashboard/store", async () => {
      renderComponent();

      await waitFor(() => {
        const link = screen.getByText("Back to Growth Store").closest("a");
        expect(link).toHaveAttribute("href", "/dashboard/store");
      });
    });
  });
});