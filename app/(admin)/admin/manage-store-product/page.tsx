"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { Item, ItemFormData, Category } from "@/types/client/manage-store-product";
import PageSkeleton from "@/components/PageSkeleton";
import { CheckCircle, XCircle, Pencil, Trash2, Eye } from "lucide-react";

export default function ProductManagement() {
  const router = useRouter();

  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newCategory, setNewCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    category: "",
    basePrice: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    lifetimePrice: 0,
  });
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery<Item[], Error>({
    queryKey: ["items"],
    queryFn: async (): Promise<Item[]> => {
      const response = await axios.get<{ items: Item[] }>("/api/admin/store/items");
      console.log("📦 Fetched items:", response.data.items);
      response.data.items.forEach((item) => {
        console.log(`${item.name}: isApproved = ${item.isApproved}`);
      });
      return response.data.items;
    },
  });

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery<Category[], Error>({
    queryKey: ["item-categories"],
    queryFn: async (): Promise<Category[]> => {
      const response = await axios.get<{ categories: Category[] }>("/api/admin/store/items/categories");
      return response.data.categories;
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load items: ${error.message}`);
    }
    if (categoriesError) {
      toast.error(`Failed to load categories: ${categoriesError.message}`);
    }
  }, [error, categoriesError]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategoryFilter) {
      filtered = filtered.filter((item) => item.categoryId === selectedCategoryFilter);
    }

    if (approvalFilter === "approved") {
      filtered = filtered.filter((item) => item.isApproved === true);
    } else if (approvalFilter === "pending") {
      filtered = filtered.filter((item) => item.isApproved === false);
    }

    return filtered;
  }, [items, searchQuery, selectedCategoryFilter, approvalFilter]);

  const createMutation = useMutation({
    mutationFn: async (newItem: ItemFormData) => {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("category", newItem.category);
      formData.append("basePrice", newItem.basePrice.toString());
      formData.append("monthlyPrice", newItem.monthlyPrice.toString());
      formData.append("yearlyPrice", newItem.yearlyPrice.toString());
      formData.append("lifetimePrice", newItem.lifetimePrice.toString());
      if (newItem.imageFile) {
        formData.append("image", newItem.imageFile);
      }
      if (newItem.downloadFile) {
        formData.append("download", newItem.downloadFile);
      }
      return axios.post("/api/admin/store/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setModalOpen(false);
      resetForm();
      toast.success("Item created successfully!");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to create item."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ItemFormData }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("category", data.category);
      formData.append("basePrice", data.basePrice.toString());
      formData.append("monthlyPrice", data.monthlyPrice.toString());
      formData.append("yearlyPrice", data.yearlyPrice.toString());
      formData.append("lifetimePrice", data.lifetimePrice.toString());
      if (data.imageFile) {
        formData.append("image", data.imageFile);
      }
      if (data.downloadFile) {
        formData.append("download", data.downloadFile);
      }
      return axios.put(`/api/admin/store/items/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setModalOpen(false);
      setEditingItem(null);
      resetForm();
      toast.success("Item updated successfully!");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to update item."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/admin/store/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item deleted successfully!");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to delete item."));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.patch(`/api/admin/store/items/${id}/approve`, {
        isApproved: true,
      });
    },
    onSuccess: (response) => {
      console.log("✅ Approve response:", response.data);
      // Only invalidate once - this will trigger a refetch automatically
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item approved successfully!");
    },
    onError: (err) => {
      console.error("❌ Approve error:", err);
      toast.error(getAxiosErrorMessage(err, "Failed to approve item."));
    },
  });

  const disapproveMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.patch(`/api/admin/store/items/${id}/approve`, {
        isApproved: false,
      });
    },
    onSuccess: (response) => {
      console.log("✅ Disapprove response:", response.data);
      // Only invalidate once - this will trigger a refetch automatically
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item disapproved successfully!");
    },
    onError: (err) => {
      console.error("❌ Disapprove error:", err);
      toast.error(getAxiosErrorMessage(err, "Failed to disapprove item."));
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await axios.post("/api/admin/store/items/categories", {
        name: category,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["item-categories"] });
      setCategoryModalOpen(false);
      setNewCategory("");
      setFormData((prev) => ({
        ...prev,
        category: data.category.id,
      }));
      toast.success("Category created successfully!");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to create category."));
    },
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!editingItem && !formData.imageFile) {
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
    if (newCategory.trim()) {
      createCategoryMutation.mutate(newCategory.trim());
    } else {
      toast.error("Category name cannot be empty");
    }
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
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleDisapprove = (id: string) => {
    disapproveMutation.mutate(id);
  };

  const handleView = (id: string) => {
    router.push(`/admin/manage-store-product/${id}`);
  };

  const typedCategories = categories as Category[];
  const typedFilteredItems = filteredItems as Item[];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Product Management</h2>

      <div className="mb-6 flex gap-4 flex-wrap">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setModalOpen(true);
          }}
        >
          Add New Product
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => setCategoryModalOpen(true)}
        >
          Add New Category
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? "Edit Item" : "Create New Item"}
              </h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Base Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basePrice: parseFloat(e.target.value) || 0,
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyPrice: parseFloat(e.target.value) || 0,
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearlyPrice: parseFloat(e.target.value) || 0,
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lifetimePrice: parseFloat(e.target.value) || 0,
                      })
                    }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imageFile: e.target.files?.[0] || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editingItem}
                />
                {editingItem && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep current image
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Download File (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type !== 'application/pdf') {
                      toast.error('Only PDF files are allowed for download');
                      e.target.value = '';
                      return;
                    }
                    setFormData({
                      ...formData,
                      downloadFile: file || undefined,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF files only
                </p>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingItem
                  ? updateMutation.isPending
                    ? "Updating..."
                    : "Update Item"
                  : createMutation.isPending
                    ? "Creating..."
                    : "Create Item"}
              </button>
            </form>
          </div>
        </div>
      )}

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
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
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
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search products..."
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
          {typedCategories.map((cat) => (
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
      </div>

      {isLoading ? (
        <PageSkeleton type="manage-store-product" />
      ) : error ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          Error: {error.message}
        </div>
      ) : typedFilteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          {searchQuery || selectedCategoryFilter || approvalFilter !== "all"
            ? "No products match your filters."
            : "No products found. Create your first product!"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yearly
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lifetime
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {typedFilteredItems.map((item) => {
                const category = typedCategories.find((cat) => cat.id === item.categoryId);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
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
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {category?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">
                      ${item.basePrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">${item.monthlyPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">${item.yearlyPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">${item.lifetimePrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.approver ? (
                        <span>{item.approver.name || item.approver.email}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}

                      
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        {/* View details */}
                        <button
                          onClick={() => handleView(item.id)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Approve */}
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          disabled={approveMutation.isPending || item.isApproved}
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        {/* Disapprove */}
                        <button
                          onClick={() => handleDisapprove(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={disapproveMutation.isPending || !item.isApproved}
                          title="Disapprove"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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