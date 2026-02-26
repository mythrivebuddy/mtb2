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
import StorePage from "@/app/(userDashboard)/dashboard/store/page";

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
jest.mock("sonner");

// Define proper types for mock components
interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface CarouselProps {
  children: React.ReactNode;
}

// Mock Next.js Image component to render as regular img tag
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImageProps) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock custom PageLoader component
jest.mock("@/components/PageLoader", () => {
  return function PageLoader() {
    return <div>Loading...</div>;
  };
});

// Mock axios error message utility
jest.mock("@/utils/ax", () => ({
  getAxiosErrorMessage: jest.fn((error, defaultMsg) => defaultMsg || "Error occurred"),
}));

// Mock UI Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className }: ButtonProps) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

// Mock Carousel components
jest.mock("@/components/ui/carousel", () => ({
  Carousel: ({ children }: CarouselProps) => <div data-testid="carousel">{children}</div>,
  CarouselContent: ({ children }: CarouselProps) => <div>{children}</div>,
  CarouselItem: ({ children }: CarouselProps) => <div>{children}</div>,
  CarouselPrevious: () => <button>Previous</button>,
  CarouselNext: () => <button>Next</button>,
}));

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock product categories
const mockCategories = [
  { id: "cat1", name: "Electronics" },
  { id: "cat2", name: "Books" },
];

// Mock authenticated user with monthly membership
const mockUser = {
  id: "user1",
  name: "Test User",
  email: "test@example.com",
  membership: "MONTHLY",
};

// Mock product items with different properties
const mockItems = [
  {
    id: "item1",
    name: "Test Product 1",
    imageUrl: "https://example.com/image1.jpg",
    basePrice: 100,
    monthlyPrice: 90,
    yearlyPrice: 80,
    lifetimePrice: 70,
    isApproved: true, // Only approved items show in store
    createdByUserId: "user1", // User's own product
    createdByRole: "USER",
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
    isApproved: true,
    createdByUserId: "admin1", // Admin product
    createdByRole: "ADMIN",
    category: { id: "cat2", name: "Books" },
    currency: "USD",
  },
  {
    id: "item3",
    name: "Unapproved Product",
    imageUrl: "https://example.com/image3.jpg",
    basePrice: 50,
    monthlyPrice: 45,
    yearlyPrice: 40,
    lifetimePrice: 35,
    isApproved: false, // Should not appear in store
    createdByUserId: "user1",
    createdByRole: "USER",
    category: { id: "cat1", name: "Electronics" },
    currency: "INR",
  },
];

// Mock user's wishlist
const mockWishlist = [
  { id: "wish1", itemId: "item1", userId: "user1" },
];

// ============================================================================
// TEST SUITE
// ============================================================================

