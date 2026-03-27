import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductDetailPage from "@/app/(admin)/admin/manage-store-product/[id]/page";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: () => ({ back: mockBack }),
}));
import { useParams } from "next/navigation";
const mockedUseParams = useParams as jest.Mock;

jest.mock("@/components/PageSkeleton", () => ({
  __esModule: true,
  default: ({ type }: { type: string }) => (
    <div data-testid="page-skeleton">{type}</div>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
  }) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
}));

// ─── Global fetch mock ────────────────────────────────────────────────────────

const originalFetch = global.fetch;
afterAll(() => { global.fetch = originalFetch; });

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_PRODUCT = {
  id: "prod-123",
  name: "Protein Guide",
  basePrice: 499,
  monthlyPrice: 99,
  yearlyPrice: 799,
  lifetimePrice: 1499,
  imageUrl: "https://example.com/image.jpg",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-02-20T14:00:00Z",
  downloadUrl: "https://example.com/file.pdf",
  approvedAt: "2024-01-16T09:00:00Z",
  isApproved: true,
  createdByRole: "ADMIN",
  currency: "INR",
  category: { id: "cat-1", name: "Nutrition" },
  createdByUserId: "user-1",
  categoryId: "cat-1",
  creator: {
    id: "user-1",
    name: "Admin User",
    email: "admin@test.com",
    image: null,
  },
  approvedBy: {
    id: "user-2",
    name: "Super Admin",
    email: "super@test.com",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderComponent() {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ProductDetailPage />
    </QueryClientProvider>
  );
}

function mockFetchSuccess(product = BASE_PRODUCT) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ product }),
  });
}

