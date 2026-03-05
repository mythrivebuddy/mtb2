// // "use client";

// // import { useState, useEffect } from "react";
// // import { 
// //   Plus, ChevronDown, ChevronUp, Video, FileText, 
// //   ArrowLeft, ArrowRight, Play, Lightbulb 
// // } from "lucide-react";

// // interface Module {
// //   id: number;
// //   title: string;
// //   type: 'video' | 'text';
// //   videoUrl?: string;
// //   instructions: string;
// //   actionTask: string;
// // }

// // export default function Step3ModuleBuilder({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
// //   const [modules, setModules] = useState<Module[]>([
// //     { id: 1, title: "Introduction to Mindfulness", type: 'video', instructions: "", actionTask: "" }
// //   ]);
// //   const [expandedId, setExpandedId] = useState<number | null>(1);

// //   useEffect(() => {
// //     const saved = localStorage.getItem("step3_modules");
// //     if (saved) setModules(JSON.parse(saved));
// //   }, []);

// //   const save = (data: Module[]) => {
// //     setModules(data);
// //     localStorage.setItem("step3_modules", JSON.stringify(data));
// //   };

// //   const addModule = () => {
// //     const newModule: Module = { 
// //       id: modules.length + 1, 
// //       title: `Day ${modules.length + 1} Module`, 
// //       type: 'text', 
// //       instructions: "", 
// //       actionTask: "" 
// //     };
// //     save([...modules, newModule]);
// //     setExpandedId(newModule.id);
// //   };

// //   return (
// //     <div className="flex flex-col lg:flex-row gap-8 items-start">
// //       {/* Main Builder Section */}
// //       <div className="flex-1 w-full space-y-6">
// //         <header className="mb-8">
// //           <span className="text-[10px] font-bold text-blue-600-500 uppercase tracking-widest">MINI-MASTERY PROGRAM CREATION</span>
// //           <h2 className="text-3xl font-bold text-gray-900 mt-1">Daily Module Builder</h2>
// //         </header>

// //         <div className="space-y-4">
// //           {modules.map((mod) => (
// //             <div key={mod.id} className={`border-2 rounded-3xl transition-all ${expandedId === mod.id ? "border-blue-600-400 p-6" : "border-gray-100 p-4 hover:bg-gray-50 cursor-pointer"}`}>
// //               {/* Accordion Header */}
// //               <div 
// //                 className="flex items-center justify-between"
// //                 onClick={() => setExpandedId(expandedId === mod.id ? null : mod.id)}
// //               >
// //                 <div className="flex items-center gap-4">
// //                   <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${expandedId === mod.id ? "bg-blue-600-500 text-white" : "bg-gray-100 text-gray-400"}`}>
// //                     {mod.id}
// //                   </span>
// //                   <h3 className="font-bold text-gray-800">{mod.title || "Untitled Module"}</h3>
// //                 </div>
// //                 <div className="flex items-center gap-4">
// //                   {!expandedId && <span className="text-xs text-gray-400 font-medium italic">Content: {mod.type}</span>}
// //                   {expandedId === mod.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
// //                 </div>
// //               </div>

