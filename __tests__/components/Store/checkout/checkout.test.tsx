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
import CheckoutPage from "@/app/(userDashboard)/dashboard/store/checkout/page";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

// Mock Next.js navigation hooks
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

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Shield: function Shield({ className }: { className?: string }) {
    return <div className={className}>Shield Icon</div>;
  },
  MapPin: function MapPin({ className }: { className?: string }) {
    return <div className={className}>MapPin Icon</div>;
  },
  User: function User({ className }: { className?: string }) {
    return <div className={className}>User Icon</div>;
  },
  Mail: function Mail({ className }: { className?: string }) {
    return <div className={className}>Mail Icon</div>;
  },
  Phone: function Phone({ className }: { className?: string }) {
    return <div className={className}>Phone Icon</div>;
  },
  Globe: function Globe({ className }: { className?: string }) {
    return <div className={className}>Globe Icon</div>;
  },
  Pencil: function Pencil({ className }: { className?: string }) {
    return <div className={className}>Pencil Icon</div>;
  },
  Check: function Check({ className }: { className?: string }) {
    return <div className={className}>Check Icon</div>;
  },
  X: function X({ className }: { className?: string }) {
    return <div className={className}>X Icon</div>;
  },
  AlertCircle: function AlertCircle({ className }: { className?: string }) {
    return <div className={className}>AlertCircle Icon</div>;
  },
  Eye: function Eye({ className }: { className?: string }) {
    return <div className={className}>Eye Icon</div>;
  },
  Info: function Info({ className }: { className?: string }) {
    return <div className={className}>Info Icon</div>;
  },
  TrendingUp: function TrendingUp({ className }: { className?: string }) {
    return <div className={className}>TrendingUp Icon</div>;
  },
}));

