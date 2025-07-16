"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { challengeSchema, challengeSchemaFormType } from "@/schema/zodSchema";
import { PlusCircle, X, Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export default function CreateChallenge() {
  const router = useRouter();

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
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
const today = new Date().toISOString().split("T")[0];
  const { fields, append, remove } = useFieldArray({
    name: "tasks",
    control,
  });

  const mutation = useMutation({
    mutationFn: async (data: challengeSchemaFormType) => {
      try {
        const res = await axios.post("/api/challenge", data, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("response from create challenge : ", res);

        return res.data;
      } catch (error: any) {
        const message =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong";

        throw new Error(
          typeof message === "string"
            ? message
            : Object.values(message || {})
                .flat()
                .join(", ")
        );
      }
    },
    onSuccess: (data) => {
      alert(data.message || "Challenge created successfully!");
    },
    onError: (error: any) => {
      alert(error.message || "Failed to create challenge.");
    },
  });

  const onSubmit = (data: challengeSchemaFormType) => {
    mutation.mutate(data);
  };

  return (
    // Main background matching the theme
    <div className="min-h-screen w-full ">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800">
            Create Your Challenge
          </h1>
          <p className="text-slate-500 mt-2">
            Craft your unique challenge and inspire others!
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-8 rounded-2xl shadow-lg space-y-6"
        >
          {/* Title, Cost, Reward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Challenge Title
              </label>
              <input
                id="title"
                placeholder="e.g., 30-Day Fitness"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Cost (JP)
              </label>
              <input
                id="cost"
                type="number"
                placeholder="50"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register("cost", { valueAsNumber: true })}
              />
              {errors.cost && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.cost.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="reward"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Reward (JP)
              </label>
              <input
                id="reward"
                type="number"
                placeholder="50"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register("reward", { valueAsNumber: true })}
              />
              {errors.reward && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.reward.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Detailed Description
            </label>
            <textarea
              id="description"
              placeholder="Explain the goals, rules, and what this challenge is about."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Start Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  id="startDate"
                  min={today}
                  type="date"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register("startDate")}
                />
              </div>
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                End Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  id="endDate"
                  min={today}
                  type="date"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register("endDate")}
                />
              </div>
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Mode & Penalty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Challenge Mode
              </label>
              <div className="flex items-center space-x-6 pt-2">
                <label
                  htmlFor="modePublic"
                  className="flex items-center cursor-pointer"
                >
                  <input
                    id="modePublic"
                    type="radio"
                    value="PUBLIC"
                    {...register("mode")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <span className="ml-2 text-slate-700">Public</span>
                </label>
                <label
                  htmlFor="modePersonal"
                  className="flex items-center cursor-pointer"
                >
                  <input
                    id="modePersonal"
                    type="radio"
                    value="PERSONAL"
                    {...register("mode")}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <span className="ml-2 text-slate-700">Personal</span>
                </label>
              </div>
            </div>
            <div>
              <label
                htmlFor="penalty"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Penalty (JP)
              </label>
              <input
                id="penalty"
                type="number"
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                {...register("penalty", { valueAsNumber: true })}
              />
              {errors.penalty && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.penalty.message}
                </p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800">Challenge Tasks</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <label
                  htmlFor={`task-${index}`}
                  className="sr-only"
                >{`Task #${index + 1}`}</label>
                <input
                  id={`task-${index}`}
                  placeholder={`Task #${index + 1}`}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register(`tasks.${index}.description`)}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
            {errors.tasks?.root && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tasks.root.message}
              </p>
            )}
            {errors.tasks && !errors.tasks.root && (
              <p className="text-red-500 text-sm mt-1">
                Please check your tasks for errors.
              </p>
            )}

            <button
              type="button"
              onClick={() => append({ description: "" })}
              disabled={fields.length >= 3}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Add Another Task
            </button>

            {fields.length >= 3 && (
              <p className="text-sm text-slate-500 text-center mt-2">
                You have reached the maximum of 3 tasks.
              </p>
            )}
          </div>

          {/* Submit Buttons */}
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
              disabled={mutation.isPending}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {mutation.isPending ? "Creating..." : "Create Challenge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
