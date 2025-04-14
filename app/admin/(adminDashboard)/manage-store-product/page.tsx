"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";


interface Product {
  id: string;
  name: string;
  image?: string;
  description: string;
  category: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProductManagement() {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const {
    data: products,
    isLoading,
    error,
  } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axios.get("/api/products/getProducts");
      return response.data.products;
    },
  });

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery<string[], Error>({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const response = await axios.get("/api/products/getCategories");
      return response.data.categories;
    },
  });

  const handleCreateSuccess = () => {
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Product Management</h2>

      <div className="mb-6">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
          onClick={() => setModalOpen(true)}
        >
          Add New Product
        </button>
      </div>

      {/* Modal for creating a new product */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex justify-end">
              <button onClick={() => setModalOpen(false)}>Close</button>
            </div>
            
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          {isCategoriesLoading ? (
            <select className="px-4 py-2 border rounded-lg">
              <option>Loading...</option>
            </select>
          ) : categoriesError ? (
            <select className="px-4 py-2 border rounded-lg">
              <option>Error loading categories</option>
            </select>
          ) : (
            <select className="px-4 py-2 border rounded-lg">
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div>Loading products...</div>
      ) : error ? (
        <div>Error loading products: {error.message}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products?.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.description}</td>
                  <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
