"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAlignedActionForm } from "@/lib/hooks/useAlignedActionForm";
import { Step1Data, defaultStep1Values, step1Schema, getMoodEmoji } from "@/lib/utils/aligned-action-form";

interface Step1Props {
  onNext: () => void;
}

export default function Step1({ onNext }: Step1Props) {
  const { formData, updateStep1 } = useAlignedActionForm();
  const [formTouched, setFormTouched] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData.step1 || defaultStep1Values,
    mode: "onChange"
  });

  const selectedMood = watch("mood");
  const notes = watch("notes");
  
  const handleMoodSelect = (mood: Step1Data["mood"]) => {
    setValue("mood", mood, { shouldValidate: true });
    setFormTouched(true);
  };

  const onSubmit = (data: Step1Data) => {
    updateStep1(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-xl font-semibold mb-6">Step 1: Mood & Notes</div>
      
      {/* Mood selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select your mood: <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-4 justify-center">
          {["Sleepy", "Good To Go", "Motivated", "Highly Motivated"].map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => handleMoodSelect(mood as Step1Data["mood"])}
              className={`p-4 rounded-full text-4xl transition-colors ${
                selectedMood === mood ? "bg-yellow-200" : "bg-white"
              } border-2 ${
                selectedMood === mood ? "border-yellow-500" : "border-gray-300"
              }`}
            >
              {getMoodEmoji(mood as Step1Data["mood"])}
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" {...register("mood")} />
      {errors.mood && (
        <p className="text-red-500 text-sm mt-1">{errors.mood.message}</p>
      )}
      
      {(formTouched && !selectedMood) && !errors.mood && (
        <p className="text-red-500 text-sm mt-1">Please select your mood</p>
      )}

      {/* Notes fields */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Your notes (required, max 120 characters each): <span className="text-red-500">*</span>
        </label>
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <div className="relative">
              <input
                type="text"
                {...register(`notes.${index}`)}
                maxLength={120}
                placeholder={`Note ${index + 1} (required)`}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  setFormTouched(true);
                  register(`notes.${index}`).onChange(e);
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {notes?.[index]?.length || 0}/120
              </div>
            </div>
            {errors.notes?.[index] && (
              <p className="text-red-500 text-sm mt-1">
                {errors.notes[index]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      {errors.notes && !Array.isArray(errors.notes) && (
        <p className="text-red-500 text-sm">
          {errors.notes.message}
        </p>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={!isValid}
          className={`px-6 py-2 rounded-md ${
            isValid
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          } transition-colors`}
        >
          Next
        </button>
      </div>
     </form>
  );
}