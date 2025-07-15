"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { challengeSchema, challengeSchemaFormType } from "@/schema/zodSchema"; // Make sure to export the type
import { PlusCircle, X, Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function CreateChallenge() {
  const router = useRouter();
  
  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<challengeSchemaFormType>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      mode: "PUBLIC",
      tasks: [{ description: "" }],
      cost: 50,
      reward: 50,
      penalty: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "tasks",
    control,
  });

  const onSubmit = async (data: challengeSchemaFormType) => {
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
        alert(`Error: ${errorData.error || 'Something went wrong'}`);
        return;
      }

      alert("Challenge created successfully!");
      router.push('/dashboard'); // Redirect on success
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    // Main background matching the theme
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800">Create Your Challenge</h1>
          <p className="text-slate-500 mt-2">Craft your unique challenge and inspire others!</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
          {/* Row 1: Title, Cost, Reward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <input
                placeholder="Challenge Title"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register("title")}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <input
                type="number"
                placeholder="50"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register("cost", { valueAsNumber: true })}
              />
              {errors.cost && <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>}
            </div>
            <div>
              <input
                type="number"
                placeholder="50"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register("reward", { valueAsNumber: true })}
              />
              {errors.reward && <p className="text-red-500 text-sm mt-1">{errors.reward.message}</p>}
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <textarea
              placeholder="Detailed Description (e.g., goals, rules)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              {...register("description")}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          {/* Row 3: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500" {...register("startDate")} />
                  {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
              </div>
              <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500" {...register("endDate")} />
                  {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
              </div>
          </div>
          
          {/* Row 4: Mode & Penalty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                      <input type="radio" value="PUBLIC" {...register("mode")} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300" />
                      <span className="ml-2 text-slate-700">Public</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                      <input type="radio" value="PERSONAL" {...register("mode")} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300" />
                      <span className="ml-2 text-slate-700">Personal</span>
                  </label>
              </div>
              <div>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    {...register("penalty", { valueAsNumber: true })}
                  />
                  {errors.penalty && <p className="text-red-500 text-sm mt-1">{errors.penalty.message}</p>}
              </div>
          </div>

          {/* Dynamic Tasks */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800">Challenge Tasks</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <input
                  placeholder={`Task #${index + 1}`}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register(`tasks.${index}.description`)}
                />
                {fields.length > 1 && (
                   <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors">
                      <X size={20} />
                   </button>
                )}
              </div>
            ))}
            {errors.tasks?.root && <p className="text-red-500 text-sm mt-1">{errors.tasks.root.message}</p>}
             {errors.tasks && !errors.tasks.root && <p className="text-red-500 text-sm mt-1">Please check your tasks for errors.</p>}

            <button
              type="button"
              onClick={() => append({ description: "" })}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Add Another Task
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}