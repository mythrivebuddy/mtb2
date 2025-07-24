"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CategoryWithQuestions } from "@/types/types";

export function CategoryManager({ categories }: { categories: CategoryWithQuestions[] }) {
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ name: string }>();

  const onSubmit: SubmitHandler<{ name: string }> = async (data) => {
    await fetch("/api/survey/category/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    alert(`Category "${data.name}" was added successfully!`);
    reset();
    router.refresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This will also delete all its questions.`)) {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Category</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                id="name"
                {...register("name", { required: "Category name is required" })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g., Marketing"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Saving..." : "Save Category"}
            </button>
          </form>
        </div>
      </div>
      {/* List */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Categories</h2>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex justify-between items-center p-3 border rounded-md">
                <span>{cat.name}</span>
                <button onClick={() => handleDelete(cat.id, cat.name)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
