"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAlignedActionForm } from "@/lib/hooks/useAlignedActionForm";
import {
  Step2Data,
  step2Schema,
  getMoodEmoji,
} from "@/lib/utils/aligned-action-form";

// Task Types Definition
const TASK_TYPES = [
  { id: "Creative", label: "Creative" },
  { id: "revenueGenerating", label: "Revenue Generating" },
  { id: "nurturing", label: "Nurturing" },
  { id: "admin", label: "Admin" },
] as const;

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

export default function Step2({ onNext, onBack }: Step2Props) {
  const { formData, updateStep2 } = useAlignedActionForm();

  // Track the selected option in a local state to preserve it across form revalidations
  const [localSelectedOption, setLocalSelectedOption] = useState(
    formData.step2?.selectedOption || ""
  );

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      taskTypes: formData.step2?.taskTypes || [],
      selectedOption: formData.step2?.selectedOption || "",
    },
    mode: "onChange",
  });

  // Watch form values to update local state
  const watchedSelectedOption = watch("selectedOption");
  const watchedTaskTypes = watch("taskTypes");

  // Update local state when the radio selection changes
  useEffect(() => {
    if (watchedSelectedOption) {
      setLocalSelectedOption(watchedSelectedOption);
    }
  }, [watchedSelectedOption]);

  // Ensure the form selectedOption matches our local state
  useEffect(() => {
    if (localSelectedOption && getValues("selectedOption") !== localSelectedOption) {
      setValue("selectedOption", localSelectedOption, { shouldValidate: true });
    }
  }, [watchedTaskTypes, localSelectedOption,getValues,setValue]);

  const onSubmit = (data: Step2Data) => {
    if (!data.selectedOption || data.selectedOption.trim() === "") {
      return;
    }
    updateStep2(data);
    onNext();
  };

  const validNotes = formData.step1.notes.filter((note) => note && note.trim() !== "");

  // Handler for radio button selection that also updates our local state
  const handleRadioChange = (note: string) => {
    setLocalSelectedOption(note);
    setValue("selectedOption", note, { shouldValidate: true });
  };

  // Handler for checkbox changes that preserves the radio selection
  const handleCheckboxChange = () => {
    // Re-apply the current radio selection after the checkbox change is processed
    setTimeout(() => {
      if (localSelectedOption) {
        setValue("selectedOption", localSelectedOption, { shouldValidate: false });
      }
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-xl font-semibold mb-6">Step 2: Task Selection</div>

      {/* Show selected emoji and notes from step 1 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="text-sm font-medium text-gray-700 mb-2">From Step 1:</div>
        <div className="flex items-center mb-2">
          <div className="text-3xl mr-3">{getMoodEmoji(formData.step1.mood)}</div>
          <div className="text-sm text-gray-600">Mood: {formData.step1.mood}</div>
        </div>
        <div className="space-y-1">
          {formData.step1.notes.map((note, index) => (
            <div key={index} className="text-sm text-gray-700">
              {note ? note : <span className="italic text-gray-400">No note</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Task selection from Step 1 (Radio Buttons) */}
      <div className="space-y-2 mt-6" role="radiogroup" aria-labelledby="task-selection-label">
        <label id="task-selection-label" className="block text-sm font-medium text-gray-700">
          Choose one of the tasks you added in Step 1: <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {validNotes.map((note, index) => (
            <div
              key={index}
              className="flex items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200"
            >
              <input
                type="radio"
                id={`task-${index}`}
                name="selectedTask"
                value={note}
                checked={localSelectedOption === note}
                onChange={() => handleRadioChange(note as string)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor={`task-${index}`}
                className="ml-2 text-sm text-gray-700 w-full cursor-pointer"
              >
                {note}
              </label>
            </div>
          ))}
        </div>
        {errors.selectedOption && (
          <p className="text-red-500 text-sm">{errors.selectedOption.message}</p>
        )}
      </div>

      {/* Task type selection (Checkboxes) */}
      <div className="space-y-2 mt-6" role="group" aria-labelledby="task-type-label">
        <label id="task-type-label" className="block text-sm font-medium text-gray-700">
          Task Type: <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TASK_TYPES.map(({ id, label }) => (
            <div
              key={id}
              className="flex items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200"
            >
              <input
                type="checkbox"
                id={id}
                value={id}
                {...register("taskTypes", {
                  onChange: handleCheckboxChange
                })}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor={id}
                className="ml-2 text-sm text-gray-700 w-full cursor-pointer"
              >
                {label}
              </label>
            </div>
          ))}
        </div>
        {errors.taskTypes && (
          <p className="text-red-500 text-sm">{errors.taskTypes.message}</p>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="pt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!isValid || !getValues("selectedOption")}
          className={`px-6 py-2 rounded-md ${
            isValid && getValues("selectedOption")
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