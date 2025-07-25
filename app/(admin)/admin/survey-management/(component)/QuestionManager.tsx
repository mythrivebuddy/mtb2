"use client";

import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CategoryWithQuestions } from "@/types/types";

type QuestionWithCategory = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  options: string[];
  category: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

type Inputs = {
  text: string;
  categoryId: string;
  options: { value: string }[];
};

type QuestionManagerProps = {
  questions: QuestionWithCategory[];
  categories: CategoryWithQuestions[];
  mutateQuestions?: () => void;
};

export function QuestionManager({ questions, categories, mutateQuestions }: QuestionManagerProps) {
  const router = useRouter();
  const { register, handleSubmit, control, reset, formState: { isSubmitting } } = useForm<Inputs>({
    defaultValues: { options: [{ value: "" }, { value: "" }] },
  });
  const { fields } = useFieldArray({ control, name: "options" });

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const payload = { ...data, options: data.options.map(o => o.value) };
    await fetch("/api/survey/question/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    alert("Question added successfully!");
    reset();
    if (mutateQuestions) {
      mutateQuestions();
    } else {
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Question</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="text" className="block font-medium mb-1">Question Here</label>
              <input
                type="text"
                {...register("text", { required: true })}
                placeholder="Type your question..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="categoryId" className="font-medium">Category</label>
              <select {...register("categoryId", { required: true })} className="block rounded-md border-gray-300 shadow-sm">
                <option value="">Select...</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Options</label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <input
                    key={field.id}
                    {...register(`options.${index}.value`, { required: true })}
                    placeholder={`Option ${index + 1}`}
                    className="block w-full rounded-md border-gray-300 shadow-sm"
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-md">
              {isSubmitting ? "Saving..." : "Save Question"}
            </button>
          </form>
        </div>
      </div>
      {/* List */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Questions</h2>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="p-4 border rounded-md">
                <p className="font-semibold">{q.name}</p>
                <p className="text-sm text-gray-500">Category: {q.category.name}</p>
                <ul className="list-disc pl-5 mt-2">
                  {(q.options ?? []).map((opt: string, i: number) => <li key={i}>{opt}</li>)}
                </ul>
                <div className="text-right mt-2">
                  <button onClick={() => handleDelete(q.id)} className="text-red-600 text-sm font-semibold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
