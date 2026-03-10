"use client";

import { Path, PathValue, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Info, Globe } from "lucide-react";
import { step4MMPSchema, type Step4Data, type FullFormData } from "@/schema/zodSchema";
import { MMP_STORAGE_KEY } from "@/types/client/mini-mastery-program";

interface Props {
  onNext: (data: Step4Data) => void;
  onBack: () => void;
  defaultValues?: Partial<Step4Data>;
}

export default function Step4PricingStrategy({ onNext, onBack, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<Step4Data>({
    resolver: zodResolver(step4MMPSchema),
    defaultValues: {
      isPaid: true,
      currency: "INR",
      price: "0",
      ...defaultValues,
    },
  });

  const allValues = useWatch({ control });
  const isPaid = allValues.isPaid;
  const currency = allValues.currency;

  const persistToStorage = (values: Partial<Step4Data>) => {
    const stored = localStorage.getItem(MMP_STORAGE_KEY);
    const parsed: Partial<FullFormData> = stored ? (JSON.parse(stored) as Partial<FullFormData>) : {};
    localStorage.setItem(MMP_STORAGE_KEY, JSON.stringify({ ...parsed, step4: values }));
  };

  const setAndPersist = <K extends Path<Step4Data>>(
    key: K,
    value: PathValue<Step4Data, K>
  ) => {
    setValue(key, value, { shouldValidate: true });
    persistToStorage({
      ...allValues,
      [key]: value,
    } as Partial<Step4Data>);
  };

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500"
      noValidate
    >
      <header className="text-left">
        <h2 className="text-3xl font-bold text-[#1e293b]">Set your MMP Pricing</h2>
        <p className="text-gray-500 mt-2 text-base">
          Choose how you want to offer your Mini-Mastery Program to your audience.
        </p>
      </header>

      <div className="max-w-md space-y-8">
        {/* Program Type Toggle */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Program Type
          </label>
          <div className="bg-gray-100/80 p-1.5 rounded-[24px] flex items-center border border-gray-200/50">
            {([false, true] as const).map((paid) => (
              <button
                key={String(paid)}
                type="button"
                onClick={() => setAndPersist("isPaid", paid)}
                className={`flex-1 py-3 rounded-[20px] font-bold text-sm transition-all duration-300 ${
                  isPaid === paid
                    ? `bg-white shadow-md ${paid ? "text-blue-600" : "text-gray-900"}`
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {paid ? "Paid Program" : "Free Program"}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Currency */}
        {isPaid && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            {/* Currency */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Globe size={14} className="text-gray-400" />
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Select Currency
                </label>
              </div>
              <div className="flex gap-3">
                {(["INR", "USD"] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setAndPersist("currency", curr)}
                    className={`flex-1 py-3 rounded-2xl font-bold text-xs border-2 transition-all ${
                      currency === curr
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    {curr} {curr === "INR" ? "(₹)" : "($)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Set Price ({currency ?? "INR"})
              </label>
              <div className="relative flex items-center group">
                <span className="absolute left-5 text-gray-400 font-bold text-xl transition-colors group-focus-within:text-blue-500">
                  {currency === "USD" ? "$" : "₹"}
                </span>
                <input
                  {...register("price", {
                    onChange: () => persistToStorage(allValues as Partial<Step4Data>),
                  })}
                  type="number"
                  placeholder="0"
                  className={`w-full pl-12 pr-4 py-5 border-2 rounded-[24px] text-xl font-black text-gray-800 focus:ring-4 outline-none transition-all ${
                    errors.price
                      ? "bg-red-50/30 border-red-400 focus:ring-red-400/10"
                      : "bg-gray-50/50 border-gray-100 focus:ring-blue-400/10 focus:border-blue-400"
                  }`}
                />
              </div>
              <p className="text-[11px] text-gray-400 pl-1">Per enrollment</p>
              {errors.price?.message && (
                <p className="text-[11px] text-red-500 font-medium pl-2">{errors.price.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Earning Info */}
        <div className="bg-white border border-gray-100 p-5 rounded-[24px] flex gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
          <div className="bg-blue-100 p-2 rounded-xl h-fit shrink-0">
            <Info size={16} className="text-blue-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 text-sm italic">Earning Calculator</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Based on your <span className="text-blue-600 font-bold">Silver Tier</span>, you keep
              90% of every sale.{" "}
              {currency === "INR" ? "GST will be applicable." : "International wire fees may apply."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 pt-10">
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