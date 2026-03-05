// "use client";

// import { useState, useEffect } from "react";
// import { CheckCircle2, ArrowLeft, Send, Save, Loader2 } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { RiDoubleQuotesR } from "react-icons/ri";
// import { RiDoubleQuotesL } from "react-icons/ri";

// export default function ReviewAndPublish({ onBack }: { onBack: () => void }) {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [summary, setSummary] = useState<any>(null);
//   const router = useRouter();

//   // Load all data from LocalStorage for Review
//   useEffect(() => {
//     const basics = JSON.parse(localStorage.getItem("step1_basics") || "{}");
//     const pricing = JSON.parse(localStorage.getItem("step4_pricing") || "{}");
//     const modules = JSON.parse(localStorage.getItem("step3_modules") || "[]");
//     const completion = JSON.parse(localStorage.getItem("step5_completion") || "{}");

//     setSummary({ basics, pricing, modules, completion });
//   }, []);

//   const handleFinalSubmit = async () => {
//     setIsSubmitting(true);
//     // Yahan tumhari API call aayegi (DB save logic)
//     await new Promise((resolve) => setTimeout(resolve, 2000)); // Fake Delay
    
//     localStorage.clear(); // Saaf kar do storage
//     router.push("/"); // Dashboard par wapas
//   };

//   if (!summary) return null;

//   return (
//     <div className="relative">
//       {/* Background Content (Blurred when modal is open) */}
//       <div className={`space-y-8 transition-all duration-300 ${isModalOpen ? "blur-md scale-[0.98] pointer-events-none" : ""}`}>
//         <header>
//           <h2 className="text-4xl font-bold text-[#1e293b]">Review Your Program</h2>
//           <p className="text-gray-500 mt-2 text-lg">Please verify all details before submitting for review.</p>
//         </header>

//         {/* Preview Card Section */}
//         <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
//           <div className="aspect-[21/9] bg-gradient-to-r from-orange-100 to-orange-50 relative">
//              <div className="absolute inset-0 flex items-center justify-center">
//                 <div className="w-24 h-24 bg-black/10 rounded-full blur-2xl" />
//                 <img src="/api/placeholder/400/200" alt="Preview" className="opacity-40" />
//              </div>
//           </div>
          
//           <div className="p-8 space-y-6">
//             <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
//               <CheckCircle2 size={18} /> Program Specifications
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 text-sm">
//               <div className="flex justify-between md:block border-b md:border-none border-gray-50 pb-2">
//                 <p className="text-gray-400">Program Title</p>
//                 <p className="font-bold text-gray-800">{summary.basics.title || "Mindfulness Mastery"}</p>
//               </div>
//               <div className="flex justify-between md:block border-b md:border-none border-gray-50 pb-2">
//                 <p className="text-gray-400">Duration</p>
//                 <p className="font-bold text-gray-800">{summary.basics.duration || "7 Days"}</p>
//               </div>
//               <div className="flex justify-between md:block border-b md:border-none border-gray-50 pb-2">
//                 <p className="text-gray-400">Pricing</p>
//                 <p className="font-bold text-gray-800">{summary.pricing.isPaid ? `₹${summary.pricing.price}` : "Free"}</p>
//               </div>
//               <div className="flex justify-between md:block border-b md:border-none border-gray-50 pb-2">
//                 <p className="text-gray-400">Modules</p>
//                 <p className="font-bold text-gray-800">{summary.modules.length} Days / {summary.modules.length} Modules</p>
//               </div>
//               <div className="flex justify-between md:block border-b md:border-none border-gray-50 pb-2">
//                 <p className="text-gray-400">Completion Threshold</p>
//                 <p className="font-bold text-blue-500 underline underline-offset-4">{summary.completion.threshold}% (Mandatory)</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bottom Actions */}
//         <div className="flex items-center justify-between pt-6">
//           <button onClick={onBack} className="flex items-center gap-2 font-bold text-gray-400 hover:text-gray-800 transition-colors">
//             <ArrowLeft size={18} /> Back
//           </button>
          
//           <div className="flex items-center gap-4">
//             <button className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 transition-colors px-4 py-2">
//               <Save size={18} /> Save as Draft
//             </button>
//             <button 
//               onClick={() => setIsModalOpen(true)}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-full flex items-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95"
//             >
//               <Send size={18} /> Submit for Review
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Final Modal (Overlay) */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
//           <div className="bg-white rounded-[40px] p-10 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-6">
//             <div className="w-16 h-16 bg-[#10e956]/20 text-[#10e956] rounded-full flex items-center justify-center mx-auto">
//               <CheckCircle2 size={32} />
//             </div>
            
//             <div className="space-y-2">
//               <h3 className="text-2xl font-bold text-gray-900">Ready to Publish?</h3>
//               <p className="text-gray-500 text-sm leading-relaxed px-4">
//                 Your program <span className="font-bold text-gray-800"><RiDoubleQuotesL />{summary.basics.title}<RiDoubleQuotesR /></span> will be sent to our moderation team. This usually takes 24-48 hours.
//               </p>
//             </div>

//             <div className="space-y-3 pt-4">
//               <button 
//                 onClick={handleFinalSubmit}
//                 disabled={isSubmitting}
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
//               >
//                 {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm & Submit"}
//               </button>
//               <button 
//                 onClick={() => setIsModalOpen(false)}
//                 className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl transition-all"
//               >
//                 Go Back
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { CheckCircle2, ArrowLeft, Send, Save, Loader2 } from "lucide-react";
import { type FullFormData, buildDBPayload, type ProgramDBPayload } from "@/schema/zodSchema";

interface Props {
  formData: FullFormData;
  onBack: () => void;
  onSubmit: (payload: ProgramDBPayload) => Promise<void>;
  onSaveDraft: (payload: ProgramDBPayload) => Promise<void>;
}

export default function Step6ReviewAndPublish({ formData, onBack, onSubmit, onSaveDraft }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const payload = buildDBPayload(formData);

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await onSaveDraft({ ...payload, status: "DRAFT" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const pricingDisplay =
    payload.price > 0
      ? `${payload.currency === "INR" ? "₹" : "$"}${payload.price}`
      : "Free";

  const reviewItems: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Program Title", value: payload.name || "—" },
    { label: "Duration", value: `${payload.durationDays} Days` },
    { label: "Unlock Type", value: payload.unlockType === "daily" ? "Daily Unlock" : "All Unlocked" },
    { label: "Pricing", value: pricingDisplay },
    { label: "Modules", value: `${payload.modules.length} Modules` },
    { label: "Achievements", value: `${payload.achievements.length} Defined` },
    { label: "Completion Threshold", value: `${payload.completionThreshold}%`, highlight: true },
    { label: "Certificate Title", value: payload.certificateTitle || "—" },
  ];

  return (
    <div className="relative">
      <div
        className={`space-y-8 transition-all duration-300 ${
          isModalOpen ? "blur-md scale-[0.98] pointer-events-none" : ""
        }`}
      >
        <header>
          <h2 className="text-4xl font-bold text-[#1e293b]">Review Your Program</h2>
          <p className="text-gray-500 mt-2 text-lg">
            Please verify all details before submitting for review.
          </p>
        </header>

        {/* Preview Card */}
        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="aspect-[21/9] bg-gradient-to-r from-orange-100 to-orange-50 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-black/10 rounded-full blur-2xl" />
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
              <CheckCircle2 size={18} /> Program Specifications
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 text-sm">
              {reviewItems.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between md:block border-b md:border-none border-gray-50 pb-2"
                >
                  <p className="text-gray-400">{item.label}</p>
                  <p
                    className={`font-bold ${
                      item.highlight ? "text-blue-500 underline underline-offset-4" : "text-gray-800"
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-bold text-gray-400 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 transition-colors px-4 py-2 disabled:opacity-50"
            >
              {isSavingDraft ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save as Draft
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-full flex items-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              <Send size={18} /> Submit for Review
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => { if (!isSubmitting) setIsModalOpen(false); }}
          />
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Ready to Publish?</h3>
              <p className="text-gray-500 text-sm leading-relaxed px-4">
                Your program{" "}
                <span className="font-bold text-gray-800">&ldquo;{payload.name}&rdquo;</span> will
                be sent to our moderation team. This usually takes 24–48 hours.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Submitting...
                  </>
                ) : (
                  "Confirm & Submit"
                )}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}