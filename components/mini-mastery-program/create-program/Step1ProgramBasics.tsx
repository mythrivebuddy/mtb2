// "use client";

// import { useState, useEffect } from "react";
// import { CheckCircle2, ChevronDown, ArrowRight } from "lucide-react";

// export default function Step1ProgramBasics({ onNext }: { onNext: () => void }) {
//   const [formData, setFormData] = useState({
//     title: "",
//     subtitle: "",
//     duration: "7 Days",
//     unlockType: "daily", // 'daily' or 'all'
//   });

//   // Load from LocalStorage on Mount
//   useEffect(() => {
//     const saved = localStorage.getItem("step1_basics");
//     if (saved) setFormData(JSON.parse(saved));
//   }, []);

//   // Save to LocalStorage on Change
//   const updateData = (fields: Partial<typeof formData>) => {
//     const newData = { ...formData, ...fields };
//     setFormData(newData);
//     localStorage.setItem("step1_basics", JSON.stringify(newData));
//   };

//   return (
//     <div className="space-y-8">
//       <header>
//         <h2 className="text-3xl font-bold text-gray-900">Program Basics</h2>
//         <p className="text-gray-400 mt-2">Define the core foundations of your Mini-Mastery program.</p>
//       </header>

//       <div className="space-y-6">
//         {/* Program Title */}
//         <div className="space-y-2">
//           <label className="text-sm font-bold text-gray-700">Program Title</label>
//           <input
//             type="text"
//             placeholder="e.g. 7-Day Mindful Morning Rituals"
//             className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
//             value={formData.title}
//             onChange={(e) => updateData({ title: e.target.value })}
//           />
//           <p className="text-[11px] text-gray-400">A catchy name that grabs attention.</p>
//         </div>

//         {/* Subtitle */}
//         <div className="space-y-2">
//           <label className="text-sm font-bold text-gray-700">Subtitle / Transformation Promise</label>
//           <textarea
//             rows={3}
//             placeholder="e.g. Master your focus and energy in just 10 minutes a day to achieve peak productivity."
//             className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 resize-none"
//             value={formData.subtitle}
//             onChange={(e) => updateData({ subtitle: e.target.value })}
//           />
//           <p className="text-[11px] text-gray-400">Describe the ultimate benefit users will experience.</p>
//         </div>

//         {/* Duration */}
//         <div className="space-y-2">
//           <label className="text-sm font-bold text-gray-700">Duration</label>
//           <div className="relative">
//             <select
//               className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
//               value={formData.duration}
//               onChange={(e) => updateData({ duration: e.target.value })}
//             >
//               <option>7 Days</option>
//               <option>14 Days</option>
//               <option>21 Days</option>
//               <option>30 Days</option>
//             </select>
//             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
//           </div>
//         </div>

//         {/* Unlock Type */}
//         <div className="space-y-3">
//           <label className="text-sm font-bold text-gray-700">Unlock Type</label>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Daily Unlock */}
//             <div 
//               onClick={() => updateData({ unlockType: "daily" })}
//               className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-start ${
//                 formData.unlockType === "daily" ? "border-blue-500 bg-white shadow-sm" : "border-gray-100 bg-gray-50/50"
//               }`}
//             >
//               <div>
//                 <h4 className="font-bold text-gray-900 text-sm">Daily unlock</h4>
//                 <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">New content appears every 24 hours to keep pace.</p>
//               </div>
//               {formData.unlockType === "daily" && <CheckCircle2 className="text-blue-500 fill-blue-50" size={20} />}
//             </div>

//             {/* All Unlocked */}
//             <div 
//               onClick={() => updateData({ unlockType: "all" })}
//               className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-start ${
//                 formData.unlockType === "all" ? "border-blue-500 bg-white shadow-sm" : "border-gray-100 bg-gray-50/50"
//               }`}
//             >
//               <div>
//                 <h4 className="font-bold text-gray-900 text-sm">All unlocked at once</h4>
//                 <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Users can binge the whole program immediately.</p>
//               </div>
//               {formData.unlockType === "all" && <CheckCircle2 className="text-blue-500 fill-blue-50" size={20} />}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <div className="flex justify-end pt-4">
//         <button 
//           onClick={onNext}
//           className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
//         >
//           Save & Continue <ArrowRight size={20} />
//         </button>
//       </div>
//     </div>
//   );
// }
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