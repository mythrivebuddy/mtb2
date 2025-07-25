"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation"; // 1. Import useRouter

type Inputs = {
  name: string;
};

export function CategoryForm() {
  const router = useRouter(); // 2. Initialize the router
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        alert(`Category "${data.name}" was added successfully!`);
        reset();
        
        // 3. Replace window.location.reload() with router.refresh()
        router.refresh(); 
        
    } catch (error) {
        alert("Failed to add the category. Please try again.");
        console.error("Error adding category:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Category</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Category Name
          </label>
          <input
            id="name"
            {...register("name", { required: "Category name is required" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Science & Nature"
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
  );
}
