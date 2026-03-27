import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import ProductManagement from  "@/app/(admin)/admin/manage-store-product/page";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("axios");
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/utils/ax", () => ({
  getAxiosErrorMessage: (_err: unknown, fallback: string) => fallback,
}));
jest.mock("@/components/PageSkeleton", () => ({
  __esModule: true,
  default: ({ type }: { type: string }) => <div data-testid="page-skeleton">{type}</div>,
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Nutrition" },
  { id: "cat-2", name: "Fitness" },
];

const MOCK_ITEMS = [
  {
    id: "item-1",
    name: "Protein Guide",
    categoryId: "cat-1",
    basePrice: 499,
    monthlyPrice: 99,
    yearlyPrice: 799,
    lifetimePrice: 1499,
    currency: "INR",
    isApproved: true,
    createdByRole: "ADMIN",
    creator: { name: "Admin User", email: "admin@test.com" },
    approver: { name: "Super Admin", email: "super@test.com" },
  },
  {
    id: "item-2",
    name: "Workout Plan",
    categoryId: "cat-2",
    basePrice: 29.99,
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    lifetimePrice: 149.99,
    currency: "USD",
    isApproved: false,
    createdByRole: "USER",
    creator: { name: "Coach Bob", email: "bob@test.com" },
    approver: null,
  },
  {
    id: "item-3",
    name: "GP Bundle",
    categoryId: "cat-1",
    basePrice: 500,
    monthlyPrice: 100,
    yearlyPrice: 800,
    lifetimePrice: 2000,
    currency: "GP",
    isApproved: false,
    createdByRole: "USER",
    creator: { name: "Coach Alice", email: "alice@test.com" },
    approver: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderComponent() {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ProductManagement />
    </QueryClientProvider>
  );
}

function mockApiSuccess() {
  mockedAxios.get.mockImplementation((url: string) => {
    if (url.includes("categories"))
      return Promise.resolve({ data: { categories: MOCK_CATEGORIES } });
    return Promise.resolve({ data: { items: MOCK_ITEMS } });
  });
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe("ProductManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiSuccess();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("initial render", () => {
    it("shows the page heading", () => {
      renderComponent();
      expect(screen.getByText("Product Management")).toBeInTheDocument();
    });

    it("shows Add New Product and Add New Category buttons", () => {
      renderComponent();
      expect(screen.getByText("Add New Product")).toBeInTheDocument();
      expect(screen.getByText("Add New Category")).toBeInTheDocument();
    });

    it("shows skeleton while loading", () => {
      // Delay so loading state is visible
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));
      renderComponent();
      expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
    });

    it("renders items table after data loads", async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      expect(screen.getByText("Workout Plan")).toBeInTheDocument();
      expect(screen.getByText("GP Bundle")).toBeInTheDocument();
    });

    it("shows empty state when no items exist", async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes("categories"))
          return Promise.resolve({ data: { categories: MOCK_CATEGORIES } });
        return Promise.resolve({ data: { items: [] } });
      });
      renderComponent();
      await waitFor(() =>
        expect(
          screen.getByText("No products found. Create your first product!")
        ).toBeInTheDocument()
      );
    });

    it("shows error state when items fetch fails", async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes("categories"))
          return Promise.resolve({ data: { categories: MOCK_CATEGORIES } });
        return Promise.reject(new Error("Network Error"));
      });
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      );
    });

    it("toasts on categories fetch error", async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes("categories"))
          return Promise.reject(new Error("Cat error"));
        return Promise.resolve({ data: { items: MOCK_ITEMS } });
      });
      renderComponent();
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to load categories")
        )
      );
    });
  });

  // ── Table Content ──────────────────────────────────────────────────────────

  describe("table data display", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("shows Approved badge for approved item", () => {
      const rows = screen.getAllByRole("row");
      const proteinRow = rows.find((r) => within(r).queryByText("Protein Guide"));
      expect(within(proteinRow!).getByText("Approved")).toBeInTheDocument();
    });

    it("shows Pending badge for unapproved item", () => {
      const rows = screen.getAllByRole("row");
      const workoutRow = rows.find((r) => within(r).queryByText("Workout Plan"));
      expect(within(workoutRow!).getByText("Pending")).toBeInTheDocument();
    });

    it("displays INR currency badge for INR item", () => {
      const rows = screen.getAllByRole("row");
      const proteinRow = rows.find((r) => within(r).queryByText("Protein Guide"));
      expect(within(proteinRow!).getByText("INR")).toBeInTheDocument();
    });

    it("displays USD currency badge for USD item", () => {
      const rows = screen.getAllByRole("row");
      const workoutRow = rows.find((r) => within(r).queryByText("Workout Plan"));
      expect(within(workoutRow!).getByText("USD")).toBeInTheDocument();
    });

    it("displays GP currency badge for GP item", () => {
      const rows = screen.getAllByRole("row");
      const gpRow = rows.find((r) => within(r).queryByText("GP Bundle"));
      expect(within(gpRow!).getByText("GP")).toBeInTheDocument();
    });

    it("shows category name resolved from categoryId", () => {
      expect(screen.getAllByText("Nutrition").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Fitness").length).toBeGreaterThan(0);
    });

    it("renders creator name for ADMIN role", () => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    it("renders creator name for USER (coach) role", () => {
      expect(screen.getByText("Coach Bob")).toBeInTheDocument();
    });

    it("shows approver name when present", () => {
      expect(screen.getByText("Super Admin")).toBeInTheDocument();
    });

    it("shows dash when no approver", () => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it("formats INR prices with 2 decimal places and ₹ symbol", () => {
      expect(screen.getByText("₹499.00")).toBeInTheDocument();
    });

    it("formats USD prices with 2 decimal places and $ symbol", () => {
      expect(screen.getByText("$29.99")).toBeInTheDocument();
    });

    it("formats GP prices as integers with GP prefix", () => {
      expect(screen.getByText("GP500")).toBeInTheDocument();
    });
  });

  // ── Filtering ──────────────────────────────────────────────────────────────

  describe("search and filter", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("filters by search query (case-insensitive)", async () => {
      await userEvent.type(
        screen.getByPlaceholderText("Search products…"),
        "protein"
      );
      await waitFor(() =>
        expect(screen.queryByText("Workout Plan")).not.toBeInTheDocument()
      );
      expect(screen.getByText("Protein Guide")).toBeInTheDocument();
    });

    it("shows 'no match' message when search yields nothing", async () => {
      await userEvent.type(
        screen.getByPlaceholderText("Search products…"),
        "xyznonexistent"
      );
      await waitFor(() =>
        expect(
          screen.getByText("No products match your filters.")
        ).toBeInTheDocument()
      );
    });

    it("filters by approval status — approved only", async () => {
      const select = screen.getByDisplayValue("All Status");
      await userEvent.selectOptions(select, "approved");
      await waitFor(() =>
        expect(screen.queryByText("Workout Plan")).not.toBeInTheDocument()
      );
      expect(screen.getByText("Protein Guide")).toBeInTheDocument();
    });

    it("filters by approval status — pending only", async () => {
      const select = screen.getByDisplayValue("All Status");
      await userEvent.selectOptions(select, "pending");
      await waitFor(() =>
        expect(screen.queryByText("Protein Guide")).not.toBeInTheDocument()
      );
      expect(screen.getByText("Workout Plan")).toBeInTheDocument();
    });

    it("filters by creator — admin only", async () => {
      const select = screen.getByDisplayValue("All Creators");
      await userEvent.selectOptions(select, "admin");
      await waitFor(() =>
        expect(screen.queryByText("Workout Plan")).not.toBeInTheDocument()
      );
      expect(screen.getByText("Protein Guide")).toBeInTheDocument();
    });

    it("filters by creator — coach only", async () => {
      const select = screen.getByDisplayValue("All Creators");
      await userEvent.selectOptions(select, "coach");
      await waitFor(() =>
        expect(screen.queryByText("Protein Guide")).not.toBeInTheDocument()
      );
      expect(screen.getByText("Workout Plan")).toBeInTheDocument();
    });

    it("filters by category", async () => {
      const categorySelect = screen.getByDisplayValue("All Categories");
      await userEvent.selectOptions(categorySelect, "cat-2");
      await waitFor(() =>
        expect(screen.queryByText("Protein Guide")).not.toBeInTheDocument()
      );
      expect(screen.getByText("Workout Plan")).toBeInTheDocument();
    });
  });

  // ── Create / Edit Modal ────────────────────────────────────────────────────

  describe("create/edit modal", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("opens modal on 'Add New Product'", async () => {
      await userEvent.click(screen.getByText("Add New Product"));
      expect(screen.getByText("Create New Item")).toBeInTheDocument();
    });

    it("closes modal on × button", async () => {
      await userEvent.click(screen.getByText("Add New Product"));
      await userEvent.click(screen.getByText("×"));
      expect(screen.queryByText("Create New Item")).not.toBeInTheDocument();
    });

    it("opens edit modal pre-filled when clicking edit button", async () => {
      const editButtons = screen.getAllByTitle("Edit");
      await userEvent.click(editButtons[0]);
      await waitFor(() =>
        expect(screen.getByText("Edit Item")).toBeInTheDocument()
      );
      expect(screen.getByDisplayValue("Protein Guide")).toBeInTheDocument();
    });

    it("shows image as optional when editing", async () => {
      const editButtons = screen.getAllByTitle("Edit");
      await userEvent.click(editButtons[0]);
      await waitFor(() =>
        expect(screen.getByText("Edit Item")).toBeInTheDocument()
      );
      expect(
        screen.getByText("Leave empty to keep current image")
      ).toBeInTheDocument();
    });

    it("shows currency dropdown with all 3 options", async () => {
      await userEvent.click(screen.getByText("Add New Product"));
      const currencySelect = screen.getByDisplayValue("INR (₹)");
      expect(currencySelect).toBeInTheDocument();
      expect(within(currencySelect).queryByText("INR (₹)")).toBeInTheDocument;
    });

    it("validates: shows error when no image on create", async () => {
      await userEvent.click(screen.getByText("Add New Product"));

      // Type into the name textbox (first textbox in the modal)
      const nameInput = screen.getAllByRole("textbox")[0];
      await userEvent.type(nameInput, "Test Product");

      // Select a category via the first combobox (category select)
      const comboboxes = screen.getAllByRole("combobox");
      await userEvent.selectOptions(comboboxes[0], "cat-1");

      // Bypass HTML5 required validation to reach JS handler
      const form = screen.getByText("Create Item").closest("form")!;
      fireEvent.submit(form);
      expect(toast.error).toHaveBeenCalledWith("Please upload an image");
    });

    it("calls create API and shows success toast on valid submit", async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await userEvent.click(screen.getByText("Add New Product"));

      // Name: first textbox in the modal
      const nameInput = screen.getAllByRole("textbox")[0];
      await userEvent.type(nameInput, "New Item");

      // Category: first combobox
      const comboboxes = screen.getAllByRole("combobox");
      await userEvent.selectOptions(comboboxes[0], "cat-1");

      // Image: file input that accepts image/*  — query by accept attribute
      const imageInput = screen
        .getAllByRole("textbox", { hidden: true })
        // getAllByRole won't find file inputs; use querySelector on the form
        [0].closest("form")!
        .querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]')!;
      const file = new File(["dummy"], "test.png", { type: "image/png" });
      await userEvent.upload(imageInput, file);

      const form = screen.getByText("Create Item").closest("form")!;
      fireEvent.submit(form);

      await waitFor(() =>
        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/admin/store/items",
          expect.any(FormData),
          expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
        )
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Item created successfully!")
      );
    });

    it("calls update API and shows success toast on edit submit", async () => {
      mockedAxios.put.mockResolvedValue({ data: {} });

      const editButtons = screen.getAllByTitle("Edit");
      await userEvent.click(editButtons[0]);
      await waitFor(() =>
        expect(screen.getByText("Edit Item")).toBeInTheDocument()
      );

      await userEvent.click(screen.getByText("Update Item"));

      await waitFor(() =>
        expect(mockedAxios.put).toHaveBeenCalledWith(
          "/api/admin/store/items/item-1",
          expect.any(FormData),
          expect.anything()
        )
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Item updated successfully!")
      );
    });

    it("resets form when modal is closed and reopened", async () => {
      await userEvent.click(screen.getByText("Add New Product"));
      // Name input is the first textbox rendered inside the modal form
      const nameInput = () => screen.getAllByRole("textbox")[0];
      await userEvent.type(nameInput(), "Temp");
      expect(nameInput()).toHaveValue("Temp");

      await userEvent.click(screen.getByText("×"));
      await userEvent.click(screen.getByText("Add New Product"));
      expect(nameInput()).toHaveValue("");
    });
  });

  // ── Price Stepper ──────────────────────────────────────────────────────────

  describe("price stepper", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      await userEvent.click(screen.getByText("Add New Product"));
    });

    it("increments price on up arrow click", async () => {
      const upButtons = screen.getAllByTitle("Increase");
      const basePriceInput = screen
        .getAllByPlaceholderText("0.00")[0] as HTMLInputElement;

      await userEvent.click(upButtons[0]);
      expect(parseFloat(basePriceInput.value)).toBeCloseTo(0.01, 2);
    });

    it("decrements price on down arrow click", async () => {
      const upButtons = screen.getAllByTitle("Increase");
      const downButtons = screen.getAllByTitle("Decrease");
      const basePriceInput = screen
        .getAllByPlaceholderText("0.00")[0] as HTMLInputElement;

      // Go up twice then down once → 0.01
      await userEvent.click(upButtons[0]);
      await userEvent.click(upButtons[0]);
      await userEvent.click(downButtons[0]);
      expect(parseFloat(basePriceInput.value)).toBeCloseTo(0.01, 2);
    });

    it("does not decrement below 0", async () => {
      const downButtons = screen.getAllByTitle("Decrease");
      const basePriceInput = screen
        .getAllByPlaceholderText("0.00")[0] as HTMLInputElement;

      await userEvent.click(downButtons[0]);
      expect(parseFloat(basePriceInput.value || "0")).toBe(0);
    });

    it("allows direct numeric input", async () => {
      const basePriceInput = screen.getAllByPlaceholderText("0.00")[0];
      await userEvent.clear(basePriceInput);
      await userEvent.type(basePriceInput, "99.99");
      expect((basePriceInput as HTMLInputElement).value).toBe("99.99");
    });

    it("currency symbol prefix updates when currency changes", async () => {
      const currencySelect = screen.getByDisplayValue("INR (₹)");
      await userEvent.selectOptions(currencySelect, "USD");
      // prefix spans should now show $
      const prefixes = screen
        .getAllByText("$")
        .filter((el) => el.tagName === "SPAN");
      expect(prefixes.length).toBeGreaterThan(0);
    });
  });

  // ── Category Modal ─────────────────────────────────────────────────────────

  describe("category modal", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("opens on 'Add New Category' button", async () => {
      await userEvent.click(screen.getByText("Add New Category"));
      expect(screen.getByText("Create New Category")).toBeInTheDocument();
    });

    it("closes on × button", async () => {
      await userEvent.click(screen.getByText("Add New Category"));
      const closeBtn = screen
        .getAllByText("×")
        .find((btn) =>
          btn.closest(".max-w-md")
        );
      await userEvent.click(closeBtn!);
      expect(screen.queryByText("Create New Category")).not.toBeInTheDocument();
    });

    it("shows error when submitting empty category name", async () => {
      await userEvent.click(screen.getByText("Add New Category"));
      // The input has `required`, so userEvent.click on the button triggers
      // browser validation which never calls the JS handler.
      // Use fireEvent.submit directly on the form to bypass HTML5 validation.
      const form = screen.getByText("Create Category").closest("form")!;
      fireEvent.submit(form);
      expect(toast.error).toHaveBeenCalledWith("Category name cannot be empty");
    });

    it("calls create category API and shows success", async () => {
      mockedAxios.post.mockResolvedValue({
        data: { category: { id: "cat-3", name: "Yoga" } },
      });

      await userEvent.click(screen.getByText("Add New Category"));
      // Label has no htmlFor — get the text input inside the category modal form
      const form = screen.getByText("Create Category").closest("form")!;
      const categoryNameInput = within(form).getByRole("textbox");
      await userEvent.type(categoryNameInput, "Yoga");
      await userEvent.click(screen.getByText("Create Category"));

      await waitFor(() =>
        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/admin/store/items/categories",
          { name: "Yoga" }
        )
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          "Category created successfully!"
        )
      );
    });

    it("can also be opened from within the product modal via + button", async () => {
      await userEvent.click(screen.getByText("Add New Product"));
      await userEvent.click(screen.getByText("+"));
      expect(screen.getByText("Create New Category")).toBeInTheDocument();
    });
  });

  // ── Approve / Disapprove ───────────────────────────────────────────────────

  describe("approve / disapprove actions", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("approve button is disabled for already-approved items", () => {
      const approveButtons = screen.getAllByTitle("Approve");
      // item-1 is approved → its button should be disabled
      expect(approveButtons[0]).toBeDisabled();
    });

    it("disapprove button is disabled for already-disapproved items", () => {
      const disapproveButtons = screen.getAllByTitle("Disapprove");
      // item-2 is not approved → its disapprove button should be disabled
      expect(disapproveButtons[1]).toBeDisabled();
    });

    it("calls approve API on approve click", async () => {
      mockedAxios.patch.mockResolvedValue({ data: {} });

      const approveButtons = screen.getAllByTitle("Approve");
      // item-2 (index 1) is not approved so its Approve btn is enabled
      await userEvent.click(approveButtons[1]);

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          "/api/admin/store/items/item-2/approve",
          { isApproved: true }
        )
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Item approved successfully!")
      );
    });

    it("calls disapprove API on disapprove click", async () => {
      mockedAxios.patch.mockResolvedValue({ data: {} });

      const disapproveButtons = screen.getAllByTitle("Disapprove");
      // item-1 (index 0) is approved so its Disapprove btn is enabled
      await userEvent.click(disapproveButtons[0]);

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          "/api/admin/store/items/item-1/approve",
          { isApproved: false }
        )
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Item disapproved successfully!")
      );
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  describe("delete action", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
    });

    it("prompts confirmation before deleting", async () => {
      window.confirm = jest.fn().mockReturnValue(false);
      const deleteButtons = screen.getAllByTitle("Delete");
      await userEvent.click(deleteButtons[0]);
      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this item?"
      );
      expect(mockedAxios.delete).not.toHaveBeenCalled();
    });

    it("calls delete API when confirmed", async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      mockedAxios.delete.mockResolvedValue({ data: {} });

      const deleteButtons = screen.getAllByTitle("Delete");
      await userEvent.click(deleteButtons[0]);

      await waitFor(() =>
        expect(mockedAxios.delete).toHaveBeenCalledWith(
          "/api/admin/store/items/item-1"
        )
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Item deleted successfully!")
      );
    });

    it("shows error toast when delete fails", async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      mockedAxios.delete.mockRejectedValue(new Error("Delete failed"));

      const deleteButtons = screen.getAllByTitle("Delete");
      await userEvent.click(deleteButtons[0]);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Failed to delete item.")
      );
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe("view details navigation", () => {
    it("navigates to detail page on View click", async () => {
      const push = jest.fn();
      jest
        .spyOn(require("next/navigation"), "useRouter")
        .mockReturnValue({ push });

      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );

      const viewButtons = screen.getAllByTitle("View Details");
      await userEvent.click(viewButtons[0]);
      expect(push).toHaveBeenCalledWith(
        "/admin/manage-store-product/item-1"
      );
    });
  });

  // ── Download file validation ───────────────────────────────────────────────

  describe("download file upload", () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      await userEvent.click(screen.getByText("Add New Product"));
    });

    it("accepts PDF files without error", async () => {
      const form = screen.getByText("Create Item").closest("form")!;
      const fileInput = form.querySelector<HTMLInputElement>(
        'input[type="file"][accept=".pdf,application/pdf"]'
      )!;
      const pdf = new File(["%PDF-1.4"], "file.pdf", {
        type: "application/pdf",
      });
      await userEvent.upload(fileInput, pdf);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  // ── Currency helpers ───────────────────────────────────────────────────────

  describe("getCurrencySymbol utility", () => {
    it("returns ₹ for INR", async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Protein Guide")).toBeInTheDocument()
      );
      // ₹ appears as price prefix in Protein Guide row
      expect(screen.getByText("₹499.00")).toBeInTheDocument();
    });

    it("returns $ for USD", async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("Workout Plan")).toBeInTheDocument()
      );
      expect(screen.getByText("$29.99")).toBeInTheDocument();
    });

    it("returns GP for GP currency", async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("GP Bundle")).toBeInTheDocument()
      );
      expect(screen.getByText("GP500")).toBeInTheDocument();
    });
  });
});