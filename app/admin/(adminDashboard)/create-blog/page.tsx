"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

interface BlogResponse {
  blogs: Blog[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export default function BlogPost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const limit = 6;

  const { data, isLoading, error } = useQuery<BlogResponse, Error>({
    queryKey: ["blogs", page],
    queryFn: async () => {
      const response = await axios.get(
        `/api/blogs/getBlogs?page=${page}&limit=${limit}`
      );
      return response.data;
    },
  });

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

  const deleteBlogMutation = useMutation({
    mutationFn: async (blogId: string) => {
      await axios.delete(`/api/admin/blogs?id=${blogId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (error) => {
      console.error("Error deleting blog:", error);
    },
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Blog Management</h2>

      <div className="mb-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => router.push("/admin/create-blog/new")}
        >
          Create New Post
        </button>
      </div>

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
        <>
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
                {data?.blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td className="px-6 py-4">{blog.title}</td>
                    <td className="px-6 py-4">{blog.category}</td>
                    <td className="px-6 py-4">{blog.excerpt}</td>
                    <td className="px-6 py-4">{blog.readTime}</td>
                    <td className="px-6 py-4">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        onClick={() =>
                          router.push(`/admin/create-blog/${blog.title}`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => deleteBlogMutation.mutate(blog.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex justify-center gap-4 items-center">
            <button
              className="px-4 py-2 border rounded disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="font-semibold">
              Page {data?.page} of {data?.totalPages}
            </span>
            <button
              className="px-4 py-2 border rounded disabled:opacity-50"
              onClick={() =>
                setPage((prev) =>
                  Math.min(prev + 1, data?.totalPages ?? prev + 1)
                )
              }
              disabled={page === data?.totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