// //               {/* Form Content */}
// //               {expandedId === mod.id && (
// //                 <div className="mt-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
// //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //                     <div className="space-y-2">
// //                       <label className="text-xs font-bold text-gray-500 uppercase">Module Title</label>
// //                       <input 
// //                         className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-600-400"
// //                         value={mod.title}
// //                         onChange={(e) => {
// //                           const updated = modules.map(m => m.id === mod.id ? {...m, title: e.target.value} : m);
// //                           save(updated);
// //                         }}
// //                       />
// //                     </div>
// //                     <div className="space-y-2">
// //                       <label className="text-xs font-bold text-gray-500 uppercase">Content Type</label>
// //                       <div className="flex gap-2">
// //                         <button 
// //                           onClick={() => save(modules.map(m => m.id === mod.id ? {...m, type: 'video'} : m))}
// //                           className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${mod.type === 'video' ? "border-blue-600-500 bg-blue-600-50 text-blue-600-700" : "border-gray-100 text-gray-400"}`}
// //                         >
// //                           <Video size={18}/> Video
// //                         </button>
// //                         <button 
// //                           onClick={() => save(modules.map(m => m.id === mod.id ? {...m, type: 'text'} : m))}
// //                           className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${mod.type === 'text' ? "border-blue-600-500 bg-blue-600-50 text-blue-600-700" : "border-gray-100 text-gray-400"}`}
// //                         >
// //                           <FileText size={18}/> Text
// //                         </button>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   {mod.type === 'video' && (
// //                     <div className="space-y-2">
// //                       <label className="text-xs font-bold text-gray-500 uppercase">Video URL</label>
// //                       <input 
// //                         placeholder="YouTube or Vimeo link"
// //                         className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-600-400"
// //                         value={mod.videoUrl}
// //                         onChange={(e) => {
// //                           const updated = modules.map(m => m.id === mod.id ? {...m, videoUrl: e.target.value} : m);
// //                           save(updated);
// //                         }}
// //                       />
// //                     </div>
// //                   )}

// //                   <div className="space-y-2">
// //                     <label className="text-xs font-bold text-gray-500 uppercase">Content Area / Instructions</label>
// //                     <textarea 
// //                       rows={4}
// //                       placeholder="Describe what participants should focus on today..."
// //                       className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600-400 resize-none"
// //                     />
// //                   </div>

// //                   <div className="space-y-2">
// //                     <div className="flex items-center gap-2">
// //                       <label className="text-xs font-bold text-gray-500 uppercase">Action Task</label>
// //                       <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-bold uppercase tracking-tighter">Mandatory</span>
// //                     </div>
// //                     <textarea 
// //                       placeholder="Ask a question or give a task..."
// //                       className="w-full p-4 bg-blue-600-50/30 border border-blue-600-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600-400 resize-none"
// //                     />
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           ))}

// //           <button 
// //             onClick={addModule}
// //             className="w-full py-6 border-2 border-dashed border-blue-600-200 rounded-3xl text-blue-600-600 font-bold flex items-center justify-center gap-2 hover:bg-blue-600-50 transition-all"
// //           >
// //             <Plus size={20}/> Add Day {modules.length + 1}
// //           </button>
// //         </div>

// //         <div className="flex justify-between items-center pt-10">
// //         <button 
// //           onClick={onBack}
// //           className="flex items-center gap-2 px-8 py-3 rounded-full border border-gray-100 font-bold text-gray-500 hover:bg-gray-50 transition-all"
// //         >
// //           <ArrowLeft size={18} /> Back
// //         </button>

// //         <button 
// //           onClick={onNext}
// //           className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-full flex items-center gap-2 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95"
// //         >
// //           Save & Continue <ArrowRight size={20} />
// //         </button>
// //       </div>
// //       </div>

// //       {/* Sidebar Section */}
// //       <aside className="w-full lg:w-[320px] space-y-6 shrink-0">
// //         <div className="bg-[#0f172a] rounded-[32px] p-6 text-white shadow-2xl">
// //           <h4 className="text-blue-600-500 font-bold text-sm mb-6">Program Overview</h4>
          
// //           <div className="space-y-6">
// //             <div className="flex justify-between items-center border-b border-gray-800 pb-4">
// //               <span className="text-xs text-gray-400">Total Duration</span>
// //               <span className="font-bold">{modules.length} Days</span>
// //             </div>

// //             <div className="space-y-2">
// //               <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Module List</span>
// //               <div className="space-y-3">
// //                 {modules.map((m) => (
// //                   <div key={m.id} className="flex items-center gap-3 text-xs text-gray-300 truncate">
// //                     <span className="text-blue-600-500 font-bold">{m.id}.</span> {m.title}
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="bg-gray-800/40 p-4 rounded-2xl space-y-3">
// //               <div className="flex items-center gap-2 text-blue-600-400 text-[10px] font-bold uppercase">
// //                 <Lightbulb size={14}/> Pro Tip
// //               </div>
// //               <p className="text-[11px] text-gray-400 leading-relaxed">
// //                 Programs with at least 5 days have a 40% higher completion rate.
// //               </p>
// //             </div>

