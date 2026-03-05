"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronDown, ArrowRight } from "lucide-react";
import { step1MMPSchema, type Step1Data, type FullFormData, MMP_STORAGE_KEY } from "@/schema/zodSchema";

interface Props {
  onNext: (data: Step1Data) => void;
  defaultValues?: Partial<Step1Data>;
}

export default function Step1ProgramBasics({ onNext, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1MMPSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      duration: "7 Days",
      unlockType: "daily",
      ...defaultValues,
    },
  });

  // useWatch triggers re-render + gives stable reference — no JSON.stringify hack needed
  const allValues = useWatch({ control });
  const unlockType = allValues.unlockType;

  // Persist to shared localStorage whenever form values change
  const persistToStorage = (values: Partial<Step1Data>) => {
    const stored = localStorage.getItem(MMP_STORAGE_KEY);
    const parsed: Partial<FullFormData> = stored ? (JSON.parse(stored) as Partial<FullFormData>) : {};
    localStorage.setItem(MMP_STORAGE_KEY, JSON.stringify({ ...parsed, step1: values }));
  };

  // RHF register onChange wrapper to also persist
  const registerWithPersist = (name: keyof Step1Data) => ({
    ...register(name, {
      onChange: () => persistToStorage(allValues as Partial<Step1Data>),
    }),
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8" noValidate>
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Program Basics</h2>
        <p className="text-gray-400 mt-2">Define the core foundations of your Mini-Mastery program.</p>
      </header>

      <div className="space-y-6">
        {/* Program Title */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Program Title</label>
          <input
            {...registerWithPersist("title")}
            type="text"
            placeholder="e.g. 7-Day Mindful Morning Rituals"
            className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition-all placeholder:text-gray-300 ${
              errors.title
                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                : "border-gray-100 focus:ring-blue-500"
            }`}
          />
          {errors.title ? (
            <p className="text-[11px] text-red-500 font-medium">{errors.title.message}</p>
          ) : (
            <p className="text-[11px] text-gray-400">A catchy name that grabs attention.</p>
          )}
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Subtitle / Transformation Promise</label>
          <textarea
            {...registerWithPersist("subtitle")}
            rows={3}
            placeholder="e.g. Master your focus and energy in just 10 minutes a day to achieve peak productivity."
            className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition-all placeholder:text-gray-300 resize-none ${
              errors.subtitle
                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                : "border-gray-100 focus:ring-blue-500"
            }`}
          />
          {errors.subtitle ? (
            <p className="text-[11px] text-red-500 font-medium">{errors.subtitle.message}</p>
          ) : (
            <p className="text-[11px] text-gray-400">Describe the ultimate benefit users will experience.</p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Duration</label>
          <div className="relative">
            <select
              {...registerWithPersist("duration")}
              className={`w-full p-4 bg-gray-50 border rounded-xl appearance-none outline-none focus:ring-2 text-gray-600 ${
                errors.duration
                  ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                  : "border-gray-100 focus:ring-blue-500"
              }`}
            >
              <option>7 Days</option>
              <option>14 Days</option>
              <option>21 Days</option>
              <option>30 Days</option>
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={20}
            />
          </div>
          {errors.duration && (
            <p className="text-[11px] text-red-500 font-medium">{errors.duration.message}</p>
          )}
        </div>

        {/* Unlock Type */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700">Unlock Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["daily", "all"] as const).map((type) => (
              <div
                key={type}
                onClick={() => {
                  setValue("unlockType", type, { shouldValidate: true });
                  persistToStorage({ ...allValues, unlockType: type } as Partial<Step1Data>);
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-start ${
                  unlockType === type
                    ? "border-blue-500 bg-white shadow-sm"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {type === "daily" ? "Daily unlock" : "All unlocked at once"}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    {type === "daily"
                      ? "New content appears every 24 hours to keep pace."
                      : "Users can binge the whole program immediately."}
                  </p>
                </div>
                {unlockType === type && (
                  <CheckCircle2 className="text-blue-500 fill-blue-50 shrink-0" size={20} />
                )}
              </div>
            ))}
          </div>
          {errors.unlockType && (
            <p className="text-[11px] text-red-500 font-medium">{errors.unlockType.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          Save & Continue <ArrowRight size={20} />
        </button>
      </div>
    </form>
  );
}