// Mock axios error utility
jest.mock("@/utils/ax", () => ({
  getAxiosErrorMessage: jest.fn((error, defaultMsg) => defaultMsg || "Error occurred"),
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSession = {
  user: {
    name: "Test User",
    email: "test@example.com",
  },
  expires: "2025-12-31",
};

const mockItems = [
  {
    id: "item1",
    name: "Test Product 1",
    imageUrl: "https://example.com/image1.jpg",
    basePrice: 100,
    currency: "INR",
    category: { id: "cat1", name: "Electronics" },
  },
  {
    id: "item2",
    name: "Test Product 2",
    imageUrl: "https://example.com/image2.jpg",
    basePrice: 50,
    currency: "USD",
    category: { id: "cat2", name: "Books" },
  },
];

const mockBillingInfo = {
  id: "billing1",
  fullName: "Test User",
  email: "test@example.com",
  phone: "9876543210",
  addressLine1: "123 Test Street",
  addressLine2: "Apt 4",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "IN",
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("CheckoutPage", () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();
  const mockSearchParams = {
    getAll: jest.fn(),
  };

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
    });

    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });

    // Default: cart with two items
    mockSearchParams.getAll.mockReturnValue(["item1:2", "item2:1"]);

    // Setup axios mocks
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/user/store/items/get-item?itemId=item1")) {
        return Promise.resolve({ data: { item: mockItems[0] } });
      }
      if (url.includes("/api/user/store/items/get-item?itemId=item2")) {
        return Promise.resolve({ data: { item: mockItems[1] } });
      }
      if (url === "/api/user/store/items/checkout/billinginfo") {
        return Promise.resolve({ data: { billingInfo: mockBillingInfo } });
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
        <CheckoutPage />
      </QueryClientProvider>
    );
  };

  // ============================================================================
  // TEST GROUP: Initial Rendering
  // ============================================================================
  describe("Initial Rendering", () => {
    it("should show loading state initially", () => {
      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });

    it("should render back to store link", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Back to Store")).toBeInTheDocument();
      });

      const link = screen.getByText("Back to Store").closest("a");
      expect(link).toHaveAttribute("href", "/dashboard/store");
    });

    // FIXED: Handle multiple elements with same text
    it("should display user login information", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Signed in as/)).toBeInTheDocument();
        // Use getAllByText for non-unique text
        const userElements = screen.getAllByText("Test User");
        expect(userElements.length).toBeGreaterThan(0);
        const emailElements = screen.getAllByText(/test@example\.com/);
        expect(emailElements.length).toBeGreaterThan(0);
      });
    });

    it("should render order summary section", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/ORDER SUMMARY/)).toBeInTheDocument();
      });
    });

    it("should render price details section", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("PRICE DETAILS")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Cart Items Display
  // ============================================================================
  describe("Cart Items Display", () => {
    it("should display all cart items", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      });
    });

    it("should display item quantities correctly", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Qty: 2/)).toBeInTheDocument();
        expect(screen.getByText(/Qty: 1/)).toBeInTheDocument();
      });
    });

    it("should display item categories", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Electronics/)).toBeInTheDocument();
        expect(screen.getByText(/Books/)).toBeInTheDocument();
      });
    });

    it("should display item images", async () => {
      renderComponent();

      await waitFor(() => {
        const images = screen.getAllByRole("img");
        expect(images.length).toBeGreaterThan(0);
        expect(images[0]).toHaveAttribute("src", "https://example.com/image1.jpg");
      });
    });

    // FIXED: Handle multiple currency badges
    it("should show currency badges for items", async () => {
      renderComponent();

      await waitFor(() => {
        // Use getAllByText for non-unique text
        const inrElements = screen.getAllByText("INR");
        const usdElements = screen.getAllByText("USD");
        expect(inrElements.length).toBeGreaterThan(0);
        expect(usdElements.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Empty Cart Handling
  // ============================================================================
  describe("Empty Cart Handling", () => {
    it("should show error message when no items in cart", async () => {
      mockSearchParams.getAll.mockReturnValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("No items found")).toBeInTheDocument();
      });
    });

    it("should show return to store link when cart is empty", async () => {
      mockSearchParams.getAll.mockReturnValue([]);

      renderComponent();

      await waitFor(() => {
        const link = screen.getByText("Return to Store");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute("href", "/dashboard/store");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Billing Information
  // ============================================================================
  describe("Billing Information", () => {
    it("should display saved billing information", async () => {
      renderComponent();

      await waitFor(() => {
        // Check for "2. DELIVERY ADDRESS" to ensure billing is rendered
        expect(screen.getByText(/2\. DELIVERY ADDRESS/)).toBeInTheDocument();
      });

      // Then check for specific billing details
      expect(screen.getByText(/123 Test Street/)).toBeInTheDocument();
      expect(screen.getByText(/Mumbai/)).toBeInTheDocument();
    });

    it("should show billing form when no address saved", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/store/items/get-item")) {
          return Promise.resolve({ data: { item: mockItems[0] } });
        }
        if (url === "/api/user/store/items/checkout/billinginfo") {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Add your address to continue/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      });
    });

    it("should allow editing billing information", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("CHANGE")).toBeInTheDocument();
      });

      const changeButton = screen.getByText("CHANGE");
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      });
    });

    // FIXED: Use querySelector for inputs without proper label association
    it("should save billing information successfully", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/store/items/get-item")) {
          return Promise.resolve({ data: { item: mockItems[0] } });
        }
        if (url === "/api/user/store/items/checkout/billinginfo") {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: { billingInfo: mockBillingInfo },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      });

      // Fill in the form using more specific selectors
      const nameInput = screen.getByPlaceholderText("John Doe");
      const emailInput = screen.getByPlaceholderText("john@example.com");
      const addressInput = screen.getByPlaceholderText("Street Address");
      
      // Use querySelector for inputs without proper label association
      const cityInput = document.querySelector('input[name="city"]') as HTMLInputElement;
      const stateInput = document.querySelector('input[name="state"]') as HTMLInputElement;
      const postalInput = document.querySelector('input[name="postalCode"]') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(addressInput, { target: { value: "123 Test Street" } });
      fireEvent.change(cityInput, { target: { value: "Mumbai" } });
      fireEvent.change(stateInput, { target: { value: "Maharashtra" } });
      fireEvent.change(postalInput, { target: { value: "400001" } });

      // Find and click save button
      const saveButton = screen.getByText(/Save Address/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/checkout/billinginfo",
          expect.any(Object)
        );
        expect(toast.success).toHaveBeenCalledWith("Address saved!");
      });
    });

    // FIXED: Use querySelector for inputs without proper label association
    it("should show error toast when billing save fails", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/store/items/get-item")) {
          return Promise.resolve({ data: { item: mockItems[0] } });
        }
        if (url === "/api/user/store/items/checkout/billinginfo") {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      (axios.post as jest.Mock).mockRejectedValue(new Error("Failed to save"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      });

      // Fill required fields to enable form submission
      const nameInput = screen.getByPlaceholderText("John Doe");
      const emailInput = screen.getByPlaceholderText("john@example.com");
      const addressInput = screen.getByPlaceholderText("Street Address");
      
      // Use querySelector for inputs without proper label association
      const cityInput = document.querySelector('input[name="city"]') as HTMLInputElement;
      const stateInput = document.querySelector('input[name="state"]') as HTMLInputElement;
      const postalInput = document.querySelector('input[name="postalCode"]') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(addressInput, { target: { value: "123 Test Street" } });
      fireEvent.change(cityInput, { target: { value: "Mumbai" } });
      fireEvent.change(stateInput, { target: { value: "Maharashtra" } });
      fireEvent.change(postalInput, { target: { value: "400001" } });

      const saveButton = screen.getByText(/Save Address/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to save address");
      });
    });

    it("should allow canceling billing edit", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("CHANGE")).toBeInTheDocument();
      });

      const changeButton = screen.getByText("CHANGE");
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText(/Cancel/)).toBeInTheDocument();
      });

      const cancelButton = screen.getByText(/Cancel/);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("John Doe")).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Price Calculation
  // ============================================================================
  describe("Price Calculation", () => {
    it("should calculate total for single currency correctly", async () => {
      mockSearchParams.getAll.mockReturnValue(["item1:2"]);

      renderComponent();

      await waitFor(() => {
        // Item1: INR 100 x 2 = INR 200
        // There are multiple elements with ₹200, so we'll check for one specifically
        const priceElements = screen.getAllByText(/₹200\.00/);
        expect(priceElements.length).toBeGreaterThan(0);
      });
    });

    it("should show mixed currency warning", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Currency Preview/)).toBeInTheDocument();
        expect(screen.getByText(/multiple currencies/)).toBeInTheDocument();
      });
    });

    it("should display currency breakdown for mixed cart", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/INR Items/)).toBeInTheDocument();
        expect(screen.getByText(/USD Items/)).toBeInTheDocument();
      });
    });

    it("should show free delivery message", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("FREE")).toBeInTheDocument();
        expect(screen.getByText("Delivery Charges")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Currency Preview Feature
  // ============================================================================
  describe("Currency Preview Feature", () => {
    it("should allow selecting currency preview", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Currency Preview/)).toBeInTheDocument();
      });

      // Find INR button and click it
      const buttons = screen.getAllByRole("button");
      const inrButton = buttons.find((btn) => btn.textContent?.includes("INR"));

      if (inrButton) {
        fireEvent.click(inrButton);

        await waitFor(() => {
          expect(screen.getByText(/Preview Active/)).toBeInTheDocument();
        });
      }
    });

    it("should show conversion details when preview is active", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Currency Preview/)).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole("button");
      const inrButton = buttons.find((btn) => btn.textContent?.includes("INR"));

      if (inrButton) {
        fireEvent.click(inrButton);

        await waitFor(() => {
          expect(screen.getByText(/Preview Mode Active/)).toBeInTheDocument();
          expect(screen.getByText(/Exchange rate/)).toBeInTheDocument();
        });
      }
    });

    it("should clear preview when clicked again", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Currency Preview/)).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole("button");
      const inrButton = buttons.find((btn) => btn.textContent?.includes("INR"));

      if (inrButton) {
        fireEvent.click(inrButton);

        await waitFor(() => {
          expect(screen.getByText(/Preview Active/)).toBeInTheDocument();
        });

        fireEvent.click(inrButton);

        await waitFor(() => {
          expect(screen.queryByText(/Preview Active/)).not.toBeInTheDocument();
        });
      }
    });
  });

  // ============================================================================
  // TEST GROUP: Place Order
  // ============================================================================
  describe("Place Order", () => {
    it("should disable place order button without billing address", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/store/items/get-item")) {
          return Promise.resolve({ data: { item: mockItems[0] } });
        }
        if (url === "/api/user/store/items/checkout/billinginfo") {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        const placeOrderButton = screen.getByText("Place Order");
        expect(placeOrderButton).toBeDisabled();
      });
    });

    it("should enable place order button with billing address", async () => {
      renderComponent();

      await waitFor(() => {
        const placeOrderButton = screen.getByText("Place Order");
        expect(placeOrderButton).not.toBeDisabled();
      });
    });

    it("should place order successfully", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Place Order")).toBeInTheDocument();
      });

      const placeOrderButton = screen.getByText("Place Order");
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/place-order",
          {
            items: [
              { itemId: "item1", quantity: 2 },
              { itemId: "item2", quantity: 1 },
            ],
          }
        );
        expect(toast.success).toHaveBeenCalledWith("Order placed successfully!");
        expect(mockPush).toHaveBeenCalledWith("/dashboard/store/profile");
      });
    });

    it("should show error toast when order placement fails", async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error("Failed to place order"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Place Order")).toBeInTheDocument();
      });

      const placeOrderButton = screen.getByText("Place Order");
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to place order");
      });
    });

    it("should show loading state while placing order", async () => {
      (axios.post as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Place Order")).toBeInTheDocument();
      });

      const placeOrderButton = screen.getByText("Place Order");
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText(/Placing Order/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: UI Elements
  // ============================================================================
  describe("UI Elements", () => {
    it("should display safe payment badge", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Safe and Secure Payments/)).toBeInTheDocument();
      });
    });

    it("should display terms and conditions text", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Terms of Use/)).toBeInTheDocument();
        expect(screen.getByText(/Privacy Policy/)).toBeInTheDocument();
      });
    });

    it("should show alert when editing address", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("CHANGE")).toBeInTheDocument();
      });

      const changeButton = screen.getByText("CHANGE");
      fireEvent.click(changeButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Save your address changes to continue/)
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Data Fetching
  // ============================================================================
  describe("Data Fetching", () => {
    it("should fetch all cart items on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/get-item?itemId=item1"
        );
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/get-item?itemId=item2"
        );
      });
    });

    it("should fetch billing information on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/checkout/billinginfo"
        );
      });
    });

    it("should handle API errors gracefully", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("API Error"));

      renderComponent();

      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByTestId("page-loader")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Responsive Behavior
  // ============================================================================
  describe("Responsive Behavior", () => {
    it("should render in grid layout", async () => {
      renderComponent();

      await waitFor(() => {
        const gridElements = document.querySelectorAll(".grid");
        expect(gridElements.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Session Handling
  // ============================================================================
  describe("Session Handling", () => {
    // FIXED: Handle multiple elements with same text
    it("should use session data for user information", async () => {
      renderComponent();

      await waitFor(() => {
        // Text appears in multiple places (login section and billing)
        const userNameElements = screen.getAllByText("Test User");
        expect(userNameElements.length).toBeGreaterThan(0);
        const emailElements = screen.getAllByText(/test@example\.com/);
        expect(emailElements.length).toBeGreaterThan(0);
      });
    });

    it("should prefill billing form with session data", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/user/store/items/get-item")) {
          return Promise.resolve({ data: { item: mockItems[0] } });
        }
        if (url === "/api/user/store/items/checkout/billinginfo") {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText("john@example.com");
        expect(emailInput).toHaveValue("test@example.com");
      });
    });
  });
});