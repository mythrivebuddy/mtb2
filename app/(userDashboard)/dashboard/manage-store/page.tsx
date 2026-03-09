"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Pencil, Trash2, PlusCircle, LayoutGrid, List, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import PageLoader from "@/components/PageLoader";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Category, ItemFormData } from "@/types/client/manage-store-product";
import { Item } from "@/types/client/store";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Currency Config ───────────────────────────────────────────────────────────
const CURRENCIES = [
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "USD", label: "USD ($)", symbol: "$" },
];

const getCurrencySymbol = (currency?: string) =>
  CURRENCIES.find((c) => c.value === (currency ?? "INR"))?.symbol ?? "₹";

// ─── Price field config ────────────────────────────────────────────────────────
const PRICE_FIELDS: { key: keyof ItemFormData; label: string; required: boolean }[] = [
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
};

// ─── API fetchers ──────────────────────────────────────────────────────────────
const fetchCategories = async (): Promise<Category[]> => {
  const res = await axios.get("/api/user/store/items/get-categories");
  return res.data.categories;
};

const fetchMyItems = async (): Promise<Item[]> => {
  const res = await axios.get("/api/user/store/items/my-items");
  return res.data.items || [];
};

// ─── Component ─────────────────────────────────────────────────────────────────
const ManageStorePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "not-approved">("all");
  const [formData, setFormData] = useState<ItemFormData>(BLANK_FORM);

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["my-items"],
    queryFn: fetchMyItems,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

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
    if (data.imageFile) fd.append("image", data.imageFile);
    if (data.downloadFile) fd.append("download", data.downloadFile);
    return fd;
  };

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const createProductMutation = useMutation({
    mutationFn: (newItem: ItemFormData) =>
      axios.post("/api/user/store/items/add-items", buildFd(newItem), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setIsModalOpen(false);
      resetForm();
      toast.success("Product created successfully!");
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err, "Failed to create product.")),
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await axios.post("/api/user/store/items/create-category", { name });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormData((prev) => ({ ...prev, category: data.category.id }));
      setIsCategoryModalOpen(false);
      setNewCategoryName("");
      toast.success("Category created successfully!");
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err, "Failed to create category")),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemFormData }) =>
      axios.put(`/api/user/store/items/${id}`, buildFd(data), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      toast.success("Product updated successfully!");
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err, "Failed to update product.")),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (itemId: string) => axios.delete(`/api/user/store/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Product deleted successfully!");
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err, "Failed to delete product.")),
  });

  // ─── Auth redirect (after all hooks) ─────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.userType !== "COACH") {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.userType !== "COACH") {
    return <PageLoader />;
  }
  if (categoriesLoading || itemsLoading) return <PageLoader />;

  // ─── Derived ──────────────────────────────────────────────────────────────────
  const filteredItems = items.filter((item) => {
    if (filterStatus === "approved") return item.isApproved === true;
    if (filterStatus === "not-approved") return item.isApproved === false;
    return true;
  });

  const resetForm = () => {
    setFormData(BLANK_FORM);
    setEditingItem(null);
  };

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.categoryId,
        basePrice: item.basePrice,
        monthlyPrice: item.monthlyPrice,
        yearlyPrice: item.yearlyPrice,
        lifetimePrice: item.lifetimePrice,
        currency: (item as Item & { currency?: string }).currency ?? "INR",
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); resetForm(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) { toast.error("Please select a category"); return; }
    if (!formData.imageFile && !editingItem) { toast.error("Please upload an image"); return; }
    if (editingItem) updateProductMutation.mutate({ id: editingItem.id, data: formData });
    else createProductMutation.mutate(formData);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this product?"))
      deleteProductMutation.mutate(itemId);
  };

  // ─── Price stepper ────────────────────────────────────────────────────────────
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

  const currencySymbol = getCurrencySymbol(formData.currency);

  // ─── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🏪 Manage Store</h1>
              <p className="text-gray-600 mt-1">Create and manage your products</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm rounded-lg px-6 py-3 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add Product
              </button>
              <Link
                href="/dashboard/store"
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm rounded-lg px-6 py-3 hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Store
              </Link>
            </div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-3 flex-wrap">
              {(["all", "approved", "not-approved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${filterStatus === f
                      ? f === "all"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : f === "approved"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                          : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {f === "all" ? "All Products" : f === "approved" ? "Approved" : "Not Approved"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("card")}
                className={`p-3 rounded-lg transition-all duration-200 ${viewMode === "card"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                title="Card View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-3 rounded-lg transition-all duration-200 ${viewMode === "table"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                title="Table View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════ Product Modal ═══════════════════ */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingItem ? "Edit Product" : "Create New Product"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
                        title="Add new category"
                      >
                        <PlusCircle className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Currency Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Currency *</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white"
                      required
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr.value} value={curr.value}>
                          {curr.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {PRICE_FIELDS.map(({ key, label, required }) => (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {label}{required && " *"}
                        </label>
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all duration-200">
                          <span className="px-3 py-3 bg-gray-50 text-gray-600 font-semibold text-sm border-r-2 border-gray-200 select-none">
                            {currencySymbol}
                          </span>
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
                            className="flex-1 px-3 py-3 text-left outline-none border-none
                              [appearance:textfield]
                              [&::-webkit-outer-spin-button]:appearance-none
                              [&::-webkit-inner-spin-button]:appearance-none"
                            required={required}
                          />
                          <div className="flex flex-col border-l-2 border-gray-200">
                            <button
                              type="button"
                              onClick={() => stepPrice(key, 0.01)}
                              className="px-2 py-[4px] bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors select-none border-b border-gray-200 leading-none"
                              title="Increase"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => stepPrice(key, -0.01)}
                              className="px-2 py-[4px] bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors select-none leading-none"
                              title="Decrease"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Image {!editingItem && "*"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData({ ...formData, imageFile: e.target.files?.[0] || undefined })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      required={!editingItem}
                    />
                    {editingItem && (
                      <p className="text-xs text-gray-500 mt-2">Leave empty to keep current image</p>
                    )}
                  </div>

                  {/* Download File */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Download File{" "}
                      <span className="text-gray-400 font-normal">(Optional — PDF only)</span>
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
                        setFormData({ ...formData, downloadFile: file || undefined });
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
                    />
                    {editingItem && (
                      <p className="text-xs text-gray-500 mt-2">Leave empty to keep current file</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {editingItem
                      ? updateProductMutation.isPending ? "Updating…" : "Update Product"
                      : createProductMutation.isPending ? "Creating…" : "Create Product"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ Category Modal ═══════════════════ */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create New Category</h3>
                <button
                  onClick={() => { setIsCategoryModalOpen(false); setNewCategoryName(""); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none transition-colors"
                >
                  ×
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCategoryName.trim()) { toast.error("Category name cannot be empty"); return; }
                  createCategoryMutation.mutate(newCategoryName.trim());
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all duration-200"
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? "Creating…" : "Create Category"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════ Products Display ═══════════════════ */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Products</h2>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {filterStatus === "all"
                    ? "No products yet"
                    : `No ${filterStatus === "approved" ? "approved" : "pending approval"} products`}
                </h3>
                <p className="text-gray-500">
                  {filterStatus === "all" && "Add your first product to get started!"}
                </p>
              </div>
            </div>

          ) : viewMode === "card" ? (

            /* ── Card View ── */
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => {
                const itemCurrency = (item as Item & { currency?: string }).currency ?? "INR";
                const sym = getCurrencySymbol(itemCurrency);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col"
                  >
                    {/* Image Container */}
                    <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      <Image
                        src={item.imageUrl?.trim() ? item.imageUrl : "/placeholder-image.jpg"}
                        alt={item.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Approval badge — top right */}
                      <div className="absolute top-3 right-3 z-10">
                        {item.isApproved ? (
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md">
                            Approved
                          </span>
                        ) : (
                          <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Category badge — top left */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold rounded-full shadow-md">
                          {item.category.name}
                        </span>
                      </div>

                      {/* Currency badge — bottom left */}
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 text-xs font-bold rounded-full shadow-md border border-gray-200">
                          {itemCurrency}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">{item.name}</h3>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        {[
                          { label: "Base", val: item.basePrice },
                          { label: "Monthly", val: item.monthlyPrice },
                          { label: "Yearly", val: item.yearlyPrice },
                          { label: "Lifetime", val: item.lifetimePrice },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-2 border border-gray-100">
                            <span className="text-gray-500 text-xs block mb-0.5">{label}</span>
                            <span className="text-green-600 font-bold text-sm block">
                              {sym}{Number(val).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-semibold text-sm"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2.5 rounded-xl hover:from-red-600 hover:to-rose-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-semibold text-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          ) : (

            /* ── Table View ── */
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    {["Status", "Image", "Name", "Category", "Currency", "Base", "Monthly", "Yearly", "Lifetime", "Actions"].map((h) => (
                      <th
                        key={h}
                        className={`py-4 px-4 text-sm font-bold text-gray-700 whitespace-nowrap ${h === "Actions" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const itemCurrency = (item as Item & { currency?: string }).currency ?? "INR";
                    const sym = getCurrencySymbol(itemCurrency);
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-4">
                          {item.isApproved ? (
                            <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">Approved</span>
                          ) : (
                            <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <Image
                              src={item.imageUrl?.trim() ? item.imageUrl : "/placeholder-image.jpg"}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-800">{item.name}</td>
                        <td className="py-4 px-4">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
                            {item.category.name}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 text-xs font-bold rounded-full">
                            {itemCurrency}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-green-600 font-bold">
                          {sym}{Number(item.basePrice).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-gray-700">{sym}{Number(item.monthlyPrice).toFixed(2)}</td>
                        <td className="py-4 px-4 text-gray-700">{sym}{Number(item.yearlyPrice).toFixed(2)}</td>
                        <td className="py-4 px-4 text-gray-700">{sym}{Number(item.lifetimePrice).toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2.5 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-2.5 rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-sm hover:shadow-md"
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

        {/* ═══════════════════ Stats Cards ═══════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white shadow-md rounded-2xl p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Products</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{items.length}</p>
          </div>
          <div className="bg-white shadow-md rounded-2xl p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Approved</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              {items.filter((i) => i.isApproved).length}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-2xl p-6 border-l-4 border-red-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pending</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
              {items.filter((i) => !i.isApproved).length}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-2xl p-6 border-l-4 border-indigo-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Avg Base Price</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {items.length > 0
                ? `${getCurrencySymbol()}${(items.reduce((s, i) => s + i.basePrice, 0) / items.length).toFixed(2)}`
                : "—"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageStorePage;