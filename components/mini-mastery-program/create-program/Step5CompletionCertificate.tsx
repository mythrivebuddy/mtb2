// "use client";

// import { useState, useEffect } from "react";
// import { ArrowLeft, ArrowRight, Info, Award } from "lucide-react";

// export default function CompletionCertificate({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
//   const [threshold, setThreshold] = useState(100);
//   const [certTitle, setCertTitle] = useState("Mastery in Sustainable Living Fundamentals");

//   useEffect(() => {
//     const saved = localStorage.getItem("step5_completion");
//     if (saved) {
//       const data = JSON.parse(saved);
//       setThreshold(data.threshold);
//       setCertTitle(data.certTitle);
//     }
//   }, []);

//   const handleSave = (fields: any) => {
//     const newData = { threshold, certTitle, ...fields };
//     setThreshold(newData.threshold);
//     setCertTitle(newData.certTitle);
//     localStorage.setItem("step5_completion", JSON.stringify(newData));
//   };

//   return (
//     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
//       <header>
//         <h2 className="text-4xl font-bold text-[9#1e23b]">Completion & Certificate</h2>
//         <p className="text-gray-500 mt-2 text-lg">Define the requirements for participants to earn their certificate.</p>
//       </header>

//       <div className="space-y-10">
//         {/* Completion Threshold Slider */}
//         <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h3 className="font-bold text-gray-900">Completion Threshold</h3>
//               <p className="text-xs text-gray-400 mt-1">Minimum percentage of course material to be consumed.</p>
//             </div>
//             <span className="text-3xl font-bold text-blue-600">{threshold}%</span>
//           </div>
          
//           <div className="relative pt-4">
//             <input
//               type="range"
//               min="0"
//               max="100"
//               value={threshold}
//               onChange={(e) => handleSave({ threshold: parseInt(e.target.value) })}
//               className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
//             />
//             <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
//               <span>0%</span>
//               <span>50%</span>
//               <span>100%</span>
//             </div>
//           </div>
//         </div>

//         {/* Certificate Title Input */}
//         <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-4">
//           <h3 className="font-bold text-gray-900">Certificate Title</h3>
//           <p className="text-xs text-gray-400">This title will appear prominently on the issued digital certificate.</p>
//           <input
//             type="text"
//             value={certTitle}
//             onChange={(e) => handleSave({ certTitle: e.target.value })}
//             className="w-full p-5 bg-gray-50/50 border border-gray-100 rounded-2xl font-medium text-gray-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
//             placeholder="Enter certificate title..."
//           />
//         </div>

//         {/* Mandatory Feedback Info */}
//         <div className="bg-blue-50/60 border border-blue-100 p-6 rounded-[24px] flex gap-4">
//           <div className="bg-blue-500 p-1 rounded-full h-fit mt-1">
//             <Info size={14} className="text-white" />
//           </div>
//           <div className="space-y-1">
//             <h4 className="font-bold text-gray-900 text-sm">Mandatory Feedback</h4>
//             <p className="text-xs text-gray-500 leading-relaxed">
//               Participants must submit final program feedback before they are eligible to download their certificate.
//             </p>
//           </div>
//         </div>

//         {/* Certificate Preview Card */}
//         <div className="relative border-2 border-dashed border-gray-200 rounded-[32px] p-12 flex flex-col items-center justify-center bg-gray-50/30 overflow-hidden group">
//           <div className="absolute top-4 right-6 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Preview</div>
          
//           <div className="text-center space-y-4">
//              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
//                 <Award className="text-gray-400" size={32} />
//              </div>
//              <h4 className="font-serif text-2xl text-gray-400 italic">Certificate of Completion</h4>
//              <div className="w-48 h-px bg-gray-200 mx-auto" />
//              <p className="text-sm text-gray-400 max-w-xs mx-auto">
//                {certTitle ? certTitle : "The title will be dynamically updated based on your input above."}
//              </p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <div className="flex justify-between items-center pt-10">
//         <button 
//           onClick={onBack}
//           className="flex items-center gap-2 px-8 py-3 rounded-full border border-gray-100 font-bold text-gray-500 hover:bg-gray-50 transition-all"
//         >
//           <ArrowLeft size={18} /> Back
//         </button>

//         <button 
//           onClick={onNext}
//           className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-full flex items-center gap-2 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95"
//         >
//           save & Continue <ArrowRight size={20} />
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Info, Award } from "lucide-react";
import { step5MMPSchema, type Step5Data, type FullFormData, MMP_STORAGE_KEY } from "@/schema/zodSchema";

interface Props {
  onNext: (data: Step5Data) => void;
  onBack: () => void;
  defaultValues?: Partial<Step5Data>;
}

export default function Step5CompletionCertificate({ onNext, onBack, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<Step5Data>({
    resolver: zodResolver(step5MMPSchema),
    defaultValues: {
      threshold: 100,
      certTitle: "Mastery in Sustainable Living Fundamentals",
      ...defaultValues,
    },
  });

  const allValues = useWatch({ control });
  const threshold = allValues.threshold ?? 100;
  const certTitle = allValues.certTitle ?? "";

  const persistToStorage = (values: Partial<Step5Data>) => {
    const stored = localStorage.getItem(MMP_STORAGE_KEY);
    const parsed: Partial<FullFormData> = stored ? (JSON.parse(stored) as Partial<FullFormData>) : {};
    localStorage.setItem(MMP_STORAGE_KEY, JSON.stringify({ ...parsed, step5: values }));
  };

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
      noValidate
    >
      <header>
        <h2 className="text-4xl font-bold text-[#1e293b]">Completion & Certificate</h2>
        <p className="text-gray-500 mt-2 text-lg">
          Define the requirements for participants to earn their certificate.
        </p>
      </header>

      <div className="space-y-10">
        {/* Threshold Slider */}
        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">Completion Threshold</h3>
              <p className="text-xs text-gray-400 mt-1">
                Minimum percentage of course material to be consumed.
              </p>
            </div>
            <span className={`text-3xl font-bold ${errors.threshold ? "text-red-500" : "text-blue-600"}`}>
              {threshold}%
            </span>
          </div>

          <div className="relative pt-4">
            <input
              type="range"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setValue("threshold", val, { shouldValidate: true });
                persistToStorage({ ...allValues, threshold: val } as Partial<Step5Data>);
              }}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                errors.threshold ? "accent-red-500 bg-red-100" : "accent-blue-600 bg-gray-100"
              }`}
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          {errors.threshold?.message && (
            <p className="text-[11px] text-red-500 font-medium">{errors.threshold.message}</p>
          )}
        </div>

        {/* Certificate Title */}
        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900">Certificate Title</h3>
          <p className="text-xs text-gray-400">
            This title will appear prominently on the issued digital certificate.
          </p>
          <input
            {...register("certTitle", {
              onChange: () => persistToStorage(allValues as Partial<Step5Data>),
            })}
            type="text"
            placeholder="Enter certificate title..."
            className={`w-full p-5 border rounded-2xl font-medium text-gray-700 focus:ring-2 outline-none transition-all ${
              errors.certTitle
                ? "bg-red-50/30 border-red-400 focus:ring-red-400"
                : "bg-gray-50/50 border-gray-100 focus:ring-blue-400"
            }`}
          />
          {errors.certTitle?.message && (
            <p className="text-[11px] text-red-500 font-medium">{errors.certTitle.message}</p>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-blue-50/60 border border-blue-100 p-6 rounded-[24px] flex gap-4">
          <div className="bg-blue-500 p-1 rounded-full h-fit mt-1">
            <Info size={14} className="text-white" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 text-sm">Mandatory Feedback</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Participants must submit final program feedback before they are eligible to download
              their certificate.
            </p>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="relative border-2 border-dashed border-gray-200 rounded-[32px] p-12 flex flex-col items-center justify-center bg-gray-50/30 overflow-hidden">
          <div className="absolute top-4 right-6 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
            Preview
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
              <Award className="text-gray-400" size={32} />
            </div>
            <h4 className="font-serif text-2xl text-gray-400 italic">Certificate of Completion</h4>
            <div className="w-48 h-px bg-gray-200 mx-auto" />
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {certTitle || "The title will be dynamically updated based on your input above."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-8 py-3 rounded-full border border-gray-100 font-bold text-gray-500 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-full flex items-center gap-2 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95"
        >
          Save & Continue <ArrowRight size={20} />
        </button>
      </div>
    </form>
  );
}