// //             <div className="relative group cursor-pointer">
// //               <div className="aspect-video bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
// //                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
// //                   <Play size={20} fill="currentColor"/>
// //                 </div>
// //                 <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] font-bold uppercase">Preview Mode</div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </aside>
// //     </div>
// //   );
// // }

// "use client";

// import { useState } from "react";
// import { useForm, useFieldArray, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   Plus, ChevronDown, ChevronUp, Video, FileText,
//   ArrowLeft, ArrowRight, Play, Lightbulb,
// } from "lucide-react";
// import {
//   step3MMPSchema,
//   type Step3Data,
//   type ModuleData,
//   type FullFormData,
//   MMP_STORAGE_KEY,
// } from "@/schema/zodSchema";
// import type { FieldErrors } from "react-hook-form";

// // Typed helper to extract first error message from a module's field errors
// function getFirstModuleError(modErrors: FieldErrors<ModuleData>): string | undefined {
//   const fields: (keyof ModuleData)[] = ["title", "type", "videoUrl", "instructions", "actionTask"];
//   for (const field of fields) {
//     const err = modErrors[field];
//     if (err?.message) return err.message;
//   }
//   return undefined;
// }

// interface Props {
//   onNext: (data: Step3Data) => void;
//   onBack: () => void;
//   defaultValues?: Partial<Step3Data>;
//   maxDays: number;
// }

// export default function Step3ModuleBuilder({ onNext, onBack, defaultValues, maxDays }: Props) {
//   const [expandedIdx, setExpandedIdx] = useState<number>(0);

//   const {
//     register,
//     handleSubmit,
//     control,
//     setValue,
//     formState: { errors },
//   } = useForm<Step3Data>({
//     resolver: zodResolver(step3MMPSchema),
//     defaultValues: {
//       modules: defaultValues?.modules?.length
//         ? defaultValues.modules
//         : [{ id: 1, title: "Introduction to Mindfulness", type: "video", videoUrl: "", instructions: "", actionTask: "" }],
//     },
//   });

//   const { fields, append, remove } = useFieldArray({ control, name: "modules" });

//   // useWatch — clean subscription, no useEffect needed
//   const watchedModules = useWatch({ control, name: "modules" });

//   const persistToStorage = (values: Partial<Step3Data>) => {
//     const stored = localStorage.getItem(MMP_STORAGE_KEY);
//     const parsed: Partial<FullFormData> = stored ? (JSON.parse(stored) as Partial<FullFormData>) : {};
//     localStorage.setItem(MMP_STORAGE_KEY, JSON.stringify({ ...parsed, step3: values }));
//   };

//   const reachedLimit = fields.length >= maxDays;

//   const addModule = () => {
//     if (reachedLimit) return;
//     append({
//       id: Date.now(),
//       title: `Day ${fields.length + 1} Module`,
//       type: "text",
//       videoUrl: "",
//       instructions: "",
//       actionTask: "",
//     });
//     setExpandedIdx(fields.length);
//   };

//   // Root-level modules array error (e.g. "Add at least one module")
//   const modulesRootError: string | undefined = errors.modules?.message;

//   return (
//     <div className="flex flex-col lg:flex-row gap-8 items-start">
//       <div className="flex-1 w-full space-y-6">
//         <header className="mb-8">
//           <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
//             MINI-MASTERY PROGRAM CREATION
//           </span>
//           <h2 className="text-3xl font-bold text-gray-900 mt-1">Daily Module Builder</h2>
//         </header>

//         {modulesRootError && (
//           <p className="text-sm text-red-500 font-medium">{modulesRootError}</p>
//         )}

//         <form onSubmit={handleSubmit(onNext)} noValidate>
//           <div className="space-y-4">
//             {fields.map((field, index) => {
//               const modErrors: FieldErrors<ModuleData> | undefined = errors.modules?.[index];
//               const hasError = !!modErrors && Object.keys(modErrors).length > 0;
//               const isExpanded = expandedIdx === index;
//               const moduleType = watchedModules?.[index]?.type;

//               return (
//                 <div
//                   key={field.id}
//                   className={`border-2 rounded-3xl transition-all ${
//                     isExpanded
//                       ? hasError ? "border-red-300 p-6" : "border-blue-400 p-6"
//                       : hasError ? "border-red-200 p-4 cursor-pointer" : "border-gray-100 p-4 hover:bg-gray-50 cursor-pointer"
//                   }`}
//                 >
//                   {/* Accordion Header */}
//                   <div
//                     className="flex items-center justify-between"
//                     onClick={() => setExpandedIdx(isExpanded ? -1 : index)}
//                   >
//                     <div className="flex items-center gap-4">
//                       <span
//                         className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
//                           isExpanded
//                             ? "bg-blue-500 text-white"
//                             : hasError
//                             ? "bg-red-100 text-red-500"
//                             : "bg-gray-100 text-gray-400"
//                         }`}
//                       >
//                         {index + 1}
//                       </span>
//                       <div>
//                         <h3 className="font-bold text-gray-800">
//                           {watchedModules?.[index]?.title || "Untitled Module"}
//                         </h3>
//                         {hasError && !isExpanded && modErrors && (
//                           <p className="text-[11px] text-red-400 font-medium mt-0.5">
//                             {getFirstModuleError(modErrors)}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                     {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
//                   </div>

//                   {/* Expanded Form */}
//                   {isExpanded && (
//                     <div className="mt-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Title */}
//                         <div className="space-y-1">
//                           <label className="text-xs font-bold text-gray-500 uppercase">Module Title</label>
//                           <input
//                             {...register(`modules.${index}.title`, {
//                               onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
//                             })}
//                             className={`w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 border ${
//                               modErrors?.title
//                                 ? "border-red-400 bg-red-50/30 focus:ring-red-400"
//                                 : "border-transparent focus:ring-blue-400"
//                             }`}
//                           />
//                           {modErrors?.title?.message && (
//                             <p className="text-[11px] text-red-500 font-medium">{modErrors.title.message}</p>
//                           )}
//                         </div>

//                         {/* Content Type */}
//                         <div className="space-y-1">
//                           <label className="text-xs font-bold text-gray-500 uppercase">Content Type</label>
//                           <div className="flex gap-2">
//                             {(["video", "text"] as const).map((t) => (
//                               <button
//                                 key={t}
//                                 type="button"
//                                 onClick={() => {
//                                   setValue(`modules.${index}.type`, t, { shouldValidate: true });
//                                   persistToStorage({ modules: watchedModules as ModuleData[] });
//                                 }}
//                                 className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
//                                   moduleType === t
//                                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                                     : "border-gray-100 text-gray-400"
//                                 }`}
//                               >
//                                 {t === "video" ? <Video size={18} /> : <FileText size={18} />}
//                                 {t.charAt(0).toUpperCase() + t.slice(1)}
//                               </button>
//                             ))}
//                           </div>
//                         </div>
//                       </div>

//                       {/* Video URL */}
//                       {moduleType === "video" && (
//                         <div className="space-y-1">
//                           <label className="text-xs font-bold text-gray-500 uppercase">Video URL</label>
//                           <input
//                             {...register(`modules.${index}.videoUrl`, {
//                               onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
//                             })}
//                             placeholder="YouTube or Vimeo link"
//                             className={`w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 border ${
//                               modErrors?.videoUrl
//                                 ? "border-red-400 bg-red-50/30 focus:ring-red-400"
//                                 : "border-transparent focus:ring-blue-400"
//                             }`}
//                           />
//                           {modErrors?.videoUrl?.message && (
//                             <p className="text-[11px] text-red-500 font-medium">{modErrors.videoUrl.message}</p>
//                           )}
//                         </div>
//                       )}

