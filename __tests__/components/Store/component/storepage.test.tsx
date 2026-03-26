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
import StorePageComponent from "@/app/(userDashboard)/dashboard/store/_components/StorePageComponent";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth — must mock the entire module so useSession never touches SessionProvider
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

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  ShoppingCart: function ShoppingCart({ className }: { className?: string }) {
    return <div className={className}>ShoppingCart Icon</div>;
  },
  Heart: function Heart({ className }: { className?: string }) {
    return <div className={className}>Heart Icon</div>;
  },
  PlusCircle: function PlusCircle({ className }: { className?: string }) {
    return <div className={className}>PlusCircle Icon</div>;
  },
  ChevronDown: function ChevronDown({ className }: { className?: string }) {
    return <div className={className}>ChevronDown Icon</div>;
  },
  Check: function Check({ className }: { className?: string }) {
    return <div className={className}>Check Icon</div>;
  },
  History: function History({ className }: { className?: string }) {
    return <div className={className}>History Icon</div>;
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
  user: {
    name: "Test User",
    email: "test@example.com",
  },
  expires: "2025-12-31",
};

const mockCategories = [
  { id: "cat1", name: "Books" },
  { id: "cat2", name: "Courses" },
  { id: "cat3", name: "Software" },
];

const mockItems = [
  {
    id: "item1",
    name: "Mindset Mastery Book",
    basePrice: 499,
    currency: "INR",
    imageUrl: "https://example.com/book.jpg",
    isApproved: true,
    createdByRole: "ADMIN",
    category: { id: "cat1", name: "Books" },
  },
  {
    id: "item2",
    name: "Coach Leadership Course",
    basePrice: 999,
    currency: "INR",
    imageUrl: "https://example.com/course.jpg",
    isApproved: true,
    createdByRole: "USER",
    category: { id: "cat2", name: "Courses" },
  },
  {
    id: "item3",
    name: "GP Reward Item",
    basePrice: 50,
    currency: "GP",
    imageUrl: "https://example.com/gp.jpg",
    isApproved: true,
    createdByRole: "ADMIN",
    category: { id: "cat1", name: "Books" },
  },
  {
    id: "item4",
    name: "Dollar Software",
    basePrice: 29,
    currency: "USD",
    imageUrl: "https://example.com/software.jpg",
    isApproved: true,
    createdByRole: "ADMIN",
    category: { id: "cat3", name: "Software" },
  },
  {
    id: "item5",
    name: "Unapproved Product",
    basePrice: 100,
    currency: "INR",
    imageUrl: "https://example.com/hidden.jpg",
    isApproved: false,
    createdByRole: "ADMIN",
    category: { id: "cat1", name: "Books" },
  },
];

const mockWishlist = [{ id: "w1", itemId: "item1", item: { id: "item1" } }];

const mockCartItems = [{ id: "c1", itemId: "item2", item: { id: "item2" } }];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * The h1 contains "🛍 Growth Store" — use a regex so the emoji doesn't break matching.
 */
const findPageTitle = () => screen.getByText(/Growth Store/i);

/**
 * "All Products" appears in both the dropdown <span> trigger AND the <h2> heading.
 * This helper targets only the dropdown button trigger.
 */
const getProductFilterDropdownButton = () => {
  const spans = screen.getAllByText(/^All Products$/);
  const triggerSpan = spans.find(
    (el) => el.tagName === "SPAN" && el.closest("button") !== null
  );
  if (!triggerSpan) throw new Error("Could not find product-filter dropdown button");
  return triggerSpan.closest("button") as HTMLElement;
};

/**
 * "Books" / "Courses" / "Software" appear both as dropdown option buttons
 * AND as category badges on product cards when the dropdown is open.
 * This helper clicks the dropdown <button> whose inner <span> exactly matches the text.
 */