function mockFetchFailure() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({}),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProductDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParams.mockReturnValue({ id: "prod-123" });
  });

  // ── Loading ────────────────────────────────────────────────────────────────

  describe("loading state", () => {
    it("shows skeleton while data is loading", () => {
      global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
      renderComponent();
      expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
    });

    it("skeleton has type 'approve'", () => {
      global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
      renderComponent();
      expect(screen.getByTestId("page-skeleton")).toHaveTextContent("approve");
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe("error / not found state", () => {
    it("shows 'Product Not Found' heading when fetch fails", async () => {
      mockFetchFailure();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Product Not Found")).toBeInTheDocument()
      );
    });

    it("shows the error message from the Error object", async () => {
      mockFetchFailure();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Failed to fetch product details")).toBeInTheDocument()
      );
    });

    it("calls router.back() when Go Back button is clicked on error", async () => {
      mockFetchFailure();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Product Not Found")).toBeInTheDocument()
      );
      await userEvent.click(screen.getByText(/Go Back/));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it("does not fetch when id is missing", () => {
      mockedUseParams.mockReturnValue({ id: undefined });
      global.fetch = jest.fn();
      renderComponent();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ── Success — basic content ────────────────────────────────────────────────

  describe("product detail display", () => {
    beforeEach(async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("fetches from correct URL", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/store/items/prod-123"
      );
    });

    it("renders the product name as heading", () => {
      expect(screen.getByRole("heading", { name: "Protein Guide" })).toBeInTheDocument();
    });

    it("renders the category badge", () => {
      // "Nutrition" appears in both the header badge and the info row
      expect(screen.getAllByText("Nutrition").length).toBeGreaterThanOrEqual(1);
    });

    it("renders the createdByRole badge", () => {
      // "ADMIN" appears in both the header badge and the Badge component in the info card
      expect(screen.getAllByText("ADMIN").length).toBeGreaterThanOrEqual(1);
    });

    it("renders the product ID in a monospace element", () => {
      expect(screen.getByText("prod-123")).toBeInTheDocument();
    });

    it("renders the category ID at the bottom", () => {
      expect(screen.getByText("cat-1")).toBeInTheDocument();
    });

    it("renders creator name", () => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    it("renders creator email", () => {
      expect(screen.getAllByText("admin@test.com").length).toBeGreaterThan(0);
    });

    it("renders approver name", () => {
      expect(screen.getByText("Super Admin")).toBeInTheDocument();
    });

    it("shows the product image with correct src", () => {
      const img = screen.getByRole("img", { name: "Protein Guide" });
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("renders Back to Products button", () => {
      expect(screen.getByText(/Back to Products/)).toBeInTheDocument();
    });

    it("calls router.back() when Back button is clicked", async () => {
      await userEvent.click(screen.getByText(/Back to Products/));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  // ── Approval status ────────────────────────────────────────────────────────

  describe("approval status display", () => {
    it("shows 'Approved' badge when product is approved", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, isApproved: true });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      // Multiple "Approved" instances are expected (hero banner + info card)
      expect(screen.getAllByText("Approved").length).toBeGreaterThanOrEqual(1);
    });

    it("shows 'Pending Approval' in hero and 'Pending' badge when not approved", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, isApproved: false, approvedAt: null, approvedBy: null });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      expect(screen.getByText("Pending Approval")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("shows approved date when product is approved", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      // formatDate produces something like "January 16, 2024 at ..."
      expect(screen.getByText(/January 16, 2024/)).toBeInTheDocument();
    });

    it("shows 'Not yet approved' when approvedAt is null", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, isApproved: false, approvedAt: null, approvedBy: null });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Not yet approved")).toBeInTheDocument()
      );
    });

    it("shows dash when approvedBy is null", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, approvedBy: null });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("falls back to approver email when name is null", async () => {
      mockFetchSuccess({
        ...BASE_PRODUCT,
        approvedBy: { id: "u2", name: null, email: "approver@test.com" },
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("approver@test.com")).toBeInTheDocument()
      );
    });
  });

  // ── Pricing ────────────────────────────────────────────────────────────────

  describe("pricing cards", () => {
    it("renders Base price card with INR symbol", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      expect(screen.getByText("₹499.00")).toBeInTheDocument();
    });

    it("renders Monthly price with INR symbol", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("₹99.00")).toBeInTheDocument()
      );
    });

    it("renders Yearly price with INR symbol", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("₹799.00")).toBeInTheDocument()
      );
    });

    it("renders Lifetime price with INR symbol", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("₹1499.00")).toBeInTheDocument()
      );
    });

    it("renders USD prices with $ symbol and 2 decimals", async () => {
      mockFetchSuccess({
        ...BASE_PRODUCT,
        currency: "USD",
        basePrice: 29.99,
        monthlyPrice: 9.99,
        yearlyPrice: 79.99,
        lifetimePrice: 149.99,
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("$29.99")).toBeInTheDocument()
      );
      expect(screen.getByText("$9.99")).toBeInTheDocument();
    });

    it("renders GP prices as integers with GP prefix", async () => {
      mockFetchSuccess({
        ...BASE_PRODUCT,
        currency: "GP",
        basePrice: 500,
        monthlyPrice: 100,
        yearlyPrice: 800,
        lifetimePrice: 2000,
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("GP500")).toBeInTheDocument()
      );
      expect(screen.getByText("GP100")).toBeInTheDocument();
    });

    it("renders JP prices as integers with JP prefix", async () => {
      mockFetchSuccess({
        ...BASE_PRODUCT,
        currency: "JP",
        basePrice: 300,
        monthlyPrice: 50,
        yearlyPrice: null,
        lifetimePrice: null,
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("JP300")).toBeInTheDocument()
      );
    });

    it("shows '—' for null price fields", async () => {
      mockFetchSuccess({
        ...BASE_PRODUCT,
        monthlyPrice: null,
        yearlyPrice: null,
        lifetimePrice: null,
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      const dashes = screen.getAllByText("—");
      // 3 null prices → 3 dashes (approvedBy is present so no extra dash there)
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });

    it("renders pricing section label with currency code", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText(/Pricing \(INR\)/)).toBeInTheDocument()
      );
    });

    it("renders all four price-card labels", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      expect(screen.getByText("Base")).toBeInTheDocument();
      expect(screen.getByText("Monthly")).toBeInTheDocument();
      expect(screen.getByText("Yearly")).toBeInTheDocument();
      expect(screen.getByText("Lifetime")).toBeInTheDocument();
    });
  });

  // ── Currency display ───────────────────────────────────────────────────────

  describe("currency badge and icon", () => {
    it("shows INR currency badge in hero", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      expect(screen.getAllByText("INR").length).toBeGreaterThan(0);
    });

    it("shows USD currency badge in hero", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, currency: "USD" });
      renderComponent();
      await waitFor(() =>
        expect(screen.getAllByText("USD").length).toBeGreaterThan(0)
      );
    });

    it("shows GP currency badge in hero", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, currency: "GP" });
      renderComponent();
      await waitFor(() =>
        expect(screen.getAllByText("GP").length).toBeGreaterThan(0)
      );
    });

    it("shows JP currency badge in hero", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, currency: "JP" });
      renderComponent();
      await waitFor(() =>
        expect(screen.getAllByText("JP").length).toBeGreaterThan(0)
      );
    });

    it("defaults to INR when currency is undefined", async () => {
      const { currency: _, ...withoutCurrency } = BASE_PRODUCT;
      mockFetchSuccess(withoutCurrency as typeof BASE_PRODUCT);
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      expect(screen.getAllByText("INR").length).toBeGreaterThan(0);
    });
  });

  // ── Download & image links ─────────────────────────────────────────────────

  describe("download and image links", () => {
    it("renders Download File button when downloadUrl is present", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      // Target the <a> that wraps the download button specifically
      const downloadLink = document
        .querySelector<HTMLAnchorElement>('a[href="https://example.com/file.pdf"]');
      expect(downloadLink).not.toBeNull();
      expect(downloadLink).toHaveAttribute("target", "_blank");
    });

    it("does NOT render Download File button when downloadUrl is null", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, downloadUrl: null });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      // The action-area button (inside an <a>) should not be present; the InfoRow label still is
      const downloadButton = screen.queryByRole("button", {
        name: /Download File/,
      });
      expect(downloadButton).not.toBeInTheDocument();
    });

    it("shows 'Available' link in details when downloadUrl exists", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Available")).toBeInTheDocument()
      );
      const link = screen.getByText("Available").closest("a");
      expect(link).toHaveAttribute("href", "https://example.com/file.pdf");
    });

    it("shows 'Not provided' when downloadUrl is null in details", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, downloadUrl: null });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Not provided")).toBeInTheDocument()
      );
    });

    it("renders View Image button linking to imageUrl", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText(/View Image/)).toBeInTheDocument()
      );
      const link = screen.getByText(/View Image/).closest("a");
      expect(link).toHaveAttribute("href", "https://example.com/image.jpg");
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  // ── Date formatting ────────────────────────────────────────────────────────

  describe("date formatting", () => {
    it("formats createdAt as a readable date", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument()
      );
    });

    it("formats updatedAt as a readable date", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText(/February 20, 2024/)).toBeInTheDocument()
      );
    });

    it("shows '—' for null date fields", async () => {
      mockFetchSuccess({
        ...BASE_PRODUCT,
        approvedAt: null,
        approvedBy: null,
        downloadUrl: null,
        monthlyPrice: null,
        yearlyPrice: null,
        lifetimePrice: null,
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Creator fallback ───────────────────────────────────────────────────────

  describe("creator display", () => {
    it("shows creator name when available", async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Admin User")).toBeInTheDocument()
      );
    });

    it("falls back to creator email when name is null", async () => {
      mockFetchSuccess({
        ...BASE_PRODUCT,
        creator: { id: "u1", name: null, email: "creator@test.com", image: null },
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getAllByText("creator@test.com").length).toBeGreaterThan(0)
      );
    });

    it("shows createdByRole badge", async () => {
      mockFetchSuccess({ ...BASE_PRODUCT, createdByRole: "USER" });
      renderComponent();
      await waitFor(() =>
        expect(screen.getAllByText("USER").length).toBeGreaterThanOrEqual(1)
      );
    });
  });

  // ── Section labels ─────────────────────────────────────────────────────────

  describe("section headings", () => {
    beforeEach(async () => {
      mockFetchSuccess();
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("renders 'Product Details' section heading", () => {
      expect(screen.getByText("Product Details")).toBeInTheDocument();
    });

    it("renders 'Approval & Creator' section heading", () => {
      expect(screen.getByText("Approval & Creator")).toBeInTheDocument();
    });

    it("renders info row labels", () => {
      expect(screen.getByText("Product ID")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Currency")).toBeInTheDocument();
      expect(screen.getByText("Created At")).toBeInTheDocument();
      expect(screen.getByText("Last Updated")).toBeInTheDocument();
      // "Download File" appears as both the action button and the InfoRow label — use getAllByText
      expect(screen.getAllByText("Download File").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Approval Status")).toBeInTheDocument();
      expect(screen.getByText("Approved At")).toBeInTheDocument();
      expect(screen.getByText("Approved By")).toBeInTheDocument();
      expect(screen.getByText("Created By")).toBeInTheDocument();
      expect(screen.getByText("Created By Role")).toBeInTheDocument();
    });
  });
});