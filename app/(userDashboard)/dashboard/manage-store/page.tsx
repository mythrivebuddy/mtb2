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

const fetchCategories = async (): Promise<Category[]> => {
  const res = await axios.get("/api/user/store/items/get-categories");
  return res.data.categories;
};

const fetchMyItems = async (): Promise<Item[]> => {
  const res = await axios.get("/api/user/store/items/my-items");
  return res.data.items || [];
};

const ManageStorePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ ALL hooks declared first — before any early returns
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "not-approved">("all");
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    category: "",
    basePrice: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    lifetimePrice: 0,
  });

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["my-items"],
    queryFn: fetchMyItems,
  });

  const createProductMutation = useMutation({
    mutationFn: async (newItem: ItemFormData) => {
      const formDataToSend = new FormData();
      formDataToSend.append("name", newItem.name);
      formDataToSend.append("category", newItem.category);
      formDataToSend.append("basePrice", newItem.basePrice.toString());
      formDataToSend.append("monthlyPrice", newItem.monthlyPrice.toString());
      formDataToSend.append("yearlyPrice", newItem.yearlyPrice.toString());
      formDataToSend.append("lifetimePrice", newItem.lifetimePrice.toString());
      if (newItem.imageFile) formDataToSend.append("image", newItem.imageFile);
      if (newItem.downloadFile) formDataToSend.append("download", newItem.downloadFile);
      return axios.post("/api/user/store/items/add-items", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setIsModalOpen(false);
      resetForm();
      toast.success("Product created successfully! It will be visible after admin approval.");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to create product."));
    },
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
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to create category"));
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ItemFormData }) => {
      const formDataToSend = new FormData();
      formDataToSend.append("name", data.name);
      formDataToSend.append("category", data.category);
      formDataToSend.append("basePrice", data.basePrice.toString());
      formDataToSend.append("monthlyPrice", data.monthlyPrice.toString());
      formDataToSend.append("yearlyPrice", data.yearlyPrice.toString());
      formDataToSend.append("lifetimePrice", data.lifetimePrice.toString());
      if (data.imageFile) formDataToSend.append("image", data.imageFile);
      if (data.downloadFile) formDataToSend.append("download", data.downloadFile);
      return axios.put(`/api/user/store/items/${id}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      toast.success("Product updated successfully!");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to update product."));
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return axios.delete(`/api/user/store/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Product deleted successfully!");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to delete product."));
    },
  });

  // ✅ Auth redirect effect — after all hooks
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.userType !== "COACH") {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  // ✅ Early returns — after ALL hooks
  if (status === "loading" || !session || session.user.userType !== "COACH") {
    return <PageLoader />;
  }

  if (categoriesLoading || itemsLoading) {
    return <PageLoader />;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const filteredItems = items.filter((item) => {
    if (filterStatus === "approved") return item.isApproved === true;
    if (filterStatus === "not-approved") return item.isApproved === false;
    return true;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      basePrice: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      lifetimePrice: 0,
    });
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
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.imageFile && !editingItem) {
      toast.error("Please upload an image");
      return;
    }
    if (editingItem) {
      updateProductMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(itemId);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filterStatus === "all" ? "bg-jp-orange text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filterStatus === "approved" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus("not-approved")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filterStatus === "not-approved" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Not Approved
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "card" ? "bg-jp-orange text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table" ? "bg-jp-orange text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="Table View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">
                  {editingItem ? "Edit Product" : "Create New Product"}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                  ×
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Base Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Monthly Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthlyPrice}
                        onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Yearly Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.yearlyPrice}
                        onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lifetime Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.lifetimePrice}
                        onChange={(e) => setFormData({ ...formData, lifetimePrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Image {!editingItem && "*"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!editingItem}
                    />
                    {editingItem && (
                      <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Download File (Optional)</label>
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
                    <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {editingItem
                      ? updateProductMutation.isPending ? "Updating..." : "Update Product"
                      : createProductMutation.isPending ? "Creating..." : "Create Product"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Category</h3>
                <button
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setNewCategoryName("");
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCategoryName.trim()) {
                    toast.error("Category name cannot be empty");
                    return;
                  }
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
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Products Display */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Your Products</h2>

          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {filterStatus === "all"
                  ? "No products yet. Add your first product!"
                  : `No ${filterStatus === "approved" ? "approved" : "pending approval"} products.`}
              </p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white shadow-lg rounded-xl p-4 hover:shadow-2xl transition-shadow relative border">
                  <div className="absolute top-2 right-2 z-10">
                    {item.isApproved ? (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">Approved</span>
                    ) : (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">Pending</span>
                    )}
                  </div>

                  <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <Image
                      src={item.imageUrl && item.imageUrl.trim() !== "" ? item.imageUrl : "/placeholder-image.jpg"}
                      alt={item.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.name}</h3>
                  <p className="text-sm text-blue-500 font-medium mb-2">{item.category.name}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Base:</span>
                      <span className="text-green-600 font-semibold ml-1">${item.basePrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly:</span>
                      <span className="text-green-600 font-semibold ml-1">${item.monthlyPrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Yearly:</span>
                      <span className="text-green-600 font-semibold ml-1">${item.yearlyPrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lifetime:</span>
                      <span className="text-green-600 font-semibold ml-1">${item.lifetimePrice}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Image</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Base Price</th>
                    <th className="text-left py-3 px-4">Monthly</th>
                    <th className="text-left py-3 px-4">Yearly</th>
                    <th className="text-left py-3 px-4">Lifetime</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {item.isApproved ? (
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Approved</span>
                        ) : (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Image
                            src={item.imageUrl && item.imageUrl.trim() !== "" ? item.imageUrl : "/placeholder-image.jpg"}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">{item.category.name}</span>
                      </td>
                      <td className="py-3 px-4 text-green-600 font-semibold">${item.basePrice}</td>
                      <td className="py-3 px-4">${item.monthlyPrice}</td>
                      <td className="py-3 px-4">${item.yearlyPrice}</td>
                      <td className="py-3 px-4">${item.lifetimePrice}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Total Products</h3>
            <p className="text-3xl font-bold text-jp-orange">{items.length}</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Approved</h3>
            <p className="text-3xl font-bold text-green-600">{items.filter((item) => item.isApproved).length}</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-red-600">{items.filter((item) => !item.isApproved).length}</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Avg Base Price</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${items.length > 0
                ? (items.reduce((sum, item) => sum + item.basePrice, 0) / items.length).toFixed(2)
                : "0.00"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageStorePage;