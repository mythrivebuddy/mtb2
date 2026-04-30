"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import {
  Item,
  ItemFormData,
  Category,
} from "@/types/client/manage-store-product";
import PageSkeleton from "@/components/PageSkeleton";
import { CheckCircle, XCircle, Pencil, Trash2, Eye, Copy } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Currency Config ───────────────────────────────────────────────────────────
const CURRENCIES = [
  { value: "INR", label: "INR", symbol: "₹" },
  { value: "USD", label: "USD", symbol: "$" },
  { value: "GP", label: "GP", symbol: "GP" }, // Growth Points
];

const getCurrencySymbol = (currency: string) =>
  CURRENCIES.find((c) => c.value === currency)?.symbol ?? "₹";

// ─── Price field config ────────────────────────────────────────────────────────
const PRICE_FIELDS: {
  key: keyof ItemFormData;
  label: string;
  required: boolean;
}[] = [
  { key: "basePrice", label: "Base Price", required: true },
  { key: "monthlyPrice", label: "Monthly Price", required: false },
  { key: "yearlyPrice", label: "Yearly Price", required: false },
  { key: "lifetimePrice", label: "Lifetime Price", required: false },
];

// ─── Blank form ────────────────────────────────────────────────────────────────
const BLANK_FORM: ItemFormData = {
  name: "",
  category: "",
  basePrice: "" as unknown as number,
  monthlyPrice: "" as unknown as number,
  yearlyPrice: "" as unknown as number,
  lifetimePrice: "" as unknown as number,
  currency: "INR",
  imageUrl: undefined,
  downloadUrl: undefined,
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const RupeeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const DollarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const GPIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ProductManagement() {
  const router = useRouter();

  const [isModalOpen, setModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [formData, setFormData] = useState<ItemFormData>(BLANK_FORM);
  const [isManageCategoryModalOpen, setManageCategoryModalOpen] =
    useState(false);
  const queryClient = useQueryClient();

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery<Item[], Error>({
    queryKey: ["items"],
    queryFn: async (): Promise<Item[]> => {
      const response = await axios.get<{ items: Item[] }>(
        "/api/admin/store/items",
      );
      return response.data.items;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery<Category[], Error>({
    queryKey: ["item-categories"],
    queryFn: async (): Promise<Category[]> => {
      const response = await axios.get<{ categories: Category[] }>(
        "/api/admin/store/items/categories",
      );
      return response.data.categories;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (error) toast.error(`Failed to load items: ${error.message}`);
    if (categoriesError)
      toast.error(`Failed to load categories: ${categoriesError.message}`);
  }, [error, categoriesError]);

  // ─── Filtered items ───────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let filtered = [...items];
    if (searchQuery.trim())
      filtered = filtered.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    if (selectedCategoryFilter)
      filtered = filtered.filter(
        (i) => i.categoryId === selectedCategoryFilter,
      );
    if (approvalFilter === "approved")
      filtered = filtered.filter((i) => i.isApproved === true);
    else if (approvalFilter === "pending")
      filtered = filtered.filter((i) => i.isApproved === false);
    if (creatorFilter === "admin")
      filtered = filtered.filter((i) => i.createdByRole === "ADMIN");
    else if (creatorFilter === "coach")
      filtered = filtered.filter((i) => i.createdByRole === "USER");
    return filtered;
  }, [
    items,
    searchQuery,
    selectedCategoryFilter,
    approvalFilter,
    creatorFilter,
  ]);

  // ─── Helper: build FormData payload ──────────────────────────────────────────
  const buildFd = (data: ItemFormData) => {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("category", data.category);
    fd.append("basePrice", (Number(data.basePrice) || 0).toString());
    fd.append("monthlyPrice", (Number(data.monthlyPrice) || 0).toString());
    fd.append("yearlyPrice", (Number(data.yearlyPrice) || 0).toString());
    fd.append("lifetimePrice", (Number(data.lifetimePrice) || 0).toString());
    fd.append("currency", data.currency ?? "INR");
    if (data.imageFile) {
      fd.append("image", data.imageFile);
    } else if (data.imageUrl) {
      fd.append("imageUrl", data.imageUrl);
    }

if (data.downloadFile) {
  fd.append("download", data.downloadFile);
}
    return fd;
  };

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (newItem: ItemFormData) =>
      
      axios.post("/api/admin/store/items", buildFd(newItem), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setModalOpen(false);
      resetForm();
      toast.success("Item created successfully!");
    },
    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to create item.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemFormData }) =>
      axios.put(`/api/admin/store/items/${id}`, buildFd(data), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setModalOpen(false);
      setEditingItem(null);
      resetForm();
      toast.success("Item updated successfully!");
    },
    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to update item.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/admin/store/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item deleted successfully!");
    },
    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to delete item.")),
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete(`/api/admin/store/items/categories/${id}`),

    onSuccess: (res, deletedId) => {
      const type = res.data.type; // HARD_DELETE | SOFT_DELETE

      queryClient.setQueryData<Category[]>(["item-categories"], (old) => {
        if (!old) return old;

        // 🔥 HARD DELETE → remove from cache
        if (type === "HARD_DELETE") {
          return old.filter((cat) => cat.id !== deletedId);
        }

        // 🔥 SOFT DELETE → mark as deleted
        if (type === "SOFT_DELETE") {
          return old.map((cat) =>
            cat.id === deletedId
              ? { ...cat, isDeleted: true } // 👈 IMPORTANT
              : cat,
          );
        }

        return old;
      });

      if (type === "HARD_DELETE") {
        toast.success("Category deleted permanently");
      } else {
        toast.success("Category archived");
      }
    },

    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to delete category")),
  });

  const restoreCategoryMutation = useMutation({
    mutationFn: (id: string) =>
      axios.patch(`/api/admin/store/items/categories/${id}`),

    onSuccess: (res) => {
      const restored = res.data.category;

      queryClient.setQueryData<Category[]>(["item-categories"], (old) => {
        if (!old) return old;

        return old.map((cat) =>
          cat.id === restored.id ? { ...cat, isDeleted: false } : cat,
        );
      });

      toast.success("Category restored");
    },

    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to restore category")),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      axios.patch(`/api/admin/store/items/${id}/approve`, { isApproved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item approved successfully!");
    },
    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to approve item.")),
  });

  const disapproveMutation = useMutation({
    mutationFn: (id: string) =>
      axios.patch(`/api/admin/store/items/${id}/approve`, {
        isApproved: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item disapproved successfully!");
    },
    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to disapprove item.")),
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      const res = await axios.post("/api/admin/store/items/categories", {
        name: category,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["item-categories"] });
      setCategoryModalOpen(false);
      setNewCategory("");
      setFormData((prev) => ({ ...prev, category: data.category.id }));
      toast.success("Category created successfully!");
    },
    onError: (err) =>
      toast.error(getAxiosErrorMessage(err, "Failed to create category.")),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const resetForm = () => setFormData(BLANK_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!editingItem && !formData.imageFile && !formData.imageUrl) {
      toast.error("Please upload an image");
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) createCategoryMutation.mutate(newCategory.trim());
    else toast.error("Category name cannot be empty");
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.categoryId,
      basePrice: item.basePrice,
      monthlyPrice: item.monthlyPrice,
      yearlyPrice: item.yearlyPrice,
      lifetimePrice: item.lifetimePrice,
      currency: item.currency ?? "INR",

      imageUrl: item.imageUrl,
      downloadUrl: item.downloadUrl,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?"))
      deleteMutation.mutate(id);
  };

  // ─── Derived ──────────────────────────────────────────────────────────────────
  const typedCategories = categories as Category[];
  const activeCategories = typedCategories.filter((c) => !c.isDeleted);

  const typedFilteredItems = filteredItems as Item[];
  const currencySymbol = getCurrencySymbol(formData.currency ?? "INR");

  // ─── Price stepper helper ─────────────────────────────────────────────────────
  const stepPrice = (key: keyof ItemFormData, delta: number) => {
    setFormData((prev) => {
      const currentValue = Number(prev[key]) || 0;
      const newValue = Math.max(0, currentValue + delta);
      return {
        ...prev,
        [key]: Math.round(newValue * 100) / 100,
      };
    });
  };

  const handlePriceChange = (key: keyof ItemFormData, raw: string) => {
    if (raw === "") {
      setFormData((prev) => ({ ...prev, [key]: "" as unknown as number }));
      return;
    }

    const value = parseFloat(raw);
    if (!isNaN(value) && value >= 0) {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };
  const handleClone = (item: Item) => {
    setEditingItem(null); // IMPORTANT → forces CREATE mode

    setFormData({
      name: item.name,
      category: item.categoryId,
      basePrice: item.basePrice,
      monthlyPrice: item.monthlyPrice,
      yearlyPrice: item.yearlyPrice,
      lifetimePrice: item.lifetimePrice,
      currency: item.currency ?? "INR",
      imageUrl: item.imageUrl,
      downloadUrl: item.downloadUrl,
    });

    setModalOpen(true);
  };
  // ─── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Product Management</h2>

      {/* Top action buttons */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <button
          className="px-6 py-2.5 bg-[#3b82f5] text-white rounded-lg hover:bg-[#2563eb] transition-all duration-300 font-semibold"
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setModalOpen(true);
          }}
        >
          Add New Product
        </button>
        <button
          className="px-6 py-2.5 bg-[#ff7070] text-white rounded-lg hover:bg-[#ff5555] transition-all duration-300 font-semibold"
          onClick={() => setCategoryModalOpen(true)}
        >
          Add New Category
        </button>
        <button
          className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
          onClick={() => setManageCategoryModalOpen(true)}
        >
          Manage Categories
        </button>
      </div>

      {/* ═══════════════════ Create / Edit Modal ═══════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">
                {editingItem
                  ? "Edit Item"
                  : formData.name?.includes("(Copy)")
                    ? "Clone Item"
                    : "Create New Item"}
              </h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {typedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ── Currency Dropdown ── */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Currency *
                </label>
                <select
                  value={formData.currency ?? "INR"}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Price Fields ── */}
              <div className="grid grid-cols-2 gap-4">
                {PRICE_FIELDS.map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">
                      {label}
                      {required && " *"}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                      {/* Currency symbol prefix */}
                      <span className="px-2.5 py-2 bg-gray-50 text-gray-500 font-medium text-sm border-r border-gray-300 select-none">
                        {currencySymbol}
                      </span>

                      {/* Input — left aligned, no spinner */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={
                          formData[key] === "" || formData[key] === undefined
                            ? ""
                            : (formData[key] as number)
                        }
                        onChange={(e) => handlePriceChange(key, e.target.value)}
                        className="flex-1 px-2 py-2 text-left outline-none border-none
                          [appearance:textfield]
                          [&::-webkit-outer-spin-button]:appearance-none
                          [&::-webkit-inner-spin-button]:appearance-none"
                        required={required}
                      />

                      {/* Up / Down arrow stepper */}
                      <div className="flex flex-col border-l border-gray-300">
                        <button
                          type="button"
                          onClick={() => stepPrice(key, 0.01)}
                          className="px-2 py-[3px] bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors select-none border-b border-gray-300 leading-none"
                          title="Increase"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => stepPrice(key, -0.01)}
                          className="px-2 py-[3px] bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors select-none leading-none"
                          title="Decrease"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Image {!editingItem && "*"}
                </label>
                {formData.imageUrl && !formData.imageFile && (
                  <div className="mb-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded border"
                    />
                    <p className="text-xs text-gray-500">
                      Existing image will be reused if not changed
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imageFile: e.target.files?.[0] || undefined,
                        imageUrl: undefined, 
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editingItem && !formData.imageUrl}
                />
                {editingItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep current image
                  </p>
                )}
              </div>

              {/* Download File */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Download File{" "}
                  {formData?.downloadUrl && !formData.downloadFile && (
                    <p className="text-xs text-gray-500 mb-2">
                      Existing file will be reused
                    </p>
                  )}
                  <span className="text-gray-400 font-normal">
                    (Optional — PDF only)
                  </span>
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type !== "application/pdf") {
                      toast.error("Only PDF files are allowed for download");
                      e.target.value = "";
                      return;
                    }
                    setFormData({
                      ...formData,
                      downloadFile: file || undefined,
                      downloadUrl: undefined, 
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {editingItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep current file
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingItem
                  ? updateMutation.isPending
                    ? "Updating…"
                    : "Update Item"
                  : createMutation.isPending
                    ? "Creating…"
                    : "Create Item"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════ Category Modal ═══════════════════ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Category</h3>
              <button
                onClick={() => {
                  setCategoryModalOpen(false);
                  setNewCategory("");
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending
                  ? "Creating…"
                  : "Create Category"}
              </button>
            </form>
          </div>
        </div>
      )}
      {isManageCategoryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Categories</h3>
              <button
                onClick={() => setManageCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {typedCategories.map((cat) => {
                const usageCount = items.filter(
                  (item) => item.categoryId === cat.id,
                ).length;

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2 border rounded-lg"
                  >
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          cat.isDeleted ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {cat.name}
                      </p>

                      <div className="flex gap-2 items-center text-xs text-gray-500">
                        <span>{usageCount} products</span>

                        {cat.isDeleted && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                            Archived
                          </span>
                        )}
                      </div>
                    </div>

                    {cat.isDeleted ? (
                      <button
                        onClick={() => restoreCategoryMutation.mutate(cat.id)}
                        className="p-1.5 text-xs flex gap-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        Restore <CheckCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>

                            <AlertDialogDescription>
                              {usageCount > 0 ? (
                                <>
                                  This category has <b>{usageCount}</b>{" "}
                                  products. It will be archived instead of
                                  deleted.
                                </>
                              ) : (
                                <>
                                  Are you sure you want to permanently delete{" "}
                                  <b>{cat.name}</b>?
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>

                            <AlertDialogAction
                              onClick={() =>
                                deleteCategoryMutation.mutate(cat.id)
                              }
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════════ Filters ═══════════════════ */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          disabled={isCategoriesLoading}
        >
          <option value="">All Categories</option>
          {activeCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
        >
          <option value="all">All Creators</option>
          <option value="admin">Admin Products</option>
          <option value="coach">Coach Products</option>
        </select>
      </div>

      {/* ═══════════════════ Table ═══════════════════ */}
      {isLoading ? (
        <PageSkeleton type="manage-store-product" />
      ) : error ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          Error: {error.message}
        </div>
      ) : typedFilteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          {searchQuery ||
          selectedCategoryFilter ||
          approvalFilter !== "all" ||
          creatorFilter !== "all"
            ? "No products match your filters."
            : "No products found. Create your first product!"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Currency
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Base
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Monthly
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Yearly
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Lifetime
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Creator
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Approved By
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {typedFilteredItems.map((item) => {
                const category = typedCategories.find(
                  (cat) => cat.id === item.categoryId,
                );
                const sym = getCurrencySymbol(item.currency ?? "INR");
                const isINR = (item.currency ?? "INR") === "INR";
                const isUSD = (item.currency ?? "INR") === "USD";
                const isGP = (item.currency ?? "INR") === "GP";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {item.isApproved ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.name}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center max-w-[140px] px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        {category?.name || "Unknown"}
                      </span>
                      {category?.isDeleted && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded whitespace-nowrap">
                          Archived
                        </span>
                      )}
                    </td>

                    {/* Currency badge */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${
                          isINR
                            ? "bg-orange-100 text-orange-700"
                            : isUSD
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {isINR ? (
                          <RupeeIcon className="w-3 h-3" />
                        ) : isUSD ? (
                          <DollarIcon className="w-3 h-3" />
                        ) : (
                          <GPIcon className="w-3 h-3" />
                        )}
                        {item.currency ?? "INR"}
                      </span>
                    </td>

                    {/* Prices */}
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {sym}
                      {isGP
                        ? Number(item.basePrice).toFixed(0)
                        : Number(item.basePrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {sym}
                      {isGP
                        ? Number(item.monthlyPrice).toFixed(0)
                        : Number(item.monthlyPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {sym}
                      {isGP
                        ? Number(item.yearlyPrice).toFixed(0)
                        : Number(item.yearlyPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {sym}
                      {isGP
                        ? Number(item.lifetimePrice).toFixed(0)
                        : Number(item.lifetimePrice).toFixed(2)}
                    </td>

                    {/* Creator */}
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-center">
                      {item.createdByRole === "ADMIN" ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-sm font-medium text-purple-700">
                            {item.creator?.name ||
                              item.creator?.email ||
                              "Unknown Admin"}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="text-sm font-medium text-indigo-700">
                            {item.creator?.name ||
                              item.creator?.email ||
                              "Unknown Coach"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Approved By */}
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">
                      {item.approver ? (
                        <span>{item.approver.name || item.approver.email}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/manage-store-product/${item.id}`,
                            )
                          }
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => approveMutation.mutate(item.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-40"
                          disabled={
                            approveMutation.isPending || item.isApproved
                          }
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => disapproveMutation.mutate(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                          disabled={
                            disapproveMutation.isPending || !item.isApproved
                          }
                          title="Disapprove"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        {item.createdByRole !== "ADMIN" && (
                        <button
                          onClick={() => handleClone(item)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Clone"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                          disabled={deleteMutation.isPending}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
