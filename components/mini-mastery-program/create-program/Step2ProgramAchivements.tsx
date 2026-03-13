"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, Plus, X } from "lucide-react";
import { step2MMPSchema, type Step2Data, type FullFormData } from "@/schema/zodSchema";
import { MMP_STORAGE_KEY } from "@/types/client/mini-mastery-program";

interface Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  defaultValues?: Partial<Step2Data>;
}

export default function Step2ProgramAchievements({ onNext, onBack, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2MMPSchema),
    defaultValues: {
      achievements: defaultValues?.achievements?.length
        ? defaultValues.achievements
        : [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "achievements" });

  const allValues = useWatch({ control });

  const persistToStorage = (values: Partial<Step2Data>) => {
    const stored = localStorage.getItem(MMP_STORAGE_KEY);
    const parsed: Partial<FullFormData> = stored ? (JSON.parse(stored) as Partial<FullFormData>) : {};
    localStorage.setItem(MMP_STORAGE_KEY, JSON.stringify({ ...parsed, step2: values }));
  };

  const arrayLevelError: string | undefined =
    errors.achievements?.message ??
    (errors.achievements as { root?: { message?: string } } | undefined)?.root?.message;

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-10 animate-in fade-in duration-500"
      noValidate
    >
      <header>
        <h2 className="text-3xl font-bold text-[#1e293b]">
          What Will Participants Achieve?
        </h2>
        <p className="text-gray-400 mt-2 text-base">
          Define the transformation participants will experience through your Mini-Mastery Program.
        </p>
      </header>

      <div className="space-y-4">
        {arrayLevelError && (
          <p className="text-sm text-red-500 font-medium">{arrayLevelError}</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="space-y-1">
            <div className="relative group">
              <input
                {...register(`achievements.${index}.value`, {
                  onChange: () => persistToStorage(allValues as Partial<Step2Data>),
                })}
                type="text"
                placeholder="e.g. Develop a consistent morning routine"
                className={`w-full p-4 border rounded-[24px] focus:ring-2 outline-none transition-all text-gray-700 text-sm ${
                  errors.achievements?.[index]?.value
                    ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                    : "bg-gray-50/50 border-gray-100 focus:ring-blue-400"
                }`}
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    remove(index);
                    persistToStorage(allValues as Partial<Step2Data>);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {errors.achievements?.[index]?.value?.message && (
              <p className="text-[11px] text-red-500 font-medium pl-4">
                {errors.achievements[index].value.message}
              </p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            append({ value: "" });
            persistToStorage(allValues as Partial<Step2Data>);
          }}
          disabled={fields.length >= 10}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors px-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Add another achievement
        </button>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-100 font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          type="submit"
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95 text-sm"
        >
          Save & Continue <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}