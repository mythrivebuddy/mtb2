// ============================================================================
// IMPORTS
// ============================================================================
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import CheckoutPage from "@/app/(userDashboard)/dashboard/store/checkout/page";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("axios");

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

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

jest.mock("@/utils/ax", () => ({
  getAxiosErrorMessage: jest.fn((error, defaultMsg) => defaultMsg || "Error occurred"),
}));

jest.mock("@/lib/constant", () => ({
  GST_REGEX: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
}));

jest.mock("@/lib/razorpay/client/razorpay-client", () => ({
  openRazorpayCheckout: jest.fn(),
}));

jest.mock("@/lib/payment/payment.utils", () => ({
  convertCurrency: jest.fn().mockResolvedValue(83.5),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Shield: ({ className }: { className?: string }) => <div className={className}>Shield</div>,
  MapPin: ({ className }: { className?: string }) => <div className={className}>MapPin</div>,
  User: ({ className }: { className?: string }) => <div className={className}>User</div>,
  Mail: ({ className }: { className?: string }) => <div className={className}>Mail</div>,
  Phone: ({ className }: { className?: string }) => <div className={className}>Phone</div>,
  Globe: ({ className }: { className?: string }) => <div className={className}>Globe</div>,
  Pencil: ({ className }: { className?: string }) => <div className={className}>Pencil</div>,
  Check: ({ className }: { className?: string }) => <div className={className}>Check</div>,
  X: ({ className }: { className?: string }) => <div className={className}>X</div>,
  AlertCircle: ({ className }: { className?: string }) => <div className={className}>AlertCircle</div>,
  Info: ({ className }: { className?: string }) => <div className={className}>Info</div>,
  TrendingUp: ({ className }: { className?: string }) => <div className={className}>TrendingUp</div>,
  Coins: ({ className }: { className?: string }) => <div className={className}>Coins</div>,
  AlertTriangle: ({ className }: { className?: string }) => <div className={className}>AlertTriangle</div>,
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSession = {
  user: { name: "Test User", email: "test@example.com" },
  expires: "2025-12-31",
};

const mockINRItem = {
  id: "item1",
  name: "Mindset Mastery Book",
  basePrice: 499,
  currency: "INR",
  imageUrl: "https://example.com/book.jpg",
  isApproved: true,
  category: { id: "cat1", name: "Books" },
};

const mockUSDItem = {
  id: "item2",
  name: "USD Course",
  basePrice: 29,
  currency: "USD",
  imageUrl: "https://example.com/course.jpg",
  isApproved: true,
  category: { id: "cat2", name: "Courses" },
};

const mockGPItem = {
  id: "item3",
  name: "GP Reward Item",
  basePrice: 50,
  currency: "GP",
  imageUrl: "https://example.com/gp.jpg",
  isApproved: true,
  category: { id: "cat1", name: "Books" },
};

const mockBillingInfo = {
  fullName: "Test User",
  email: "test@example.com",
  phone: "9876543210",
  addressLine1: "123 Main Street",
  addressLine2: "",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "IN",
  gstNumber: "",
};

const mockGPData = {
  balance: 200,
  earned: 300,
  spent: 100,
};

// ============================================================================
// HELPERS
// ============================================================================

const buildSearchParams = (cartItems: string[]) => ({
  getAll: (key: string) => (key === "cartItem" ? cartItems : []),
  get: jest.fn(() => null),
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe("CheckoutPage", () => {
  let queryClient: QueryClient;

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

    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });

    (useSearchParams as jest.Mock).mockReturnValue(
      buildSearchParams(["item1:1"])
    );

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("get-item?itemId=item1")) {
        return Promise.resolve({ data: { item: mockINRItem } });
      }
      if (url.includes("get-item?itemId=item2")) {
        return Promise.resolve({ data: { item: mockUSDItem } });
      }
      if (url.includes("get-item?itemId=item3")) {
        return Promise.resolve({ data: { item: mockGPItem } });
      }
      if (url.includes("billinginfo")) {
        return Promise.resolve({ data: { billingInfo: mockBillingInfo } });
      }
      if (url.includes("gp-balance")) {
        return Promise.resolve({ data: mockGPData });
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
  // TEST GROUP: Loading State
  // ============================================================================
  describe("Loading State", () => {
    it("should show page loader while session is loading", () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "loading",
      });

      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });

    it("should show page loader while items are loading", () => {
      (axios.get as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Empty Cart
  // ============================================================================
  describe("Empty Cart", () => {
    it("should show No items found when cart is empty", async () => {
      (useSearchParams as jest.Mock).mockReturnValue(buildSearchParams([]));

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("No items found")).toBeInTheDocument();
      });
    });

    it("should render Return to Store link when no items found", async () => {
      (useSearchParams as jest.Mock).mockReturnValue(buildSearchParams([]));

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        const returnLink = screen.getByText("Return to Store").closest("a");
        expect(returnLink).toHaveAttribute("href", "/dashboard/store");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Initial Rendering
  // ============================================================================
  describe("Initial Rendering", () => {
    it("should render Back to Growth Store link", async () => {
      renderComponent();

      await waitFor(() => {
        const link = screen.getByText("Back to Growth Store").closest("a");
        expect(link).toHaveAttribute("href", "/dashboard/store");
      });
    });

    it("should render ORDER SUMMARY section", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("ORDER SUMMARY")).toBeInTheDocument();
      });
    });

    it("should render PRICE DETAILS section", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("PRICE DETAILS")).toBeInTheDocument();
      });
    });

    it("should render Place Order button", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Place Order")).toBeInTheDocument();
      });
    });

    it("should render item name in order summary", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });
    });

    it("should render item image", async () => {
      renderComponent();

      await waitFor(() => {
        const img = screen.getByAltText("Mindset Mastery Book");
        expect(img).toHaveAttribute("src", "https://example.com/book.jpg");
      });
    });

    it("should render FREE delivery charges", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("FREE")).toBeInTheDocument();
      });
    });

    it("should render safe and secure payments badge", async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/Safe and Secure Payments/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Billing Address
  // ============================================================================
  describe("Billing Address", () => {
    it("should show billing form when no billing info is saved", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Billing Information")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      });
    });

    it("should switch to edit mode when CHANGE is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("CHANGE")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("CHANGE"));

      await waitFor(() => {
        expect(screen.getByText("Billing Information")).toBeInTheDocument();
      });
    });

    it("should show Cancel button in edit mode when billing exists", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("CHANGE")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("CHANGE"));

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });
    });

    it("should call save billing API when billing form is submitted", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: { billingInfo: mockBillingInfo },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("John Doe"), {
        target: { value: "Test User" },
      });
      fireEvent.change(screen.getByPlaceholderText("john@example.com"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Street Address"), {
        target: { value: "123 Main St" },
      });

      const textInputs = screen.getAllByRole("textbox");
      const cityInput = textInputs.find(
        (i) => i.getAttribute("name") === "city"
      );
      const stateInput = textInputs.find(
        (i) => i.getAttribute("name") === "state"
      );
      const postalInput = textInputs.find(
        (i) => i.getAttribute("name") === "postalCode"
      );

      if (cityInput)
        fireEvent.change(cityInput, { target: { value: "Mumbai" } });
      if (stateInput)
        fireEvent.change(stateInput, { target: { value: "Maharashtra" } });
      if (postalInput)
        fireEvent.change(postalInput, { target: { value: "400001" } });

      fireEvent.click(screen.getByText("Save Address"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/checkout/billinginfo",
          expect.objectContaining({
            fullName: "Test User",
            email: "test@example.com",
          })
        );
      });
    });

    it("should show success toast after billing is saved", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: { billingInfo: mockBillingInfo },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Save Address")).toBeInTheDocument();
      });

      // Submit the form directly to bypass jsdom required validation
      const forms = document.querySelectorAll("form");
      if (forms[0]) fireEvent.submit(forms[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Address saved!");
      });
    });

    it("should show address warning when billing is missing", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(
            "Please add your delivery address above to continue."
          )
        ).toBeInTheDocument();
      });
    });

    it("should show GST field for Indian addresses", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("CHANGE")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("CHANGE"));

      await waitFor(() => {
        expect(
          screen.getByText("GST Number (Optional)")
        ).toBeInTheDocument();
      });
    });

    it("should NOT show GST field for non-Indian addresses", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("CHANGE")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("CHANGE"));

      await waitFor(() => {
        expect(screen.getByText("Billing Information")).toBeInTheDocument();
      });

      const countrySelect = screen.getByRole("combobox");
      fireEvent.change(countrySelect, { target: { value: "US" } });

      await waitFor(() => {
        expect(
          screen.queryByText("GST Number (Optional)")
        ).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: GST Calculation
  // ============================================================================
  describe("GST Calculation", () => {
    it("should show GST line in price details for Indian billing address", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("GST (18%)")).toBeInTheDocument();
      });
    });

    it("should NOT show GST for non-Indian billing address", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({
            data: {
              billingInfo: { ...mockBillingInfo, country: "US" },
            },
          });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      expect(screen.queryByText("GST (18%)")).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: GP Items
  // ============================================================================
  describe("GP Items", () => {
    beforeEach(() => {
      (useSearchParams as jest.Mock).mockReturnValue(
        buildSearchParams(["item3:1"])
      );
    });

    it("should show GP BALANCE section for GP cart items", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("3. GP BALANCE")).toBeInTheDocument();
      });
    });

    it("should show GP info note about GP-only purchase", async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/GP items can only be purchased with GP/i)
        ).toBeInTheDocument();
      });
    });

    it("should NOT show currency selection section for GP cart", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("GP Reward Item")).toBeInTheDocument();
      });

      expect(
        screen.queryByText("SELECT PAYMENT CURRENCY")
      ).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Mixed Currency Cart
  // ============================================================================
  describe("Mixed Currency Cart", () => {
    beforeEach(() => {
      (useSearchParams as jest.Mock).mockReturnValue(
        buildSearchParams(["item1:1", "item2:1"])
      );

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("get-item?itemId=item2")) {
          return Promise.resolve({ data: { item: mockUSDItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: mockBillingInfo } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });
    });

    it("should show cart breakdown with both currencies", async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/Current Cart Breakdown/i)
        ).toBeInTheDocument();
      });
    });

    it("should show currency selection warning when no currency selected", async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText("Currency Selection Required")
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Single Currency Cart
  // ============================================================================
  describe("Single Currency Cart", () => {
    it("should NOT show currency selection section for single currency cart", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      expect(
        screen.queryByText("SELECT PAYMENT CURRENCY")
      ).not.toBeInTheDocument();
    });

    it("should display Total Payable in price details", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Total Payable")).toBeInTheDocument();
      });
    });

    it("should display quantity in item row", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Qty: 1/)).toBeInTheDocument();
      });
    });

    it("should display category name in item row", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Books/)).toBeInTheDocument();
      });
    });

    it("should display GST section for INR items with Indian billing", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("GST (18%)")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Place Order
  // ============================================================================
  describe("Place Order", () => {
    it("should show error toast when place order API fails", async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error("Order failed"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Place Order")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Place Order"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to initiate payment");
      });
    });

    it("should disable Place Order button when billing is missing", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: null } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Place Order")).toBeInTheDocument();
      });

      expect(screen.getByText("Place Order")).toBeDisabled();
    });
  });

  // ============================================================================
  // TEST GROUP: Data Fetching
  // ============================================================================
  describe("Data Fetching", () => {
    it("should fetch billing info on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/checkout/billinginfo"
        );
      });
    });

    it("should fetch GP balance on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/gp-balance"
        );
      });
    });

    it("should fetch item details for each cart item", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining("get-item?itemId=item1")
        );
      });
    });

    it("should fetch multiple items when cart has multiple entries", async () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        buildSearchParams(["item1:1", "item2:1"])
      );

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-item?itemId=item1")) {
          return Promise.resolve({ data: { item: mockINRItem } });
        }
        if (url.includes("get-item?itemId=item2")) {
          return Promise.resolve({ data: { item: mockUSDItem } });
        }
        if (url.includes("billinginfo")) {
          return Promise.resolve({ data: { billingInfo: mockBillingInfo } });
        }
        if (url.includes("gp-balance")) {
          return Promise.resolve({ data: mockGPData });
        }
        return Promise.reject(new Error("Unknown"));
      });

      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining("get-item?itemId=item1")
        );
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining("get-item?itemId=item2")
        );
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Navigation
  // ============================================================================
  describe("Navigation", () => {
    it("should have Back to Growth Store link", async () => {
      renderComponent();

      await waitFor(() => {
        const link = screen.getByText("Back to Growth Store").closest("a");
        expect(link).toHaveAttribute("href", "/dashboard/store");
      });
    });

    it("should have Terms of Use link", async () => {
      renderComponent();

      await waitFor(() => {
        const termsLink = screen.getByText("Terms of Use").closest("a");
        expect(termsLink).toBeInTheDocument();
      });
    });

    it("should have Privacy Policy link", async () => {
      renderComponent();

      await waitFor(() => {
        const privacyLink = screen.getByText("Privacy Policy").closest("a");
        expect(privacyLink).toBeInTheDocument();
      });
    });
  });
});