//                       {/* Instructions */}
//                       <div className="space-y-1">
//                         <label className="text-xs font-bold text-gray-500 uppercase">
//                           Content Area / Instructions
//                         </label>
//                         <textarea
//                           {...register(`modules.${index}.instructions`, {
//                             onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
//                           })}
//                           rows={4}
//                           placeholder="Describe what participants should focus on today..."
//                           className={`w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 resize-none border ${
//                             modErrors?.instructions
//                               ? "border-red-400 bg-red-50/30 focus:ring-red-400"
//                               : "border-transparent focus:ring-blue-400"
//                           }`}
//                         />
//                         {modErrors?.instructions?.message && (
//                           <p className="text-[11px] text-red-500 font-medium">{modErrors.instructions.message}</p>
//                         )}
//                       </div>

//                       {/* Action Task */}
//                       <div className="space-y-1">
//                         <div className="flex items-center gap-2">
//                           <label className="text-xs font-bold text-gray-500 uppercase">Action Task</label>
//                           <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-bold uppercase tracking-tighter">
//                             Mandatory
//                           </span>
//                         </div>
//                         <textarea
//                           {...register(`modules.${index}.actionTask`, {
//                             onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
//                           })}
//                           rows={2}
//                           placeholder="Ask a question or give a task..."
//                           className={`w-full p-4 rounded-2xl outline-none focus:ring-2 resize-none border ${
//                             modErrors?.actionTask
//                               ? "border-red-400 bg-red-50/30 focus:ring-red-400"
//                               : "border-blue-100 bg-blue-50/30 focus:ring-blue-400"
//                           }`}
//                         />
//                         {modErrors?.actionTask?.message && (
//                           <p className="text-[11px] text-red-500 font-medium">{modErrors.actionTask.message}</p>
//                         )}
//                       </div>

//                       {fields.length > 1 && (
//                         <div className="flex justify-end">
//                           <button
//                             type="button"
//                             onClick={() => {
//                               remove(index);
//                               setExpandedIdx(0);
//                               persistToStorage({ modules: watchedModules as ModuleData[] });
//                             }}
//                             className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors"
//                           >
//                             Remove this module
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}

//             <button
//               type="button"
//               onClick={addModule}
//               disabled={reachedLimit}
//               className={`w-full py-6 border-2 border-dashed rounded-3xl font-bold flex items-center justify-center gap-2 transition-all ${
//                 reachedLimit
//                   ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50/50"
//                   : "border-blue-200 text-blue-600 hover:bg-blue-50"
//               }`}
//             >
//               <Plus size={20} />
//               {reachedLimit
//                 ? `Module limit reached (${maxDays} days max)`
//                 : `Add Day ${fields.length + 1}`}
//             </button>
//           </div>

//           <div className="flex justify-between items-center pt-10">
//             <button
//               type="button"
//               onClick={onBack}
//               className="flex items-center gap-2 px-8 py-3 rounded-full border border-gray-100 font-bold text-gray-500 hover:bg-gray-50 transition-all"
//             >
//               <ArrowLeft size={18} /> Back
//             </button>
//             <button
//               type="submit"
//               className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-full flex items-center gap-2 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95"
//             >
//               Save & Continue <ArrowRight size={20} />
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Sidebar */}
//       <aside className="w-full lg:w-[320px] space-y-6 shrink-0">
//         <div className="bg-[#0f172a] rounded-[32px] p-6 text-white shadow-2xl">
//           <h4 className="text-blue-400 font-bold text-sm mb-6">Program Overview</h4>
//           <div className="space-y-6">
//             <div className="flex justify-between items-center border-b border-gray-800 pb-4">
//               <span className="text-xs text-gray-400">Total Duration</span>
//               <span className="font-bold">{maxDays} Days</span>
//             </div>
//             <div className="flex justify-between items-center border-b border-gray-800 pb-4">
//               <span className="text-xs text-gray-400">Modules Added</span>
//               <span className={`font-bold ${reachedLimit ? "text-green-400" : "text-yellow-400"}`}>
//                 {fields.length} / {maxDays}
//               </span>
//             </div>
//             <div className="space-y-2">
//               <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Module List</span>
//               <div className="space-y-3">
//                 {watchedModules?.map((m, i) => (
//                   <div key={i} className="flex items-center gap-3 text-xs text-gray-300 truncate">
//                     <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
//                     <span className="truncate">{m.title || "Untitled"}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div className="bg-gray-800/40 p-4 rounded-2xl space-y-3">
//               <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase">
//                 <Lightbulb size={14} /> Pro Tip
//               </div>
//               <p className="text-[11px] text-gray-400 leading-relaxed">
//                 Programs with at least 5 days have a 40% higher completion rate.
//               </p>
//             </div>
//             <div className="relative cursor-pointer">
//               <div className="aspect-video bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
//                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
//                   <Play size={20} fill="currentColor" />
//                 </div>
//                 <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] font-bold uppercase">
//                   Preview Mode
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </aside>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, ChevronDown, ChevronUp, Video, FileText,
  ArrowLeft, ArrowRight, Lightbulb, CheckSquare,
  PlayCircle, AlignLeft,
} from "lucide-react";
import {
  step3MMPSchema,
  type Step3Data,
  type ModuleData,
  type FullFormData,
  MMP_STORAGE_KEY,
} from "@/schema/zodSchema";
import type { FieldErrors } from "react-hook-form";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstModuleError(modErrors: FieldErrors<ModuleData>): string | undefined {
  const keys: (keyof ModuleData)[] = ["title", "type", "videoUrl", "instructions", "actionTask"];
  for (const key of keys) {
    const err = modErrors[key];
    if (err?.message) return err.message;
  }
  return undefined;
}

function convertToEmbedUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("/embed/")) return url;
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  } catch {
    return url;
  }
}

// ─── Sidebar Preview ──────────────────────────────────────────────────────────

interface PreviewProps {
  watchedModules: Partial<ModuleData>[] | undefined;
  maxDays: number;
  reachedLimit: boolean;
  fields: { id: string }[];
}

function SidebarPreview({ watchedModules, maxDays, reachedLimit, fields }: PreviewProps) {
  const [previewIdx, setPreviewIdx] = useState<number>(0);

  const current = watchedModules?.[previewIdx];
  const embedUrl = current?.type === "video" && current.videoUrl
    ? convertToEmbedUrl(current.videoUrl)
    : null;
  const isValidEmbed = embedUrl?.includes("/embed/");

  return (
    <aside className="w-full lg:w-[340px] space-y-4 shrink-0">
      <div className="bg-[#0f172a] rounded-[32px] p-5 text-white shadow-2xl space-y-5">

        {/* Header stats */}
        <div className="flex items-center justify-between">
          <h4 className="text-blue-400 font-bold text-sm">Program Preview</h4>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
            reachedLimit ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
          }`}>
            {fields.length} / {maxDays} days
          </span>
        </div>

        {/* Day selector tabs — scrollable row */}
        {(watchedModules?.length ?? 0) > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {watchedModules?.map((_, i) => (
              <button
                key={i}
                onClick={() => setPreviewIdx(i)}
                className={`shrink-0 w-8 h-8 rounded-xl text-[11px] font-black transition-all ${
                  previewIdx === i
                    ? "bg-blue-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Preview card */}
        {current ? (
          <div className="space-y-4">
            {/* Day label + title */}
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                Day {previewIdx + 1}
              </span>
              <h3 className="font-bold text-white text-sm mt-0.5 leading-snug">
                {current.title || <span className="text-gray-500 italic">Untitled Module</span>}
              </h3>
            </div>

            {/* Content type badge */}
            <div className="flex items-center gap-1.5">
              {current.type === "video" ? (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  <PlayCircle size={10} /> Video
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                  <AlignLeft size={10} /> Text
                </span>
              )}
            </div>

            {/* Video embed */}
            {current.type === "video" && (
              <div className="rounded-2xl overflow-hidden border border-gray-700 bg-gray-800">
                {isValidEmbed ? (
                  <iframe
                    src={embedUrl ?? ""}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Day ${previewIdx + 1} video`}
                  />
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-2 text-gray-500">
                    <PlayCircle size={28} className="text-gray-600" />
                    <p className="text-[11px] font-medium text-center px-4">
                      {current.videoUrl
                        ? "Paste a valid YouTube link to preview"
                        : "No video URL added yet"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            {current.instructions && (
              <div className="bg-gray-800/60 rounded-2xl p-3 space-y-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  Instructions
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-4">
                  {current.instructions}
                </p>
              </div>
            )}

            {/* Action task */}
            {current.actionTask && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckSquare size={11} className="text-blue-400" />
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    Action Task
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 leading-relaxed line-clamp-3">
                  {current.actionTask}
                </p>
              </div>
            )}

            {/* Empty state within a module */}
            {!current.instructions && !current.actionTask && current.type !== "video" && (
              <p className="text-[11px] text-gray-600 italic text-center py-2">
                Fill in the module details to see preview
              </p>
            )}

            {/* Day navigation arrows */}
            {(watchedModules?.length ?? 0) > 1 && (
              <div className="flex justify-between pt-1">
                <button
                  onClick={() => setPreviewIdx((p) => Math.max(0, p - 1))}
                  disabled={previewIdx === 0}
                  className="text-[11px] font-bold text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  ← Prev Day
                </button>
                <button
                  onClick={() => setPreviewIdx((p) => Math.min((watchedModules?.length ?? 1) - 1, p + 1))}
                  disabled={previewIdx === (watchedModules?.length ?? 1) - 1}
                  className="text-[11px] font-bold text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next Day →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <PlayCircle size={28} className="text-gray-700 mx-auto" />
            <p className="text-xs text-gray-600">Add a module to see preview</p>
          </div>
        )}

        {/* Pro tip */}
        <div className="bg-gray-800/40 p-3.5 rounded-2xl space-y-2 border-t border-gray-800 pt-4">
          <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase">
            <Lightbulb size={13} /> Pro Tip
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Programs with at least 5 days have a 40% higher completion rate.
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  defaultValues?: Partial<Step3Data>;
  maxDays: number;
}

export default function Step3ModuleBuilder({ onNext, onBack, defaultValues, maxDays }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number>(0);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3MMPSchema),
    defaultValues: {
      modules: defaultValues?.modules?.length
        ? defaultValues.modules
        : [{ id: 1, title: "Introduction to Mindfulness", type: "video", videoUrl: "", instructions: "", actionTask: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "modules" });
  const watchedModules = useWatch({ control, name: "modules" });

  const persistToStorage = (values: Partial<Step3Data>) => {
    const stored = localStorage.getItem(MMP_STORAGE_KEY);
    const parsed: Partial<FullFormData> = stored ? (JSON.parse(stored) as Partial<FullFormData>) : {};
    localStorage.setItem(MMP_STORAGE_KEY, JSON.stringify({ ...parsed, step3: values }));
  };

  const reachedLimit = fields.length >= maxDays;

  const addModule = () => {
    if (reachedLimit) return;
    append({
      id: Date.now(),
      title: `Day ${fields.length + 1} Module`,
      type: "text",
      videoUrl: "",
      instructions: "",
      actionTask: "",
    });
    setExpandedIdx(fields.length);
  };

  const modulesRootError: string | undefined = errors.modules?.message;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 w-full space-y-6">
        <header className="mb-8">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            MINI-MASTERY PROGRAM CREATION
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">Daily Module Builder</h2>
        </header>

        {modulesRootError && (
          <p className="text-sm text-red-500 font-medium">{modulesRootError}</p>
        )}

        <form onSubmit={handleSubmit(onNext)} noValidate>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const modErrors: FieldErrors<ModuleData> | undefined = errors.modules?.[index];
              const hasError = !!modErrors && Object.keys(modErrors).length > 0;
              const isExpanded = expandedIdx === index;
              const moduleType = watchedModules?.[index]?.type;

              return (
                <div
                  key={field.id}
                  className={`border-2 rounded-3xl transition-all ${
                    isExpanded
                      ? hasError ? "border-red-300 p-6" : "border-blue-400 p-6"
                      : hasError ? "border-red-200 p-4 cursor-pointer" : "border-gray-100 p-4 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <div
                    className="flex items-center justify-between"
                    onClick={() => setExpandedIdx(isExpanded ? -1 : index)}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          isExpanded ? "bg-blue-500 text-white"
                          : hasError ? "bg-red-100 text-red-500"
                          : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {watchedModules?.[index]?.title || "Untitled Module"}
                        </h3>
                        {hasError && !isExpanded && modErrors && (
                          <p className="text-[11px] text-red-400 font-medium mt-0.5">
                            {getFirstModuleError(modErrors)}
                          </p>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                  {isExpanded && (
                    <div className="mt-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Module Title</label>
                          <input
                            {...register(`modules.${index}.title`, {
                              onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
                            })}
                            className={`w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 border ${
                              modErrors?.title
                                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                                : "border-transparent focus:ring-blue-400"
                            }`}
                          />
                          {modErrors?.title?.message && (
                            <p className="text-[11px] text-red-500 font-medium">{modErrors.title.message}</p>
                          )}
                        </div>

                        {/* Content Type */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Content Type</label>
                          <div className="flex gap-2">
                            {(["video", "text"] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setValue(`modules.${index}.type`, t, { shouldValidate: true });
                                  persistToStorage({ modules: watchedModules as ModuleData[] });
                                }}
                                className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                                  moduleType === t
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-100 text-gray-400"
                                }`}
                              >
                                {t === "video" ? <Video size={18} /> : <FileText size={18} />}
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Video URL */}
                      {moduleType === "video" && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Video URL</label>
                          <input
                            {...register(`modules.${index}.videoUrl`, {
                              onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
                            })}
                            placeholder="YouTube or Vimeo link"
                            className={`w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 border ${
                              modErrors?.videoUrl
                                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                                : "border-transparent focus:ring-blue-400"
                            }`}
                          />
                          {modErrors?.videoUrl?.message && (
                            <p className="text-[11px] text-red-500 font-medium">{modErrors.videoUrl.message}</p>
                          )}
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Content Area / Instructions
                        </label>
                        <textarea
                          {...register(`modules.${index}.instructions`, {
                            onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
                          })}
                          rows={4}
                          placeholder="Describe what participants should focus on today..."
                          className={`w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 resize-none border ${
                            modErrors?.instructions
                              ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                              : "border-transparent focus:ring-blue-400"
                          }`}
                        />
                        {modErrors?.instructions?.message && (
                          <p className="text-[11px] text-red-500 font-medium">{modErrors.instructions.message}</p>
                        )}
                      </div>

                      {/* Action Task */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Action Task</label>
                          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-bold uppercase tracking-tighter">
                            Mandatory
                          </span>
                        </div>
                        <textarea
                          {...register(`modules.${index}.actionTask`, {
                            onChange: () => persistToStorage({ modules: watchedModules as ModuleData[] }),
                          })}
                          rows={2}
                          placeholder="Ask a question or give a task..."
                          className={`w-full p-4 rounded-2xl outline-none focus:ring-2 resize-none border ${
                            modErrors?.actionTask
                              ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                              : "border-blue-100 bg-blue-50/30 focus:ring-blue-400"
                          }`}
                        />
                        {modErrors?.actionTask?.message && (
                          <p className="text-[11px] text-red-500 font-medium">{modErrors.actionTask.message}</p>
                        )}
                      </div>

                      {fields.length > 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              remove(index);
                              setExpandedIdx(0);
                              persistToStorage({ modules: watchedModules as ModuleData[] });
                            }}
                            className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors"
                          >
                            Remove this module
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addModule}
              disabled={reachedLimit}
              className={`w-full py-6 border-2 border-dashed rounded-3xl font-bold flex items-center justify-center gap-2 transition-all ${
                reachedLimit
                  ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50/50"
                  : "border-blue-200 text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Plus size={20} />
              {reachedLimit
                ? `Module limit reached (${maxDays} days max)`
                : `Add Day ${fields.length + 1}`}
            </button>
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
      </div>

      <SidebarPreview
        watchedModules={watchedModules}
        maxDays={maxDays}
        reachedLimit={reachedLimit}
        fields={fields}
      />
    </div>
  );
}