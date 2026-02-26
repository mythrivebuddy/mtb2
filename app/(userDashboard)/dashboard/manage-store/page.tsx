"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Pencil, Trash2, PlusCircle, LayoutGrid, List } from "lucide-react";
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
  { value: "INR", label: "INR", symbol: "₹" },
  { value: "USD", label: "USD", symbol: "$" },
];

const getCurrencySymbol = (currency?: string) =>
  CURRENCIES.find((c) => c.value === (currency ?? "INR"))?.symbol ?? "₹";

// ─── Price field config ────────────────────────────────────────────────────────
const PRICE_FIELDS: { key: keyof ItemFormData; label: string; required: boolean }[] = [
  { key: "basePrice",     label: "Base Price",    required: true  },
  { key: "monthlyPrice",  label: "Monthly Price", required: false },
  { key: "yearlyPrice",   label: "Yearly Price",  required: false },
  { key: "lifetimePrice", label: "Lifetime Price",required: false },
];

// ─── Blank form ────────────────────────────────────────────────────────────────
const BLANK_FORM: ItemFormData = {
  name:          "",
  category:      "",
  basePrice:     "" as unknown as number,
  monthlyPrice:  "" as unknown as number,
  yearlyPrice:   "" as unknown as number,
  lifetimePrice: "" as unknown as number,
  currency:      "INR",
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
  const [newCategoryName,     setNewCategoryName     ] = useState("");
  const [isModalOpen,         setIsModalOpen         ] = useState(false);
  const [editingItem,         setEditingItem         ] = useState<Item | null>(null);
  const [viewMode,            setViewMode            ] = useState<"card" | "table">("card");
  const [filterStatus,        setFilterStatus        ] = useState<"all" | "approved" | "not-approved">("all");
  const [formData,            setFormData            ] = useState<ItemFormData>(BLANK_FORM);

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["my-items"],
    queryFn: fetchMyItems,
  });

  // ─── Helper: build FormData payload ──────────────────────────────────────────
  const buildFd = (data: ItemFormData) => {
    const fd = new FormData();
    fd.append("name",          data.name);
    fd.append("category",      data.category);
    fd.append("basePrice",     Math.floor(Number(data.basePrice)     || 0).toString());
    fd.append("monthlyPrice",  Math.floor(Number(data.monthlyPrice)  || 0).toString());
    fd.append("yearlyPrice",   Math.floor(Number(data.yearlyPrice)   || 0).toString());
    fd.append("lifetimePrice", Math.floor(Number(data.lifetimePrice) || 0).toString());
    fd.append("currency",      data.currency ?? "INR");
    if (data.imageFile)    fd.append("image",    data.imageFile);
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
      toast.success("Product created successfully! .");
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
    if (filterStatus === "approved")     return item.isApproved === true;
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
        name:          item.name,
        category:      item.categoryId,
        basePrice:     item.basePrice,
        monthlyPrice:  item.monthlyPrice,
        yearlyPrice:   item.yearlyPrice,
        lifetimePrice: item.lifetimePrice,
        currency:      (item as Item & { currency?: string }).currency ?? "INR",
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); resetForm(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category)                  { toast.error("Please select a category"); return; }
    if (!formData.imageFile && !editingItem) { toast.error("Please upload an image");   return; }
    if (editingItem) updateProductMutation.mutate({ id: editingItem.id, data: formData });
    else             createProductMutation.mutate(formData);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this product?"))
      deleteProductMutation.mutate(itemId);
  };

  // ─── Price stepper ────────────────────────────────────────────────────────────
  const stepPrice = (key: keyof ItemFormData, delta: 1 | -1) =>
    setFormData((prev) => ({
      ...prev,
      [key]: Math.max(0, (Number(prev[key]) || 0) + delta),
    }));

  const handlePriceChange = (key: keyof ItemFormData, raw: string) =>
    setFormData((prev) => ({
      ...prev,
      [key]: raw === "" ? ("" as unknown as number) : Math.max(0, Math.floor(Number(raw))),
    }));

  const currencySymbol = getCurrencySymbol(formData.currency);

  // ─── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-slate-800">🏪 Manage Store</h1>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 text-white font-bold text-sm rounded-full px-4 py-3 hover:bg-green-700 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Product
            </button>
            <Link
              href="/dashboard/store"
              className="bg-jp-orange text-white font-bold text-sm rounded-full px-4 py-3 hover:bg-red-600"
            >
              Back to Store
            </Link>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {(["all", "approved", "not-approved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  filterStatus === f
                    ? f === "all"
                      ? "bg-jp-orange text-white"
                      : f === "approved"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {f === "all" ? "All Products" : f === "approved" ? "Approved" : "Not Approved"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition-all ${viewMode === "card" ? "bg-jp-orange text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              title="Card View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-jp-orange text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              title="Table View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════════════════ Product Modal ═══════════════════ */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">
                  {editingItem ? "Edit Product" : "Create New Product"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                        title="Add new category"
                      >
                        <PlusCircle className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* ── Currency Selector ── */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Currency *</label>
                    <div className="flex gap-2">
                      {/* INR */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, currency: "INR" })}
                        className={`flex-1 px-4 py-2.5 rounded-lg border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
                          formData.currency === "INR"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <RupeeIcon className="w-4 h-4" />
                        INR
                      </button>
                      {/* USD */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, currency: "USD" })}
                        className={`flex-1 px-4 py-2.5 rounded-lg border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
                          formData.currency === "USD"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <DollarIcon className="w-4 h-4" />
                        USD
                      </button>
                    </div>
                  </div>

                  {/* ── Price Fields ── */}
                  <div className="grid grid-cols-2 gap-4">
                    {PRICE_FIELDS.map(({ key, label, required }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1">
                          {label}{required && " *"}
                        </label>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                          {/* Currency symbol prefix */}
                          <span className="px-2.5 py-2 bg-gray-50 text-gray-500 font-medium text-sm border-r border-gray-300 select-none">
                            {currencySymbol}
                          </span>
                          {/* Input — left aligned, no native spinner */}
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
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
                          {/* ▲▼ Stepper */}
                          <div className="flex flex-col border-l border-gray-300">
                            <button
                              type="button"
                              onClick={() => stepPrice(key, 1)}
                              className="px-2 py-[3px] bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors select-none border-b border-gray-300 leading-none"
                              title="Increase"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => stepPrice(key, -1)}
                              className="px-2 py-[3px] bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors select-none leading-none"
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
                    <label className="block text-sm font-medium mb-1">
                      Image {!editingItem && "*"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData({ ...formData, imageFile: e.target.files?.[0] || undefined })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!editingItem}
                    />
                    {editingItem && (
                      <p className="text-xs text-gray-400 mt-1">Leave empty to keep current image</p>
                    )}
                  </div>

                  {/* Download File */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {editingItem
                      ? updateProductMutation.isPending ? "Updating…"  : "Update Product"
                      : createProductMutation.isPending  ? "Creating…" : "Create Product"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ Category Modal ═══════════════════ */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Category</h3>
                <button
                  onClick={() => { setIsCategoryModalOpen(false); setNewCategoryName(""); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
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
                  <label className="block text-sm font-medium mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? "Creating…" : "Create Category"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════ Products Display ═══════════════════ */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Your Products</h2>

          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {filterStatus === "all"
                  ? "No products yet. Add your first product!"
                  : `No ${filterStatus === "approved" ? "approved" : "pending approval"} products.`}
              </p>
            </div>

          ) : viewMode === "card" ? (

            /* ── Card View ── */
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
                const itemCurrency = (item as Item & { currency?: string }).currency ?? "INR";
                const sym          = getCurrencySymbol(itemCurrency);
                const isINR        = itemCurrency === "INR";
                return (
                  <div
                    key={item.id}
                    className="bg-white shadow-lg rounded-xl p-4 hover:shadow-2xl transition-shadow relative border"
                  >
                    {/* Approval badge — top right */}
                    <div className="absolute top-2 right-2 z-10">
                      {item.isApproved ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Approved
                        </span>
                      ) : (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Currency badge — top left */}
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${
                          isINR ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isINR ? <RupeeIcon className="w-3 h-3" /> : <DollarIcon className="w-3 h-3" />}
                        {itemCurrency}
                      </span>
                    </div>

                    <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
                      <Image
                        src={item.imageUrl?.trim() ? item.imageUrl : "/placeholder-image.jpg"}
                        alt={item.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.name}</h3>
                    <p className="text-sm text-blue-500 font-medium mb-2">{item.category.name}</p>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      {[
                        { label: "Base",     val: item.basePrice     },
                        { label: "Monthly",  val: item.monthlyPrice  },
                        { label: "Yearly",   val: item.yearlyPrice   },
                        { label: "Lifetime", val: item.lifetimePrice },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <span className="text-gray-600">{label}:</span>
                          <span className="text-green-600 font-semibold ml-1">
                            {sym}{Number(val).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          ) : (

            /* ── Table View ── */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {["Status", "Image", "Name", "Category", "Currency", "Base", "Monthly", "Yearly", "Lifetime", "Actions"].map((h) => (
                      <th
                        key={h}
                        className={`py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap ${h === "Actions" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const itemCurrency = (item as Item & { currency?: string }).currency ?? "INR";
                    const sym          = getCurrencySymbol(itemCurrency);
                    const isINR        = itemCurrency === "INR";
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {item.isApproved ? (
                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Approved</span>
                          ) : (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                            <Image
                              src={item.imageUrl?.trim() ? item.imageUrl : "/placeholder-image.jpg"}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                            {item.category.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${
                              isINR ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isINR ? <RupeeIcon className="w-3 h-3" /> : <DollarIcon className="w-3 h-3" />}
                            {itemCurrency}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-green-600 font-semibold">
                          {sym}{Number(item.basePrice).toFixed(0)}
                        </td>
                        <td className="py-3 px-4">{sym}{Number(item.monthlyPrice).toFixed(0)}</td>
                        <td className="py-3 px-4">{sym}{Number(item.yearlyPrice).toFixed(0)}</td>
                        <td className="py-3 px-4">{sym}{Number(item.lifetimePrice).toFixed(0)}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
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
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Total Products</h3>
            <p className="text-3xl font-bold text-jp-orange">{items.length}</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Approved</h3>
            <p className="text-3xl font-bold text-green-600">
              {items.filter((i) => i.isApproved).length}
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-red-600">
              {items.filter((i) => !i.isApproved).length}
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Avg Base Price</h3>
            <p className="text-3xl font-bold text-blue-600">
              {items.length > 0
                ? `${getCurrencySymbol()}${(items.reduce((s, i) => s + i.basePrice, 0) / items.length).toFixed(0)}`
                : "—"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageStorePage;