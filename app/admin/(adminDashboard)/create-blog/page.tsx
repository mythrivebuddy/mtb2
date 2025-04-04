"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import CreateBlogPost from "@/components/adminDashboard/CreateBlog";

interface Blog {
  id: string;
  title: string;
  image?: string;
  excerpt: string;
  category: string;
  content: string;
  readTime: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPost() {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Fetch blogs using axios
  const {
    data: blogs,
    isLoading,
    error,
  } = useQuery<Blog[], Error>({
    queryKey: ["blogs"],
    queryFn: async () => {
      const response = await axios.get("/api/blogs/getBlogs");
      return response.data.blogs;
    },
  });

  // Fetch categories from backend
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery<string[], Error>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/blogs/getCategories");
      return response.data.categories;
    },
  });

  const handleCreateSuccess = () => {
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["blogs"] });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Blog Management</h2>

      <div className="mb-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => setModalOpen(true)}
        >
          Create New Post
        </button>
      </div>

      {/* Modal for creating a new blog post */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex justify-end">
              <button onClick={() => setModalOpen(false)}>Close</button>
            </div>
            <CreateBlogPost onSuccess={handleCreateSuccess} />
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search posts..."
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
        <div>Loading blogs...</div>
      ) : error ? (
        <div>Error loading blogs: {error.message}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Excerpt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Read Time
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
              {blogs?.map((blog) => (
                <tr key={blog.id}>
                  <td className="px-6 py-4">{blog.title}</td>
                  <td className="px-6 py-4">{blog.category}</td>
                  <td className="px-6 py-4">{blog.excerpt}</td>
                  <td className="px-6 py-4">{blog.readTime}</td>
                  <td className="px-6 py-4">
                    {new Date(blog.createdAt).toLocaleDateString()}
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
