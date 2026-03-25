// ============================================================================
// IMPORTS
// ============================================================================
import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import ManageStorePage from "@/app/(userDashboard)/dashboard/manage-store/page";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
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

jest.mock("lucide-react", () => ({
  Pencil: function Pencil({ className }: { className?: string }) {
    return <div className={className}>Pencil Icon</div>;
  },
  Trash2: function Trash2({ className }: { className?: string }) {
    return <div className={className}>Trash2 Icon</div>;
  },
  PlusCircle: function PlusCircle({ className }: { className?: string }) {
    return <div className={className}>PlusCircle Icon</div>;
  },
  LayoutGrid: function LayoutGrid({ className }: { className?: string }) {
    return <div className={className}>LayoutGrid Icon</div>;
  },
  List: function List({ className }: { className?: string }) {
    return <div className={className}>List Icon</div>;
  },
  ArrowLeft: function ArrowLeft({ className }: { className?: string }) {
    return <div className={className}>ArrowLeft Icon</div>;
  },
}));

jest.mock("@/utils/ax", () => ({
  getAxiosErrorMessage: jest.fn((error, defaultMsg) => defaultMsg || "Error occurred"),
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCoachSession = {
  user: { name: "Coach User", email: "coach@example.com", userType: "COACH" },
  expires: "2025-12-31",
};

const mockNonCoachSession = {
  user: { name: "Regular User", email: "user@example.com", userType: "USER" },
  expires: "2025-12-31",
};

const mockCategories = [
  { id: "cat1", name: "Electronics" },
  { id: "cat2", name: "Books" },
  { id: "cat3", name: "Software" },
];

const mockItems = [
  {
    id: "item1",
    name: "Product 1",
    categoryId: "cat1",
    basePrice: 100,
    monthlyPrice: 10,
    yearlyPrice: 100,
    lifetimePrice: 500,
    currency: "INR",
    imageUrl: "https://example.com/image1.jpg",
    isApproved: true,
    category: { id: "cat1", name: "Electronics" },
  },
  {
    id: "item2",
    name: "Product 2",
    categoryId: "cat2",
    basePrice: 50,
    monthlyPrice: 5,
    yearlyPrice: 50,
    lifetimePrice: 250,
    currency: "USD",
    imageUrl: "https://example.com/image2.jpg",
    isApproved: false,
    category: { id: "cat2", name: "Books" },
  },
  {
    id: "item3",
    name: "Product 3",
    categoryId: "cat3",
    basePrice: 200,
    monthlyPrice: 20,
    yearlyPrice: 200,
    lifetimePrice: 1000,
    currency: "INR",
    imageUrl: "https://example.com/image3.jpg",
    isApproved: true,
    category: { id: "cat3", name: "Software" },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * "Approved" appears as: filter button, card badge spans, and stats <h3>.
 * This returns specifically the filter <button> whose full text is "Approved".
 */
const getApprovedFilterButton = () => {
  const buttons = screen.getAllByRole("button");
  return buttons.find((btn) => btn.textContent?.trim() === "Approved")!;
};

/**
 * "Approved" stats <h3> card — finds the stat card heading specifically.
 * The stats card heading is an <h3> with uppercase tracking class.
 */
const getApprovedStatCard = () => {
  const headings = screen.getAllByText("Approved");
  return headings.find((el) => el.tagName === "H3")!;
};

/**
 * "Pending" appears as: card badge <span> and stats <h3>.
 * This returns specifically the <h3> heading in the stats card.
 */
const getPendingStatCard = () => {
  const elements = screen.getAllByText("Pending");
  return elements.find((el) => el.tagName === "H3")!;
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("ManageStorePage", () => {
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

    (useSession as jest.Mock).mockReturnValue({
      data: mockCoachSession,
      status: "authenticated",
    });

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/user/store/items/get-categories") {
        return Promise.resolve({ data: { categories: mockCategories } });
      }
      if (url === "/api/user/store/items/my-items") {
        return Promise.resolve({ data: { items: mockItems } });
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
        <ManageStorePage />
      </QueryClientProvider>
    );
  };

  // ============================================================================
  // TEST GROUP: Authentication & Authorization
  // ============================================================================
  describe("Authentication & Authorization", () => {
    it("should show page loader while checking session", () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "loading",
      });

      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });

    it("should redirect non-coach users to dashboard", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: mockNonCoachSession,
        status: "authenticated",
      });

      renderComponent();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should redirect unauthenticated users to dashboard", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      renderComponent();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should render page for authenticated coach user", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("🏪 Manage Store")).toBeInTheDocument();
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
        expect(screen.getByText("🏪 Manage Store")).toBeInTheDocument();
        expect(
          screen.getByText("Create and manage your products")
        ).toBeInTheDocument();
      });
    });

    it("should render Add Product button", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });
    });

    it("should render Back to Growth Store link", async () => {
      renderComponent();

      await waitFor(() => {
        const backLink = screen.getByText("Back to Growth Store").closest("a");
        expect(backLink).toHaveAttribute("href", "/dashboard/store");
      });
    });

    it("should render view toggle buttons for card and table view", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTitle("Card View")).toBeInTheDocument();
        expect(screen.getByTitle("Table View")).toBeInTheDocument();
      });
    });

    it("should render filter buttons for All Products, Approved and Not Approved", async () => {
      renderComponent();

      await waitFor(() => {
        // "All Products" is unique — safe to use getByText
        expect(screen.getByText("All Products")).toBeInTheDocument();
        // "Approved" and "Not Approved" need button-specific targeting
        expect(getApprovedFilterButton()).toBeInTheDocument();
        expect(screen.getByText("Not Approved")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Data Fetching
  // ============================================================================
  describe("Data Fetching", () => {
    it("should fetch categories on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/get-categories"
        );
      });
    });

    it("should fetch items on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/my-items"
        );
      });
    });

    it("should display all items after fetching", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
        expect(screen.getByText("Product 3")).toBeInTheDocument();
      });
    });

    it("should show empty state when API returns no items", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/items/get-categories") {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url === "/api/user/store/items/my-items") {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("No products yet")).toBeInTheDocument();
      });
    });

    it("should display product images", async () => {
      renderComponent();

      await waitFor(() => {
        const images = screen.getAllByRole("img");
        expect(images.length).toBeGreaterThan(0);
        expect(images[0]).toHaveAttribute(
          "src",
          "https://example.com/image1.jpg"
        );
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Filtering
  // ============================================================================
  describe("Filtering", () => {
    it("should show all products by default", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
        expect(screen.getByText("Product 3")).toBeInTheDocument();
      });
    });

    it("should filter to show only approved products", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      fireEvent.click(getApprovedFilterButton());

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 3")).toBeInTheDocument();
        expect(screen.queryByText("Product 2")).not.toBeInTheDocument();
      });
    });

    it("should filter to show only not-approved products", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 2")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Not Approved"));

      await waitFor(() => {
        expect(screen.getByText("Product 2")).toBeInTheDocument();
        expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
        expect(screen.queryByText("Product 3")).not.toBeInTheDocument();
      });
    });

    it("should show all products when All Products filter is clicked after filtering", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Not Approved"));

      await waitFor(() => {
        expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("All Products"));

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
        expect(screen.getByText("Product 3")).toBeInTheDocument();
      });
    });

    it("should show empty state when filter has no matching products", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/items/get-categories") {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url === "/api/user/store/items/my-items") {
          return Promise.resolve({
            data: { items: [{ ...mockItems[0], isApproved: true }] },
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Not Approved"));

      await waitFor(() => {
        expect(
          screen.getByText(/No pending approval products/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: View Modes
  // ============================================================================
  describe("View Modes", () => {
    it("should default to card view", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const editBtns = screen.getAllByText("Edit");
      expect(editBtns.length).toBeGreaterThan(0);
    });

    it("should switch to table view when Table View button is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle("Table View"));

      await waitFor(() => {
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Image")).toBeInTheDocument();
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Category")).toBeInTheDocument();
        expect(screen.getByText("Currency")).toBeInTheDocument();
        expect(screen.getByText("Base")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
      });
    });

    it("should switch back to card view from table view", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle("Table View"));

      await waitFor(() => {
        expect(screen.getByText("Status")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle("Card View"));

      await waitFor(() => {
        expect(screen.queryByText("Status")).not.toBeInTheDocument();
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Display
  // ============================================================================
  describe("Product Display", () => {
    it("should display approval status badges on product cards", async () => {
      renderComponent();

      await waitFor(() => {
        // getAllByText handles multiple "Approved" elements safely
        const approvedEls = screen.getAllByText("Approved");
        const pendingEls = screen.getAllByText("Pending");
        expect(approvedEls.length).toBeGreaterThan(0);
        expect(pendingEls.length).toBeGreaterThan(0);
      });
    });

    it("should display currency badges on product cards", async () => {
      renderComponent();

      await waitFor(() => {
        const inrBadges = screen.getAllByText("INR");
        const usdBadges = screen.getAllByText("USD");
        expect(inrBadges.length).toBeGreaterThan(0);
        expect(usdBadges.length).toBeGreaterThan(0);
      });
    });

    it("should display all price types on product cards", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/Base/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Monthly/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Yearly/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Lifetime/).length).toBeGreaterThan(0);
      });
    });

    it("should display Edit and Delete buttons on each product card", async () => {
      renderComponent();

      await waitFor(() => {
        const editBtns = screen.getAllByText("Edit");
        const deleteBtns = screen.getAllByText("Delete");
        expect(editBtns.length).toBe(3);
        expect(deleteBtns.length).toBe(3);
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Statistics Cards
  // ============================================================================
  describe("Statistics Cards", () => {
    it("should display correct total products count", async () => {
      renderComponent();

      await waitFor(() => {
        // "Total Products" is unique — safe to use getByText
        const totalCard = screen.getByText("Total Products").parentElement!;
        expect(within(totalCard).getByText("3")).toBeInTheDocument();
      });
    });

    it("should display correct approved count", async () => {
      renderComponent();

      await waitFor(() => {
        // Use H3 helper to find the stats card heading specifically
        const approvedStatHeading = getApprovedStatCard();
        const statCard = approvedStatHeading.parentElement!;
        expect(within(statCard).getByText("2")).toBeInTheDocument();
      });
    });

    it("should display correct pending count", async () => {
      renderComponent();

      await waitFor(() => {
        // Use H3 helper to find the stats card heading specifically
        const pendingStatHeading = getPendingStatCard();
        const statCard = pendingStatHeading.parentElement!;
        expect(within(statCard).getByText("1")).toBeInTheDocument();
      });
    });

    it("should calculate and display average base price", async () => {
      renderComponent();

      // Average of 100, 50, 200 = 116.67
      await waitFor(() => {
        const avgCard = screen.getByText("Avg Base Price").parentElement!;
        expect(within(avgCard).getByText(/116\.67/)).toBeInTheDocument();
      });
    });

    it("should show dash for average when no products", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/items/get-categories") {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url === "/api/user/store/items/my-items") {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();

      await waitFor(() => {
        const avgCard = screen.getByText("Avg Base Price").parentElement!;
        expect(within(avgCard).getByText("—")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Modal — Open & Close
  // ============================================================================
  describe("Product Modal — Open & Close", () => {
    it("should open Create New Product modal when Add Product is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Create New Product")).toBeInTheDocument();
      });
    });

    it("should close product modal when × button is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Create New Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("×"));

      await waitFor(() => {
        expect(
          screen.queryByText("Create New Product")
        ).not.toBeInTheDocument();
      });
    });

    it("should open Edit Product modal with pre-filled data when Edit is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const editBtns = screen.getAllByText("Edit");
      fireEvent.click(editBtns[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Product")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Product 1")).toBeInTheDocument();
      });
    });

    it("should display all required form fields in modal", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Name *")).toBeInTheDocument();
        expect(screen.getByText("Category *")).toBeInTheDocument();
        expect(screen.getByText("Currency *")).toBeInTheDocument();
        expect(screen.getByText("Base Price *")).toBeInTheDocument();
        expect(screen.getByText("Monthly Price")).toBeInTheDocument();
        expect(screen.getByText("Yearly Price")).toBeInTheDocument();
        expect(screen.getByText("Lifetime Price")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Modal — Currency Selection
  // ============================================================================
  describe("Product Modal — Currency Selection", () => {
    it("should display INR rupee symbol by default in price fields", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        const rupeeSymbols = screen.getAllByText("₹");
        expect(rupeeSymbols.length).toBeGreaterThan(0);
      });
    });

    it("should show dollar symbol when USD currency is selected", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Create New Product")).toBeInTheDocument();
      });

      const currencySelects = screen.getAllByRole("combobox");
      const currencySelect = currencySelects.find((s) =>
        Array.from(s.querySelectorAll("option")).some((o) =>
          o.textContent?.includes("USD")
        )
      );

      if (currencySelect) {
        fireEvent.change(currencySelect, { target: { value: "USD" } });

        await waitFor(() => {
          const dollarSymbols = screen.getAllByText("$");
          expect(dollarSymbols.length).toBeGreaterThan(0);
        });
      }
    });
  });

  // ============================================================================
  // TEST GROUP: Product Modal — Price Stepper
  // ============================================================================
  describe("Product Modal — Price Stepper", () => {
    it("should allow entering a base price value", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Base Price *")).toBeInTheDocument();
      });

      const numberInputs = document.querySelectorAll('input[type="number"]');
      const basePriceInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(basePriceInput, { target: { value: "100" } });

      expect(basePriceInput.value).toBe("100");
    });

    it("should increment base price when Increase button is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Base Price *")).toBeInTheDocument();
      });

      const numberInputs = document.querySelectorAll('input[type="number"]');
      const basePriceInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(basePriceInput, { target: { value: "100" } });

      const increaseButtons = screen.getAllByTitle("Increase");
      fireEvent.click(increaseButtons[0]);

      await waitFor(() => {
        expect(basePriceInput.value).toBe("100.01");
      });
    });

    it("should decrement base price when Decrease button is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Base Price *")).toBeInTheDocument();
      });

      const numberInputs = document.querySelectorAll('input[type="number"]');
      const basePriceInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(basePriceInput, { target: { value: "100" } });

      const decreaseButtons = screen.getAllByTitle("Decrease");
      fireEvent.click(decreaseButtons[0]);

      await waitFor(() => {
        expect(basePriceInput.value).toBe("99.99");
      });
    });

    it("should NOT allow price to go below 0 when Decrease button is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Base Price *")).toBeInTheDocument();
      });

      const numberInputs = document.querySelectorAll('input[type="number"]');
      const basePriceInput = numberInputs[0] as HTMLInputElement;
      fireEvent.change(basePriceInput, { target: { value: "0" } });

      const decreaseButtons = screen.getAllByTitle("Decrease");
      fireEvent.click(decreaseButtons[0]);

      await waitFor(() => {
        expect(Number(basePriceInput.value)).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Category Modal
  // ============================================================================
  describe("Category Modal", () => {
    it("should open Create New Category modal when add category button is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        expect(screen.getByText("Create New Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle("Add new category"));

      await waitFor(() => {
        expect(screen.getByText("Create New Category")).toBeInTheDocument();
      });
    });

    it("should close category modal when × is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));
      fireEvent.click(await screen.findByTitle("Add new category"));

      await waitFor(() => {
        expect(screen.getByText("Create New Category")).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByText("×");
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      await waitFor(() => {
        expect(
          screen.queryByText("Create New Category")
        ).not.toBeInTheDocument();
      });
    });

    it("should call create-category API when Create Category is submitted", async () => {
      const newCategory = { id: "cat4", name: "New Category" };
      (axios.post as jest.Mock).mockResolvedValue({
        data: { category: newCategory },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));
      fireEvent.click(await screen.findByTitle("Add new category"));

      await waitFor(() => {
        expect(screen.getByText("Create New Category")).toBeInTheDocument();
      });

      const textInputs = screen.getAllByRole("textbox");
      const categoryInput = textInputs[textInputs.length - 1];
      fireEvent.change(categoryInput, { target: { value: "New Category" } });

      fireEvent.click(screen.getByText("Create Category"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/create-category",
          { name: "New Category" }
        );
        expect(toast.success).toHaveBeenCalledWith(
          "Category created successfully!"
        );
      });
    });

    it("should show error toast when category name is empty on submit", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));
      fireEvent.click(await screen.findByTitle("Add new category"));

      await waitFor(() => {
        expect(screen.getByText("Create New Category")).toBeInTheDocument();
      });

      // The category input has `required` — jsdom won't fire submit on empty required fields.
      // Directly call the onSubmit handler by dispatching a submit event on the form.
      const forms = document.querySelectorAll("form");
      const categoryForm = Array.from(forms).find((f) =>
        f.querySelector('input[placeholder="Enter category name"]')
      );

      if (categoryForm) {
        fireEvent.submit(categoryForm);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Category name cannot be empty"
        );
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Update
  // ============================================================================
  describe("Product Update", () => {
    it("should call update API when Update Product is submitted", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const editBtns = screen.getAllByText("Edit");
      fireEvent.click(editBtns[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Product")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Product 1");
      fireEvent.change(nameInput, { target: { value: "Updated Product" } });

      fireEvent.click(screen.getByText("Update Product"));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          "Product updated successfully!"
        );
      });
    });

    it("should show error toast when product update fails", async () => {
      (axios.put as jest.Mock).mockRejectedValue(new Error("Update failed"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const editBtns = screen.getAllByText("Edit");
      fireEvent.click(editBtns[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Update Product"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update product.");
      });
    });

    it("should close modal after successful product update", async () => {
      (axios.put as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const editBtns = screen.getAllByText("Edit");
      fireEvent.click(editBtns[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Update Product"));

      await waitFor(() => {
        expect(screen.queryByText("Edit Product")).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Deletion
  // ============================================================================
  describe("Product Deletion", () => {
    it("should call delete API when deletion is confirmed", async () => {
      (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });
      window.confirm = jest.fn(() => true);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const deleteBtns = screen.getAllByText("Delete");
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          "Are you sure you want to delete this product?"
        );
        expect(axios.delete).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          "Product deleted successfully!"
        );
      });
    });

    it("should NOT call delete API when confirmation is cancelled", async () => {
      window.confirm = jest.fn(() => false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const deleteBtns = screen.getAllByText("Delete");
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(axios.delete).not.toHaveBeenCalled();
      });
    });

    it("should show error toast when product deletion fails", async () => {
      (axios.delete as jest.Mock).mockRejectedValue(new Error("Delete failed"));
      window.confirm = jest.fn(() => true);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      const deleteBtns = screen.getAllByText("Delete");
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete product.");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: File Upload
  // ============================================================================
  describe("File Upload", () => {
    it("should accept PDF files for download field", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        const downloadInput = Array.from(fileInputs).find((input) =>
          input.getAttribute("accept")?.includes("pdf")
        );
        expect(downloadInput).toBeInTheDocument();
        expect(downloadInput).toHaveAttribute("accept", ".pdf,application/pdf");
      });
    });

    it("should show error toast when non-PDF file is uploaded to download field", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Add Product")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Product"));

      await waitFor(() => {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        const downloadInput = Array.from(fileInputs).find((input) =>
          input.getAttribute("accept")?.includes("pdf")
        ) as HTMLInputElement;

        if (downloadInput) {
          const file = new File(["content"], "document.txt", {
            type: "text/plain",
          });
          Object.defineProperty(downloadInput, "files", {
            value: [file],
            configurable: true,
          });
          fireEvent.change(downloadInput);
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Only PDF files are allowed for download"
        );
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
        const backLink = screen.getByText("Back to Growth Store").closest("a");
        expect(backLink).toHaveAttribute("href", "/dashboard/store");
      });
    });
  });
});