describe("StorePage", () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();

  // ============================================================================
  // SETUP - Runs before each test
  // ============================================================================
  beforeEach(() => {
    // Create fresh QueryClient for each test to avoid state pollution
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }, // Don't retry failed queries in tests
        mutations: { retry: false }, // Don't retry failed mutations in tests
      },
    });

    // Mock router.push for navigation testing
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup default axios mock responses for all API endpoints
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/user/store/items/get-categories") {
        return Promise.resolve({ data: { categories: mockCategories } });
      }
      if (url === "/api/user/store/profile") {
        return Promise.resolve({ data: { user: mockUser } });
      }
      if (url === "/api/user/store/items/wishlist") {
        return Promise.resolve({ data: { wishlist: mockWishlist } });
      }
      if (url === "/api/user/store/items/get-all-items") {
        return Promise.resolve({ data: { items: mockItems } });
      }
      if (url.includes("/api/user/store/items/get-items-by-category")) {
        // Filter items by category ID from query parameter
        const categoryId = url.split("category=")[1];
        const filteredItems = mockItems.filter(
          (item) => item.category.id === categoryId
        );
        return Promise.resolve({ data: { items: filteredItems } });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ============================================================================
  // HELPER FUNCTION - Renders component with QueryClient provider
  // ============================================================================
  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <StorePage />
      </QueryClientProvider>
    );
  };

  // ============================================================================
  // TEST GROUP: Initial Rendering
  // Tests the component's initial load state and basic UI elements
  // ============================================================================
  describe("Initial Rendering", () => {
    /**
     * Test: Loading State Display
     * Verifies that a loading indicator appears while data is being fetched
     */
    it("should show loading state initially", () => {
      renderComponent();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    /**
     * Test: Main UI Elements
     * Verifies the store title and navigation link render correctly
     */
    it("should render store title and navigation", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("🛍 Store")).toBeInTheDocument();
      });

      expect(screen.getByText("My Cart & Orders")).toBeInTheDocument();
    });

    /**
     * Test: Carousel Banner
     * Verifies the carousel with promotional banners is rendered
     */
    it("should render carousel with banner images", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId("carousel")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Filters
  // Tests the ALL/MY/ADMIN product filter functionality
  // ============================================================================
  describe("Product Filters", () => {
    /**
     * Test: Filter Buttons Render
     * Verifies all three product filter buttons are displayed
     * Note: "All Products" appears twice (button + heading)
     */
    it("should render product filter buttons", async () => {
      renderComponent();
      
      await waitFor(() => {
        const allProductsElements = screen.getAllByText("All Products");
        expect(allProductsElements.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("My Products")).toBeInTheDocument();
      expect(screen.getByText("Admin Products")).toBeInTheDocument();
    });

    /**
     * Test: My Products Filter
     * Verifies clicking "My Products" shows only user-created items
     */
    it("should filter products by 'My Products'", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      const myProductsButton = screen.getByText("My Products");
      fireEvent.click(myProductsButton);

      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
        expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
      });
    });

    /**
     * Test: Admin Products Filter
     * Verifies clicking "Admin Products" shows only admin-created items
     */
    it("should filter products by 'Admin Products'", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      });

      const adminProductsButton = screen.getByText("Admin Products");
      fireEvent.click(adminProductsButton);

      await waitFor(() => {
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
        expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
      });
    });

    /**
     * Test: Unapproved Items Hidden
     * Verifies that products not approved don't appear in the store
     */
    it("should not display unapproved items", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.queryByText("Unapproved Product")).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Category Filters
  // Tests filtering products by category (Electronics, Books, etc.)
  // ============================================================================
  describe("Category Filters", () => {
    /**
     * Test: Category Buttons Render
     * Verifies category filter buttons appear
     * Note: Category names appear twice (button + product label)
     */
    it("should render category filter buttons", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("All Categories")).toBeInTheDocument();
      });

      const categoryButtons = screen.getAllByText("Electronics");
      expect(categoryButtons.length).toBeGreaterThan(0);
      
      const bookButtons = screen.getAllByText("Books");
      expect(bookButtons.length).toBeGreaterThan(0);
    });

    /**
     * Test: Filter by Specific Category
     * Verifies clicking a category button filters products to that category
     */
    it("should filter items by selected category", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      // Get all buttons and find the Electronics category button (not the product category label)
      const buttons = screen.getAllByRole("button");
      const electronicsButton = buttons.find(
        (btn) => btn.textContent === "Electronics" && btn.className.includes("bg-jp-orange")
      );
      
      expect(electronicsButton).toBeDefined();
      if (electronicsButton) {
        fireEvent.click(electronicsButton);
      }

      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
        expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
      });
    });

    /**
     * Test: All Categories Button
     * Verifies clicking "All Categories" shows all products again
     */
    it("should show all items when 'All Categories' is selected", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      // First select a category to filter
      const buttons = screen.getAllByRole("button");
      const electronicsButton = buttons.find(
        (btn) => btn.textContent === "Electronics" && btn.className.includes("bg-jp-orange")
      );
      
      if (electronicsButton) {
        fireEvent.click(electronicsButton);
      }

      await waitFor(() => {
        expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
      });

      // Then select all categories to show everything
      fireEvent.click(screen.getByText("All Categories"));

      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Product Display
  // Tests how products are displayed on the page
  // ============================================================================
  describe("Product Display", () => {
    /**
     * Test: Product Information Display
     * Verifies product name, category, and price are shown correctly
     */
    it("should display product information correctly", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      // Check that Electronics appears (both as button and product category)
      const electronicsElements = screen.getAllByText("Electronics");
      expect(electronicsElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText("₹90")).toBeInTheDocument(); // Monthly price for INR
    });

    /**
     * Test: USD Currency Display
     * Verifies $ symbol displays correctly for USD products
     */
    it("should display correct currency symbol for USD", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      });

      expect(screen.getByText("$180")).toBeInTheDocument(); // Monthly price for USD
    });

    /**
     * Test: Membership-Based Pricing
     * Verifies prices adjust based on user's membership level
     */
    it("should display correct price based on membership level", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("₹90")).toBeInTheDocument(); // Monthly membership price
      });
    });

    /**
     * Test: Empty State
     * Verifies appropriate message shows when no products are available
     */
    it("should show empty state when no items available", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/items/get-categories") {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ data: { user: mockUser } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url === "/api/user/store/items/get-all-items") {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("No items available.")).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Wishlist Functionality
  // Tests adding/removing items from wishlist
  // ============================================================================
  describe("Wishlist Functionality", () => {
    /**
     * Test: Wishlist Icon Display
     * Verifies heart icon is filled for items already in wishlist
     */
    it("should display heart icon filled for wishlisted items", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      const heartIcons = screen.getAllByRole("button");
      const wishlistButton = heartIcons.find((btn) => 
        btn.querySelector(".fill-red-500")
      );
      
      expect(wishlistButton).toBeInTheDocument();
    });

    /**
     * Test: Add to Wishlist
     * Verifies clicking heart adds item to wishlist
     */
    it("should add item to wishlist when heart icon clicked", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      });

      const product2Card = screen.getByText("Test Product 2").closest("div");
      const wishlistButton = product2Card?.querySelector("button");
      
      if (wishlistButton) {
        fireEvent.click(wishlistButton);
      }

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/wishlist",
          { itemId: "item2" }
        );
        expect(toast.success).toHaveBeenCalledWith("Added to wishlist");
      });
    });

    /**
     * Test: Remove from Wishlist
     * Verifies clicking filled heart removes item from wishlist
     */
    it("should remove item from wishlist when heart icon clicked", async () => {
      (axios.delete as jest.Mock).mockResolvedValue({ data: {} });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      const product1Card = screen.getByText("Test Product 1").closest("div");
      const wishlistButton = product1Card?.querySelector("button");
      
      if (wishlistButton) {
        fireEvent.click(wishlistButton);
      }

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/user/store/items/wishlist",
          { data: { itemId: "item1" } }
        );
        expect(toast.info).toHaveBeenCalledWith("Removed from wishlist");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Cart Functionality
  // Tests adding items to shopping cart
  // ============================================================================
  describe("Cart Functionality", () => {
    /**
     * Test: Add to Cart Success
     * Verifies clicking "Add to Cart" button adds item successfully
     */
    it("should add item to cart when 'Add to Cart' clicked", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByText(/Add to Cart/i);
      fireEvent.click(addToCartButtons[0]);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/user/store/items/cart/add-cart-items",
          { itemId: "item1" }
        );
        expect(toast.success).toHaveBeenCalledWith("Item added to cart");
      });
    });

    /**
     * Test: Add to Cart Error Handling
     * Verifies error toast appears when add to cart fails
     */
    it("should show error toast when add to cart fails", async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error("Failed to add"));

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByText(/Add to Cart/i);
      fireEvent.click(addToCartButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong! Please try again.");
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Buy Now Functionality
  // Tests immediate checkout navigation
  // ============================================================================
  describe("Buy Now Functionality", () => {
    /**
     * Test: Navigate to Checkout
     * Verifies "Buy Now" button navigates to checkout with correct item
     */
    it("should navigate to checkout when 'Buy Now' clicked", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      });

      const buyNowButtons = screen.getAllByText(/Buy Now/i);
      fireEvent.click(buyNowButtons[0]);

      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/store/checkout?cartItem=item1:1"
      );
    });
  });

  // ============================================================================
  // TEST GROUP: Price Calculation
  // Tests dynamic pricing based on membership levels
  // ============================================================================
  describe("Price Calculation", () => {
    /**
     * Test: FREE Membership Pricing
     * Verifies base price displays for FREE membership
     */
    it("should display base price for FREE membership", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ 
            data: { user: { ...mockUser, membership: "FREE" } } 
          });
        }
        if (url === "/api/user/store/items/get-categories") {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url === "/api/user/store/items/get-all-items") {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("₹100")).toBeInTheDocument(); // Base price
      });
    });

    /**
     * Test: YEARLY Membership Pricing
     * Verifies yearly discounted price displays for YEARLY membership
     */
    it("should display yearly price for YEARLY membership", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ 
            data: { user: { ...mockUser, membership: "YEARLY" } } 
          });
        }
        if (url === "/api/user/store/items/get-categories") {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url === "/api/user/store/items/get-all-items") {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("₹80")).toBeInTheDocument(); // Yearly price
      });
    });

    /**
     * Test: LIFETIME Membership Pricing
     * Verifies lifetime discounted price displays for LIFETIME membership
     */
    it("should display lifetime price for LIFETIME membership", async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === "/api/user/store/profile") {
          return Promise.resolve({ 
            data: { user: { ...mockUser, membership: "LIFETIME" } } 
          });
        }
        if (url === "/api/user/store/items/get-categories") {
          return Promise.resolve({ data: { categories: mockCategories } });
        }
        if (url === "/api/user/store/items/wishlist") {
          return Promise.resolve({ data: { wishlist: [] } });
        }
        if (url === "/api/user/store/items/get-all-items") {
          return Promise.resolve({ data: { items: mockItems } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("₹70")).toBeInTheDocument(); // Lifetime price
      });
    });
  });

  // ============================================================================
  // TEST GROUP: Navigation
  // Tests page navigation links
  // ============================================================================
  describe("Navigation", () => {
    /**
     * Test: Cart and Orders Link
     * Verifies link to cart and orders page exists with correct href
     */
    it("should have link to cart and orders page", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("My Cart & Orders")).toBeInTheDocument();
      });

      const link = screen.getByText("My Cart & Orders").closest("a");
      expect(link).toHaveAttribute("href", "/dashboard/store/profile");
    });
  });
});