const clickDropdownOption = (optionText: string) => {
  const allButtons = screen.getAllByRole("button");
  const optionButton = allButtons.find((btn) => {
    const span = btn.querySelector("span");
    return span?.textContent?.trim() === optionText;
  });
  if (!optionButton) throw new Error(`Dropdown option "${optionText}" not found`);
  fireEvent.click(optionButton);
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("StorePageComponent", () => {
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

    // Default: authenticated user
    (useSession as jest.Mock).mockReturnValue({
      data: mockAuthenticatedSession,
      status: "authenticated",
    });

    // Default axios mocks
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("get-categories")) {
        return Promise.resolve({ data: { categories: mockCategories } });
      }
      if (url.includes("get-all-items")) {
        return Promise.resolve({ data: { items: mockItems } });
      }
      if (url.includes("get-items-by-category")) {
        return Promise.resolve({ data: { items: mockItems.slice(0, 2) } });
      }
      if (url.includes("wishlist")) {
        return Promise.resolve({ data: { wishlist: mockWishlist } });
      }
      if (url.includes("get-cart-items")) {
        return Promise.resolve({ data: { cart: mockCartItems } });
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
        <StorePageComponent />
      </QueryClientProvider>
    );
  };

  // ============================================================================
  // TEST GROUP: Loading State
  // ============================================================================
  describe("Loading State", () => {
    it("should show page loader while data is being fetched for unauthenticated user", () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      (axios.get as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });

    it("should show page loader for authenticated user while cart and wishlist load", () => {
      (axios.get as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderComponent();
      expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Layout & Authentication
  // ============================================================================
  describe("Layout & Authentication", () => {
    it("should render inside AppLayout for unauthenticated users", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-categories")) {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url.includes("get-all-items")) {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("app-layout")).toBeInTheDocument();
      });
    });

    it("should NOT render inside AppLayout for authenticated users", async () => {
      renderComponent();

      // h1 contains emoji — use regex
      await waitFor(() => {
        expect(findPageTitle()).toBeInTheDocument();
      });

      expect(screen.queryByTestId("app-layout")).not.toBeInTheDocument();
    });

    it("should show Order History and My Cart buttons for authenticated users", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Order History")).toBeInTheDocument();
        expect(screen.getByText("My Cart & Orders")).toBeInTheDocument();
      });
    });

    it("should NOT show Order History and My Cart buttons for unauthenticated users", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-categories")) {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url.includes("get-all-items")) {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      // Use the emoji-safe regex matcher
      await waitFor(() => {
        expect(findPageTitle()).toBeInTheDocument();
      });

      expect(screen.queryByText("Order History")).not.toBeInTheDocument();
      expect(screen.queryByText("My Cart & Orders")).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Initial Rendering
  // ============================================================================
  describe("Initial Rendering", () => {
    it("should render page title and description", async () => {
      renderComponent();

      await waitFor(() => {
        // h1 is "🛍 Growth Store" — use regex to avoid emoji mismatch
        expect(findPageTitle()).toBeInTheDocument();
        expect(screen.getByText(/Explore curated products/i)).toBeInTheDocument();
      });
    });

    it("should render search input", async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search products or categories...")
        ).toBeInTheDocument();
      });
    });

    it("should render All Categories dropdown trigger", async () => {
      renderComponent();

      await waitFor(() => {
        const spans = screen.getAllByText("All Categories");
        expect(spans.length).toBeGreaterThan(0);
      });
    });

    it("should render All Products dropdown trigger button", async () => {
      renderComponent();

      await waitFor(() => {
        expect(getProductFilterDropdownButton()).toBeInTheDocument();
      });
    });

    it("should render correct product count label", async () => {
      renderComponent();

      // 4 approved items out of 5 (item5 is unapproved)
      await waitFor(() => {
        expect(screen.getByText(/4 products found/i)).toBeInTheDocument();
      });
    });

    it("should render singular product found label when only one result", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-categories")) {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url.includes("get-all-items")) {
          return Promise.resolve({ data: { items: [mockItems[0]] } });
        }
        if (url.includes("wishlist")) {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url.includes("get-cart-items")) {
          return Promise.resolve({ data: { cart: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/1 product found/i)).toBeInTheDocument();
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

    it("should fetch all items on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/get-all-items"
        );
      });
    });

    it("should fetch wishlist for authenticated users", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/user/store/items/wishlist");
      });
    });

    it("should fetch cart items for authenticated users", async () => {
      renderComponent();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/user/store/items/cart/get-cart-items"
        );
      });
    });

    it("should NOT fetch wishlist or cart for unauthenticated users", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-categories")) {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url.includes("get-all-items")) {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      // Use regex to handle emoji in h1
      await waitFor(() => {
        expect(findPageTitle()).toBeInTheDocument();
      });

      expect(axios.get).not.toHaveBeenCalledWith("/api/user/store/items/wishlist");
      expect(axios.get).not.toHaveBeenCalledWith(
        "/api/user/store/items/cart/get-cart-items"
      );
    });

    it("should display all approved items after fetching", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
        expect(screen.getByText("GP Reward Item")).toBeInTheDocument();
        expect(screen.getByText("Dollar Software")).toBeInTheDocument();
      });
    });

    it("should NOT display unapproved items", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      expect(screen.queryByText("Unapproved Product")).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Product Display
  // ============================================================================
  describe("Product Display", () => {
    it("should display product images", async () => {
      renderComponent();

      await waitFor(() => {
        const images = screen.getAllByRole("img");
        expect(images.length).toBeGreaterThan(0);
        expect(images[0]).toHaveAttribute("src", "https://example.com/book.jpg");
      });
    });

    it("should display category badge on each product card", async () => {
      renderComponent();

      await waitFor(() => {
        const booksBadges = screen.getAllByText("Books");
        expect(booksBadges.length).toBeGreaterThan(0);
      });
    });

    it("should display INR price with rupee symbol and 2 decimal places", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("₹499.00")).toBeInTheDocument();
      });
    });

    it("should display USD price with dollar symbol and 2 decimal places", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("$29.00")).toBeInTheDocument();
      });
    });

    it("should display GP price with space between symbol and value", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("GP 50")).toBeInTheDocument();
      });
    });

    it("should show GP currency badge for GP items", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("GP Reward Item")).toBeInTheDocument();
        expect(screen.getByText("GP")).toBeInTheDocument();
      });
    });

    it("should show USD currency badge for USD items", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("USD")).toBeInTheDocument();
      });
    });

    it("should NOT show currency badge for INR items", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      expect(screen.queryByText("INR")).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEST GROUP: Search Functionality
  // ============================================================================
  describe("Search Functionality", () => {
    it("should filter products by name when typing in search", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText("Search products or categories..."),
        { target: { value: "Mindset" } }
      );

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
        expect(screen.queryByText("Coach Leadership Course")).not.toBeInTheDocument();
      });
    });

    it("should filter products by category name when typing in search", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText("Search products or categories..."),
        { target: { value: "Courses" } }
      );

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
        expect(screen.queryByText("Mindset Mastery Book")).not.toBeInTheDocument();
      });
    });

    it("should be case-insensitive when searching", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText("Search products or categories..."),
        { target: { value: "mindset" } }
      );

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });
    });

    it("should show No products found when search has no matches", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText("Search products or categories..."),
        { target: { value: "xyznonexistentproduct" } }
      );

      await waitFor(() => {
        expect(screen.getByText("No products found")).toBeInTheDocument();
        expect(screen.getByText("Try adjusting your search or filters")).toBeInTheDocument();
      });
    });

    it("should restore all products when search input is cleared", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search products or categories...");
      fireEvent.change(searchInput, { target: { value: "Mindset" } });

      await waitFor(() => {
        expect(screen.queryByText("Coach Leadership Course")).not.toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: "" } });

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
      });
    });

    it("should show 0 products found when all items are filtered out", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText("Search products or categories..."),
        { target: { value: "zzznomatch" } }
      );

      await waitFor(() => {
        expect(screen.getByText(/0 products found/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Category Dropdown Filtering
  // ============================================================================
  describe("Category Dropdown Filtering", () => {
    it("should show category option buttons when dropdown is opened", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText("All Categories").length).toBeGreaterThan(0);
      });

      // Click the trigger span
      const spans = screen.getAllByText("All Categories");
      const triggerSpan = spans.find(
        (el) => el.tagName === "SPAN" && el.closest("button") !== null
      )!;
      fireEvent.click(triggerSpan.closest("button")!);

      await waitFor(() => {
        // Verify option buttons exist (span inside button)
        const allButtons = screen.getAllByRole("button");
        const booksOption = allButtons.find(
          (btn) => btn.querySelector("span")?.textContent?.trim() === "Books"
        );
        const coursesOption = allButtons.find(
          (btn) => btn.querySelector("span")?.textContent?.trim() === "Courses"
        );
        const softwareOption = allButtons.find(
          (btn) => btn.querySelector("span")?.textContent?.trim() === "Software"
        );
        expect(booksOption).toBeInTheDocument();
        expect(coursesOption).toBeInTheDocument();
        expect(softwareOption).toBeInTheDocument();
      });
    });

    it("should call get-items-by-category API when a category is selected", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText("All Categories").length).toBeGreaterThan(0);
      });

      const spans = screen.getAllByText("All Categories");
      const triggerSpan = spans.find(
        (el) => el.tagName === "SPAN" && el.closest("button") !== null
      )!;
      fireEvent.click(triggerSpan.closest("button")!);

      await waitFor(() => {
        clickDropdownOption("Books");
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining("get-items-by-category?category=cat1")
        );
      });
    });

    it("should update results heading to selected category name", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText("All Categories").length).toBeGreaterThan(0);
      });

      const spans = screen.getAllByText("All Categories");
      const triggerSpan = spans.find(
        (el) => el.tagName === "SPAN" && el.closest("button") !== null
      )!;
      fireEvent.click(triggerSpan.closest("button")!);

      await waitFor(() => {
        clickDropdownOption("Books");
      });

      await waitFor(() => {
        expect(screen.getByText("Books Items")).toBeInTheDocument();
      });
    });

    it("should close dropdown when clicking outside", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText("All Categories").length).toBeGreaterThan(0);
      });

      const spans = screen.getAllByText("All Categories");
      const triggerSpan = spans.find(
        (el) => el.tagName === "SPAN" && el.closest("button") !== null
      )!;
      fireEvent.click(triggerSpan.closest("button")!);

      // Verify dropdown is open — "Courses" option button exists
      await waitFor(() => {
        const allButtons = screen.getAllByRole("button");
        const coursesOption = allButtons.find(
          (btn) => btn.querySelector("span")?.textContent?.trim() === "Courses"
        );
        expect(coursesOption).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      // Dropdown closed — "Courses" option button no longer exists
      await waitFor(() => {
        const allButtons = screen.getAllByRole("button");
        const coursesOption = allButtons.find(
          (btn) => btn.querySelector("span")?.textContent?.trim() === "Courses"
        );
        expect(coursesOption).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Filter Dropdown
  // ============================================================================
  describe("Product Filter Dropdown", () => {
    it("should show only ADMIN products when Products by MTB is selected", async () => {
      renderComponent();

      await waitFor(() => {
        expect(getProductFilterDropdownButton()).toBeInTheDocument();
      });

      fireEvent.click(getProductFilterDropdownButton());

      await waitFor(() => {
        clickDropdownOption("Products by MTB");
      });

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
        expect(screen.queryByText("Coach Leadership Course")).not.toBeInTheDocument();
      });
    });

    it("should show only USER products when Products by Coaches is selected", async () => {
      renderComponent();

      await waitFor(() => {
        expect(getProductFilterDropdownButton()).toBeInTheDocument();
      });

      fireEvent.click(getProductFilterDropdownButton());

      await waitFor(() => {
        clickDropdownOption("Products by Coaches");
      });

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
        expect(screen.queryByText("Mindset Mastery Book")).not.toBeInTheDocument();
      });
    });

    it("should update results heading to h2 when Products by MTB filter is active", async () => {
      renderComponent();

      await waitFor(() => {
        expect(getProductFilterDropdownButton()).toBeInTheDocument();
      });

      fireEvent.click(getProductFilterDropdownButton());

      await waitFor(() => {
        clickDropdownOption("Products by MTB");
      });

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Products by MTB" })
        ).toBeInTheDocument();
      });
    });

    it("should update results heading to h2 when Products by Coaches filter is active", async () => {
      renderComponent();

      await waitFor(() => {
        expect(getProductFilterDropdownButton()).toBeInTheDocument();
      });

      fireEvent.click(getProductFilterDropdownButton());

      await waitFor(() => {
        clickDropdownOption("Products by Coaches");
      });

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Products by Coaches" })
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Empty State
  // ============================================================================
  describe("Empty State", () => {
    it("should show no products found when API returns empty list", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-categories")) {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url.includes("get-all-items")) {
          return Promise.resolve({ data: { items: [] } });
        }
        if (url.includes("wishlist")) {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url.includes("get-cart-items")) {
          return Promise.resolve({ data: { cart: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("No products found")).toBeInTheDocument();
        expect(screen.getByText("No items available at the moment")).toBeInTheDocument();
      });
    });

    it("should show Try adjusting hint when search has no results", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText("Search products or categories..."),
        { target: { value: "zzznomatch" } }
      );

      await waitFor(() => {
        expect(screen.getByText("Try adjusting your search or filters")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Cart Interactions
  // ============================================================================
  describe("Cart Interactions", () => {
    it("should show Cart button for items already in cart", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
      });

      // item2 is in mockCartItems
      const courseCard = screen
        .getByText("Coach Leadership Course")
        .closest(".bg-white") as HTMLElement;
      expect(within(courseCard).getByText("Cart")).toBeInTheDocument();
    });

    it("should show Add to Cart button for items not in cart", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      expect(within(bookCard).getByText("Add to Cart")).toBeInTheDocument();
    });

    it("should call add-cart-items API when Add to Cart is clicked", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getByText("Add to Cart"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/cart/add-cart-items",
          { itemId: "item1" }
        );
      });
    });

    it("should show success toast when item is added to cart", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getByText("Add to Cart"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Item added to cart");
      });
    });

    it("should redirect unauthenticated user to signin when Add to Cart is clicked", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-categories")) {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url.includes("get-all-items")) {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText("Add to Cart")[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/signin?callbackUrl=")
        );
      });
    });

    it("should show error toast when add-to-cart API fails", async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error("Network Error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getByText("Add to Cart"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Something went wrong! Please try again."
        );
      });
    });

    it("should show Adding label while cart API request is in progress", async () => {
      (axios.post as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getByText("Add to Cart"));

      await waitFor(() => {
        expect(within(bookCard).getByText("Adding...")).toBeInTheDocument();
      });
    });

    it("should navigate to cart page when Cart link is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
      });

      const courseCard = screen
        .getByText("Coach Leadership Course")
        .closest(".bg-white") as HTMLElement;
      const cartLink = within(courseCard).getByText("Cart").closest("a");
      expect(cartLink).toHaveAttribute("href", "/dashboard/store/profile");
    });
  });

  // ============================================================================
  // TEST GROUP: Buy Now
  // ============================================================================
  describe("Buy Now", () => {
    it("should navigate to checkout page for authenticated user", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getByText("Buy Now"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/dashboard/store/checkout?cartItem=item1:1"
        );
      });
    });

    it("should redirect unauthenticated user to signin when Buy Now is clicked", async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("get-categories")) {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url.includes("get-all-items")) {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText("Buy Now")[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/signin?callbackUrl=")
        );
      });
    });

    it("should include correct item ID in checkout URL", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("GP Reward Item")).toBeInTheDocument();
      });

      const gpCard = screen
        .getByText("GP Reward Item")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(gpCard).getByText("Buy Now"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/dashboard/store/checkout?cartItem=item3:1"
        );
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Wishlist Interactions
  // ============================================================================
  describe("Wishlist Interactions", () => {
    it("should call DELETE API to remove item already in wishlist", async () => {
      (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      // item1 is in mockWishlist
      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/user/store/items/wishlist",
          { data: { itemId: "item1" } }
        );
      });
    });

    it("should call POST API to add item not yet in wishlist", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
      });

      // item2 is NOT in mockWishlist
      const courseCard = screen
        .getByText("Coach Leadership Course")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(courseCard).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/wishlist",
          { itemId: "item2" }
        );
      });
    });

    it("should show Removed from wishlist toast when item is removed", async () => {
      (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith("Removed from wishlist");
      });
    });

    it("should show Added to wishlist toast when item is added", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Coach Leadership Course")).toBeInTheDocument();
      });

      const courseCard = screen
        .getByText("Coach Leadership Course")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(courseCard).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Added to wishlist");
      });
    });

    it("should show error toast if wishlist API fails", async () => {
      (axios.delete as jest.Mock).mockRejectedValue(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Mindset Mastery Book")).toBeInTheDocument();
      });

      const bookCard = screen
        .getByText("Mindset Mastery Book")
        .closest(".bg-white") as HTMLElement;
      fireEvent.click(within(bookCard).getAllByRole("button")[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Navigation
  // ============================================================================
  describe("Navigation", () => {
    it("should navigate to order history when Order History button is clicked", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Order History")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Order History"));

      expect(mockPush).toHaveBeenCalledWith("/dashboard/store/order-history");
    });

    it("should have My Cart and Orders link pointing to store profile", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("My Cart & Orders")).toBeInTheDocument();
      });

      const cartLink = screen.getByText("My Cart & Orders").closest("a");
      expect(cartLink).toHaveAttribute("href", "/dashboard/store/profile");
    });
  });
});