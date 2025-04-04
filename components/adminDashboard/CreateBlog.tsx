"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface CreateBlogPostProps {
  onSuccess: () => void;
}

export default function CreateBlogPost({ onSuccess }: CreateBlogPostProps) {
  const [title, setTitle] = useState<string>("");
  const [excerpt, setExcerpt] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [readTime, setReadTime] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");

  // Fetch categories for the select dropdown
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

  // Mutation for creating a blog post using axios with form data
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post(
        "/api/admin/blogs/createBlogs",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Blog post created successfully!");
      onSuccess();
    },
    onError: () => {
      toast.error("Error creating blog post");
    },
  });
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("excerpt", excerpt);
    formData.append("content", content);
    formData.append("readTime", readTime);
    formData.append("category", newCategory.trim() ? newCategory : category); // Send new category if provided
    if (imageFile) {
      formData.append("imageFile", imageFile);
    }
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setTitle(e.target.value)
        }
        required
        className="border p-2 rounded"
      />

      {isCategoriesLoading ? (
        <select className="border p-2 rounded">
          <option>Loading...</option>
        </select>
      ) : categoriesError ? (
        <select className="border p-2 rounded">
          <option>Error loading categories</option>
        </select>
      ) : (
        <>
          <select
            className="border p-2 rounded"
            value={category}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value)
            }
            disabled={!!newCategory.trim()} // Disable if a new category is being entered
            required
          >
            <option value="">Select Category</option>
            {categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Or add a new category"
            value={newCategory}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewCategory(e.target.value)
            }
            className="border p-2 rounded"
          />
        </>
      )}

      <textarea
        placeholder="Excerpt"
        value={excerpt}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setExcerpt(e.target.value)
        }
        required
        className="border p-2 rounded"
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setContent(e.target.value)
        }
        required
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Read Time (e.g., 5 min read)"
        value={readTime}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setReadTime(e.target.value)
        }
        required
        className="border p-2 rounded"
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-600 text-white rounded p-2">
        Create Blog Post
      </button>
    </form>
  );
}
