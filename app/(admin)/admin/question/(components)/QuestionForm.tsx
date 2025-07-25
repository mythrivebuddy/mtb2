"use client";

import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import type { Category } from "@prisma/client";

// Updated form inputs type, correctAnswer is removed
type Inputs = {
  text: string;
  categoryId: string;
  options: { value: string }[];
};

export function QuestionForm({ categories }: { categories: Category[] }) {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<Inputs>({
    defaultValues: {
      options: [{ value: "" }, { value: "" }], // Start with two empty options
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    // Format the data for the API, no correctAnswer needed
    const payload = {
      ...data,
      options: data.options.map(o => o.value),
    };

    try {
        await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert("Survey question added successfully!");
        reset();
        window.location.reload();
    } catch (error) {
        alert("Failed to add question.");
        console.error(error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
       <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Survey Question</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700">Question Text</label>
          <textarea
            id="text"
            {...register("text", { required: "Question text is required" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows={3}
          />
          {errors.text && <p className="text-red-500 text-xs mt-1">{errors.text.message}</p>}
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="categoryId"
            {...register("categoryId", { required: "Please select a category" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Answer Options</label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2 mt-2">
              <input
                {...register(`options.${index}.value`, { required: "Option cannot be empty" })}
                placeholder={`Option ${index + 1}`}
                className="block w-full rounded-md border-gray-300 shadow-sm"
              />
              <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold p-1 rounded-full hover:bg-red-100">X</button>
            </div>
          ))}
          <button type="button" onClick={() => append({ value: "" })} className="text-sm text-blue-600 mt-2 font-semibold">
            Add Option
          </button>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {isSubmitting ? "Saving..." : "Save Question"}
        </button>
      </form>
    </div>
  );
}
