// "use client";

// import React, { useState, useCallback } from "react";
// import axios from "axios";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   Plus, Search, Filter, X, Eye, CheckCircle, XCircle,
//   RefreshCw, ChevronLeft, ChevronRight, Loader2,
//   BookOpen, AlertCircle,
// } from "lucide-react";
// import Link from "next/link";

// // ─── Types ────────────────────────────────────────────────────────────────────

// type ProgramStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED";

// interface Creator {
//   id: string;
//   name: string | null;
//   email: string | null;
//   image: string | null;
// }

// interface Program {
//   id: string;
//   name: string;
//   slug: string;
//   description: string | null;
//   durationDays: number | null;
//   price: number | null;
//   currency: string | null;
//   modules: unknown;
//   status: string | null;
//   isActive: boolean;
//   thumbnailUrl: string | null;
//   createdAt: string;
//   updatedAt: string;
//   creator: Creator | null;
// }

// interface Pagination {
//   page: number;
//   limit: number;
//   total: number;
//   totalPages: number;
// }

// interface ApiResponse {
//   programs: Program[];
//   pagination: Pagination;
// }

// // ─── Create form shape (mirrors FullFormData steps collapsed) ─────────────────

// interface CreateFormData {
//   // Step1
//   title:       string;
//   subtitle:    string;
//   duration:    "7 Days" | "14 Days" | "21 Days" | "30 Days";
//   unlockType:  "daily" | "all";
//   thumbnailUrl: string;
//   // Step2
//   achievements: string;   // comma separated — split on submit
//   // Step3 — admin enters raw JSON or we use a simple textarea
//   modulesJson: string;
//   // Step4
//   isPaid:    boolean;
//   price:     string;
//   currency:  "INR" | "USD";
//   // Step5
//   threshold:  number;
//   certTitle:  string;
//   // Status
//   status: ProgramStatus;
// }

// const DEFAULT_FORM: CreateFormData = {
//   title: "", subtitle: "", duration: "7 Days", unlockType: "daily", thumbnailUrl: "",
//   achievements: "",
//   modulesJson: "",
//   isPaid: false, price: "", currency: "INR",
//   threshold: 100, certTitle: "",
//   status: "PUBLISHED",
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const LIMIT = 10;

// const STATUS_CONFIG: Record<ProgramStatus, { label: string; color: string }> = {
//   PUBLISHED:    { label: "Published",    color: "bg-green-100 text-green-700"  },
//   UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-700"   },
//   DRAFT:        { label: "Draft",        color: "bg-gray-100 text-gray-600"   },
// };

// function formatPrice(price: number | null, currency: string | null): string {
//   if (!price || price === 0) return "Free";
//   return `${currency === "USD" ? "$" : "₹"}${price.toLocaleString()}`;
// }

// function moduleCount(modules: unknown): number {
//   return Array.isArray(modules) ? modules.length : 0;
// }

// function formatDate(iso: string): string {
//   return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
// }

// function convertToEmbedUrl(url: string): string {
//   if (!url) return url;
//   try {
//     const p = new URL(url);
//     if (p.pathname.includes("/embed/")) return url;
//     if (p.hostname.includes("youtube.com")) {
//       const v = p.searchParams.get("v");
//       if (v) return `https://www.youtube.com/embed/${v}`;
//     }
//     if (p.hostname.includes("youtu.be")) {
//       const v = p.pathname.replace("/", "");
//       if (v) return `https://www.youtube.com/embed/${v}`;
//     }
//     return url;
//   } catch { return url; }
// }

// // ─── API calls ────────────────────────────────────────────────────────────────

// async function fetchPrograms(page: number, status: string, search: string): Promise<ApiResponse> {
//   const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
//   if (status)  params.set("status", status);
//   if (search)  params.set("search", search);
//   const { data } = await axios.get<ApiResponse>(`/api/admin/mini-mastery-programs?${params}`);
//   return data;
// }

// async function patchStatus(id: string, status: ProgramStatus): Promise<void> {
//   await axios.patch("/api/admin/mini-mastery-programs", { id, status });
// }

// async function createProgram(payload: object): Promise<void> {
//   await axios.post("/api/admin/mini-mastery-programs/create", payload);
// }

// // ─── Skeleton rows ────────────────────────────────────────────────────────────

// function SkeletonRows() {
//   return (
//     <>
//       {[...Array(5)].map((_, i) => (
//         <tr key={i} className="animate-pulse">
//           <td className="px-4 py-4">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
//               <div className="space-y-2">
//                 <div className="h-3.5 w-40 bg-gray-100 rounded" />
//                 <div className="h-2.5 w-24 bg-gray-100 rounded" />
//               </div>
//             </div>
//           </td>
//           {[...Array(5)].map((_, j) => (
//             <td key={j} className="px-4 py-4"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
//           ))}
//         </tr>
//       ))}
//     </>
//   );
// }

// // ─── Create Modal ─────────────────────────────────────────────────────────────

// interface CreateModalProps {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// function CreateModal({ onClose, onSuccess }: CreateModalProps) {
//   const [form, setForm] = useState<CreateFormData>(DEFAULT_FORM);
//   const [formError, setFormError] = useState<string | null>(null);

//   const set = <K extends keyof CreateFormData>(k: K, v: CreateFormData[K]) =>
//     setForm((f) => ({ ...f, [k]: v }));

//   const mutation = useMutation({
//     mutationFn: async () => {
//       // Build modules from JSON textarea
//       let modules: unknown[];
//       try {
//         modules = JSON.parse(form.modulesJson || "[]") as unknown[];
//       } catch {
//         throw new Error("Modules JSON is invalid. Please check the format.");
//       }

//       const durationDays = parseInt(form.duration);

//       // Convert video URLs to embed
//       const processedModules = (modules as Array<{ type?: string; videoUrl?: string }>).map((m) => ({
//         ...m,
//         videoUrl: m.type === "video" && m.videoUrl ? convertToEmbedUrl(m.videoUrl) : m.videoUrl,
//       }));

//       const achievements = form.achievements
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean);

//       if (!achievements.length) throw new Error("Please add at least one achievement.");
//       if (!processedModules.length) throw new Error("Please add at least one module.");

//       const payload = {
//         name:                form.title,
//         description:         form.subtitle,
//         durationDays,
//         unlockType:          form.unlockType,
//         achievements,
//         modules:             processedModules,
//         price:               form.isPaid ? parseFloat(form.price) || 0 : 0,
//         currency:            form.currency,
//         completionThreshold: form.threshold,
//         certificateTitle:    form.certTitle,
//         thumbnailUrl:        form.thumbnailUrl || undefined,
//         status:              form.status,
//       };

//       await createProgram(payload);
//     },
//     onSuccess: () => { onSuccess(); onClose(); },
//     onError:   (err) => setFormError(err instanceof Error ? err.message : "Something went wrong."),
//   });

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

//         {/* Header */}
//         <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
//           <h3 className="text-lg font-bold text-gray-900">Create Mini-Mastery Program</h3>
//           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">×</button>
//         </div>

//         <div className="p-6 space-y-6">
//           {formError && (
//             <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
//               <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
//               <p className="text-sm text-red-600 font-medium">{formError}</p>
//             </div>
//           )}

//           {/* ── Step 1 ── */}
//           <div className="space-y-1">
//             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Step 1 — Program Basics</p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="md:col-span-2 space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Program Title *</label>
//               <input
//                 value={form.title}
//                 onChange={(e) => set("title", e.target.value)}
//                 placeholder="e.g. 7-Day Mindful Morning Rituals"
//                 className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//               />
//             </div>
//             <div className="md:col-span-2 space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Subtitle / Description *</label>
//               <textarea
//                 value={form.subtitle}
//                 onChange={(e) => set("subtitle", e.target.value)}
//                 rows={2}
//                 placeholder="Transformation promise..."
//                 className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
//               />
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
//               <select
//                 value={form.duration}
//                 onChange={(e) => set("duration", e.target.value as CreateFormData["duration"])}
//                 className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//               >
//                 {["7 Days", "14 Days", "21 Days", "30 Days"].map((d) => (
//                   <option key={d}>{d}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Unlock Type</label>
//               <div className="flex gap-2">
//                 {(["daily", "all"] as const).map((t) => (
//                   <button
//                     key={t} type="button"
//                     onClick={() => set("unlockType", t)}
//                     className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
//                       form.unlockType === t
//                         ? "border-blue-500 bg-blue-50 text-blue-700"
//                         : "border-gray-100 text-gray-400"
//                     }`}
//                   >
//                     {t === "daily" ? "Daily" : "All at once"}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <div className="md:col-span-2 space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Thumbnail URL <span className="text-gray-400 font-normal normal-case">(paste Supabase URL)</span></label>
//               <input
//                 value={form.thumbnailUrl}
//                 onChange={(e) => set("thumbnailUrl", e.target.value)}
//                 placeholder="https://..."
//                 className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//               />
//             </div>
//           </div>

//           {/* ── Step 2 ── */}
//           <div className="space-y-1 pt-2 border-t border-gray-50">
//             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Step 2 — Achievements</p>
//           </div>
//           <div className="space-y-1">
//             <label className="text-xs font-bold text-gray-500 uppercase">
//               Achievements <span className="text-gray-400 font-normal normal-case">(comma separated)</span>
//             </label>
//             <textarea
//               value={form.achievements}
//               onChange={(e) => set("achievements", e.target.value)}
//               rows={2}
//               placeholder="Master deep focus, Build consistent habits, Reduce digital distraction"
//               className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
//             />
//           </div>

//           {/* ── Step 3 ── */}
//           <div className="space-y-1 pt-2 border-t border-gray-50">
//             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Step 3 — Modules (JSON)</p>
//           </div>
//           <div className="space-y-1">
//             <label className="text-xs font-bold text-gray-500 uppercase">Modules JSON *</label>
//             <textarea
//               value={form.modulesJson}
//               onChange={(e) => set("modulesJson", e.target.value)}
//               rows={6}
//               placeholder={`[\n  {\n    "id": 1,\n    "title": "Day 1: Introduction",\n    "type": "video",\n    "videoUrl": "https://youtube.com/watch?v=...",\n    "instructions": "Watch and reflect.",\n    "actionTask": "Write your intention."\n  }\n]`}
//               className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-xs font-mono resize-none"
//             />
//             <p className="text-[10px] text-gray-400">Each module: id, title, type (video|text), videoUrl?, instructions, actionTask</p>
//           </div>

//           {/* ── Step 4 ── */}
//           <div className="space-y-1 pt-2 border-t border-gray-50">
//             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Step 4 — Pricing</p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
//               <div className="flex gap-2">
//                 {([false, true] as const).map((isPaid) => (
//                   <button
//                     key={String(isPaid)} type="button"
//                     onClick={() => set("isPaid", isPaid)}
//                     className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
//                       form.isPaid === isPaid
//                         ? "border-blue-500 bg-blue-50 text-blue-700"
//                         : "border-gray-100 text-gray-400"
//                     }`}
//                   >
//                     {isPaid ? "Paid" : "Free"}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             {form.isPaid && (
//               <>
//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">Currency</label>
//                   <div className="flex gap-2">
//                     {(["INR", "USD"] as const).map((c) => (
//                       <button
//                         key={c} type="button"
//                         onClick={() => set("currency", c)}
//                         className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
//                           form.currency === c
//                             ? "border-blue-500 bg-blue-50 text-blue-700"
//                             : "border-gray-100 text-gray-400"
//                         }`}
//                       >
//                         {c === "INR" ? "₹ INR" : "$ USD"}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">Price *</label>
//                   <input
//                     type="number" min="0" value={form.price}
//                     onChange={(e) => set("price", e.target.value)}
//                     placeholder="499"
//                     className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//                   />
//                 </div>
//               </>
//             )}
//           </div>

//           {/* ── Step 5 ── */}
//           <div className="space-y-1 pt-2 border-t border-gray-50">
//             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Step 5 — Certificate</p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Completion Threshold (%)</label>
//               <input
//                 type="number" min="50" max="100" value={form.threshold}
//                 onChange={(e) => set("threshold", parseInt(e.target.value) || 100)}
//                 className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//               />
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs font-bold text-gray-500 uppercase">Certificate Title *</label>
//               <input
//                 value={form.certTitle}
//                 onChange={(e) => set("certTitle", e.target.value)}
//                 placeholder="Certificate of Completion"
//                 className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm"
//               />
//             </div>
//           </div>

//           {/* ── Publish status ── */}
//           <div className="pt-2 border-t border-gray-50 space-y-2">
//             <label className="text-xs font-bold text-gray-500 uppercase">Publish Status</label>
//             <div className="flex gap-2 flex-wrap">
//               {(["PUBLISHED", "UNDER_REVIEW", "DRAFT"] as ProgramStatus[]).map((s) => (
//                 <button
//                   key={s} type="button"
//                   onClick={() => set("status", s)}
//                   className={`px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
//                     form.status === s
//                       ? "border-blue-500 bg-blue-50 text-blue-700"
//                       : "border-gray-100 text-gray-400"
//                   }`}
//                 >
//                   {STATUS_CONFIG[s].label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Submit */}
//           <div className="pt-2">
//             <button
//               type="button"
//               onClick={() => mutation.mutate()}
//               disabled={mutation.isPending}
//               className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
//             >
//               {mutation.isPending ? (
//                 <><Loader2 size={16} className="animate-spin" /> Creating…</>
//               ) : (
//                 <><Plus size={16} /> Create Program</>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────

// export default function AdminMMPPage() {
//   const qc = useQueryClient();

//   const [page, setPage]           = useState(1);
//   const [statusFilter, setStatus] = useState<ProgramStatus | "">("");
//   const [search, setSearch]       = useState("");
//   const [searchInput, setSearchInput] = useState("");
//   const [showCreate, setShowCreate]   = useState(false);

//   const { data, isLoading, isError, refetch } = useQuery({
//     queryKey: ["admin-mmp", page, statusFilter, search],
//     queryFn:  () => fetchPrograms(page, statusFilter, search),
//     staleTime: 20_000,
//   });

//   const programs   = data?.programs   ?? [];
//   const pagination = data?.pagination;

//   // ── Status mutation ──────────────────────────────────────────────────────
//   const statusMutation = useMutation({
//     mutationFn: ({ id, status }: { id: string; status: ProgramStatus }) =>
//       patchStatus(id, status),
//     onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-mmp"] }),
//   });

//   const handleFilter = (s: ProgramStatus | "") => {
//     setStatus(s);
//     setPage(1);
//   };

//   const handleSearch = () => {
//     setSearch(searchInput);
//     setPage(1);
//   };

//   const clearSearch = () => {
//     setSearchInput("");
//     setSearch("");
//     setPage(1);
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow min-h-screen font-sans">

//       {/* ── Header ── */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//         <h2 className="text-xl font-semibold text-gray-900">Mini-Mastery Programs</h2>
//         <button
//           onClick={() => setShowCreate(true)}
//           className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm w-fit"
//         >
//           <Plus size={16} /> Create New Program
//         </button>
//       </div>

//       {/* ── Filters ── */}
//       <div className="mb-5 flex flex-wrap gap-3 items-center">
//         {/* Search */}
//         <div className="flex gap-2 flex-1 min-w-[200px]">
//           <div className="relative flex-1">
//             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search programs…"
//               value={searchInput}
//               onChange={(e) => setSearchInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleSearch()}
//               className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//             />
//           </div>
//           <button
//             onClick={handleSearch}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
//           >
//             Search
//           </button>
//           {search && (
//             <button
//               onClick={clearSearch}
//               className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"
//             >
//               <X size={14} />
//             </button>
//           )}
//         </div>

//         {/* Status filter */}
//         <select
//           value={statusFilter}
//           onChange={(e) => handleFilter(e.target.value as ProgramStatus | "")}
//           className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
//         >
//           <option value="">All Status</option>
//           <option value="UNDER_REVIEW">Under Review</option>
//           <option value="PUBLISHED">Published</option>
//           <option value="DRAFT">Draft</option>
//         </select>

//         {/* Refresh */}
//         <button
//           onClick={() => void refetch()}
//           disabled={isLoading}
//           className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-40"
//           title="Refresh"
//         >
//           <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
//         </button>

//         {/* Active filter badge */}
//         {(statusFilter || search) && (
//           <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
//             <Filter size={11} />
//             {statusFilter && <span>{STATUS_CONFIG[statusFilter].label}</span>}
//             {search && <span>"{search}"</span>}
//             <button onClick={() => { clearSearch(); handleFilter(""); }}>
//               <X size={11} className="ml-1" />
//             </button>
//           </div>
//         )}
//       </div>

//       {/* ── Table ── */}
//       {isError ? (
//         <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg text-sm font-medium">
//           <AlertCircle size={16} /> Failed to load programs. Please refresh.
//         </div>
//       ) : (
//         <div className="overflow-x-auto rounded-lg border border-gray-200">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 {["Program", "Status", "Creator", "Modules", "Price", "Created", "Actions"].map((h) => (
//                   <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {isLoading ? (
//                 <SkeletonRows />
//               ) : programs.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">
//                     {statusFilter || search
//                       ? "No programs match your filters."
//                       : "No programs found."}
//                   </td>
//                 </tr>
//               ) : (
//                 programs.map((prog) => {
//                   const statusKey = (prog.status ?? "DRAFT") as ProgramStatus;
//                   const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.DRAFT;
//                   const isProcessing = statusMutation.isPending &&
//                     (statusMutation.variables as { id: string })?.id === prog.id;

//                   return (
//                     <tr key={prog.id} className="hover:bg-gray-50/50 transition-colors group">

//                       {/* Program */}
//                       <td className="px-4 py-4">
//                         <div className="flex items-center gap-3">
//                           {prog.thumbnailUrl ? (
//                             <img
//                               src={prog.thumbnailUrl}
//                               alt={prog.name}
//                               className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
//                             />
//                           ) : (
//                             <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
//                               <BookOpen size={16} className="text-blue-500" />
//                             </div>
//                           )}
//                           <div>
//                             <p className="font-semibold text-gray-900 text-sm leading-tight">{prog.name}</p>
//                             <p className="text-[11px] text-gray-400 mt-0.5">
//                               {prog.durationDays ?? "?"} Days
//                             </p>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Status */}
//                       <td className="px-4 py-4">
//                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.color}`}>
//                           {cfg.label}
//                         </span>
//                       </td>

//                       {/* Creator */}
//                       <td className="px-4 py-4">
//                         <div className="flex items-center gap-2">
//                           {prog.creator?.image ? (
//                             <img src={prog.creator.image} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
//                           ) : (
//                             <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">
//                               {prog.creator?.name?.[0]?.toUpperCase() ?? "?"}
//                             </div>
//                           )}
//                           <span className="text-xs text-gray-600 font-medium">
//                             {prog.creator?.name ?? prog.creator?.email ?? "Unknown"}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Modules */}
//                       <td className="px-4 py-4 text-sm text-gray-600 font-medium">
//                         {moduleCount(prog.modules)}
//                       </td>

//                       {/* Price */}
//                       <td className="px-4 py-4 text-sm font-bold text-gray-800">
//                         {formatPrice(prog.price, prog.currency)}
//                       </td>

//                       {/* Created */}
//                       <td className="px-4 py-4 text-xs text-gray-500">
//                         {formatDate(prog.createdAt)}
//                       </td>

//                       {/* Actions */}
//                       <td className="px-4 py-4 whitespace-nowrap">
//                         <div className="flex items-center gap-1">
//                           {/* View */}
//                           <Link href={`/dashboard/mini-mastery-programs/${prog.id}`}>
//                             <button
//                               className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
//                               title="View"
//                             >
//                               <Eye size={15} />
//                             </button>
//                           </Link>

//                           {/* Approve → PUBLISHED */}
//                           <button
//                             onClick={() => statusMutation.mutate({ id: prog.id, status: "PUBLISHED" })}
//                             disabled={isProcessing || statusKey === "PUBLISHED"}
//                             className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
//                             title="Approve (Publish)"
//                           >
//                             {isProcessing && (statusMutation.variables as { status: string })?.status === "PUBLISHED"
//                               ? <Loader2 size={15} className="animate-spin" />
//                               : <CheckCircle size={15} />
//                             }
//                           </button>

//                           {/* Disapprove → UNDER_REVIEW */}
//                           <button
//                             onClick={() => statusMutation.mutate({ id: prog.id, status: "UNDER_REVIEW" })}
//                             disabled={isProcessing || statusKey === "UNDER_REVIEW"}
//                             className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
//                             title="Move back to Under Review"
//                           >
//                             {isProcessing && (statusMutation.variables as { status: string })?.status === "UNDER_REVIEW"
//                               ? <Loader2 size={15} className="animate-spin" />
//                               : <XCircle size={15} />
//                             }
//                           </button>

//                           {/* Draft */}
//                           <button
//                             onClick={() => statusMutation.mutate({ id: prog.id, status: "DRAFT" })}
//                             disabled={isProcessing || statusKey === "DRAFT"}
//                             className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-black"
//                             title="Move to Draft"
//                           >
//                             {isProcessing && (statusMutation.variables as { status: string })?.status === "DRAFT"
//                               ? <Loader2 size={15} className="animate-spin" />
//                               : <span className="text-[9px] font-black">D</span>
//                             }
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* ── Pagination ── */}
//       {pagination && pagination.totalPages > 1 && !isLoading && (
//         <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
//           <span className="text-sm text-gray-500">
//             Showing{" "}
//             <span className="font-bold text-gray-700">
//               {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)}
//             </span>{" "}
//             of <span className="font-bold text-gray-700">{pagination.total}</span> programs
//           </span>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page === 1}
//               className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
//             >
//               <ChevronLeft size={15} /> Prev
//             </button>
//             {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
//               .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
//               .reduce<(number | "...")[]>((acc, p, idx, arr) => {
//                 if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1)
//                   acc.push("...");
//                 acc.push(p);
//                 return acc;
//               }, [])
//               .map((p, i) =>
//                 p === "..." ? (
//                   <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
//                 ) : (
//                   <button
//                     key={p}
//                     onClick={() => setPage(p as number)}
//                     className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
//                       page === p ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-500 border border-gray-100"
//                     }`}
//                   >
//                     {p}
//                   </button>
//                 )
//               )}
//             <button
//               onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
//               disabled={page >= pagination.totalPages}
//               className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
//             >
//               Next <ChevronRight size={15} />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ── Create Modal ── */}
//       {showCreate && (
//         <CreateModal
//           onClose={() => setShowCreate(false)}
//           onSuccess={() => void qc.invalidateQueries({ queryKey: ["admin-mmp"] })}
//         />
//       )}
//     </div>
//   );
// }

"use client";

import React, { useState, useRef } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Filter, X, Eye, CheckCircle, XCircle,
  RefreshCw, ChevronLeft, ChevronRight, Loader2,
  BookOpen, AlertCircle, Upload, ImageIcon,
  Video, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgramStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED";

interface Creator {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Program {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationDays: number | null;
  price: number | null;
  currency: string | null;
  modules: unknown;
  status: string | null;
  isActive: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  creator: Creator | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  programs: Program[];
  pagination: Pagination;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIMIT = 10;

const STATUS_CONFIG: Record<ProgramStatus, { label: string; color: string }> = {
  PUBLISHED:    { label: "Published",    color: "bg-green-100 text-green-700"  },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-700"   },
  DRAFT:        { label: "Draft",        color: "bg-gray-100 text-gray-600"   },
};

function formatPrice(price: number | null, currency: string | null): string {
  if (!price || price === 0) return "Free";
  return `${currency === "USD" ? "$" : "₹"}${price.toLocaleString()}`;
}

function moduleCount(modules: unknown): number {
  return Array.isArray(modules) ? modules.length : 0;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function convertToEmbedUrl(url: string): string {
  if (!url) return url;
  try {
    const p = new URL(url);
    if (p.pathname.includes("/embed/")) return url;
    if (p.hostname.includes("youtube.com")) {
      const v = p.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (p.hostname.includes("youtu.be")) {
      const v = p.pathname.replace("/", "");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    return url;
  } catch { return url; }
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchPrograms(page: number, status: string, search: string): Promise<ApiResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (status)  params.set("status", status);
  if (search)  params.set("search", search);
  const { data } = await axios.get<ApiResponse>(`/api/admin/mini-mastery-programs?${params}`);
  return data;
}

async function patchStatus(id: string, status: ProgramStatus): Promise<void> {
  await axios.patch("/api/admin/mini-mastery-programs", { id, status });
}

async function createProgram(payload: object): Promise<void> {
  await axios.post("/api/admin/mini-mastery-programs/create", payload);
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
              <div className="space-y-2">
                <div className="h-3.5 w-40 bg-gray-100 rounded" />
                <div className="h-2.5 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          </td>
          {[...Array(5)].map((_, j) => (
            <td key={j} className="px-4 py-4"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Image Upload Hook (reuses existing /api/mini-mastery-programs/upload-thumbnail-image proxy) ──────────

function useImageUpload() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const uploadedPathRef = useRef<string | null>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_MB = 5;

  function extractFilePath(publicUrl: string): string | null {
    try {
      const marker = `/object/public/mini-mastery-program/`;
      const idx = publicUrl.indexOf(marker);
      return idx === -1 ? null : publicUrl.slice(idx + marker.length);
    } catch { return null; }
  }

  async function deleteOldFile(filePath: string) {
    try {
      await fetch("/api/mini-mastery-programs/upload-thumbnail-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
    } catch { /* non-fatal */ }
  }

  async function handleFile(file: File): Promise<string | null> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Only JPG, PNG, or WebP allowed.");
      return null;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`Max ${MAX_MB}MB allowed.`);
      return null;
    }
    if (uploadedPathRef.current) {
      void deleteOldFile(uploadedPathRef.current);
      uploadedPathRef.current = null;
    }
    setUploadError(null);
    setUploadState("uploading");
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "thumbnail-image");
      const res = await fetch("/api/mini-mastery-programs/upload-thumbnail-image", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { message?: string };
        console.log(res.status)
        throw new Error(j.message ?? "Upload failed");
      }
      const { url } = await res.json() as { url: string };
      uploadedPathRef.current = extractFilePath(url);
      setUploadState("success");
      return url;
    } catch (err) {
      setUploadState("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
      setPreviewUrl(null);
      return null;
    }
  }

  function reset() {
    if (uploadedPathRef.current) void deleteOldFile(uploadedPathRef.current);
    uploadedPathRef.current = null;
    setUploadState("idle");
    setUploadError(null);
    setPreviewUrl(null);
  }

  return { uploadState, uploadError, previewUrl, handleFile, reset };
}

// ─── Module row types ─────────────────────────────────────────────────────────

interface ModuleRow {
  id: number;
  title: string;
  type: "video" | "text";
  videoUrl: string;
  instructions: string;
  actionTask: string;
}

function emptyModule(id: number, idx: number): ModuleRow {
  return { id, title: `Day ${idx + 1} Module`, type: "text", videoUrl: "", instructions: "", actionTask: "" };
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateModal({ onClose, onSuccess }: CreateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgUpload    = useImageUpload();

  // ── Basic fields ──
  const [title,       setTitle]       = useState("");
  const [subtitle,    setSubtitle]    = useState("");
  const [duration,    setDuration]    = useState<"7 Days" | "14 Days" | "21 Days" | "30 Days">("7 Days");
  const [unlockType,  setUnlockType]  = useState<"daily" | "all">("daily");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // ── Achievements ──
  const [achievements, setAchievements] = useState<string[]>([""]);

  // ── Modules ──
  const maxDays = parseInt(duration);
  const [modules, setModules]       = useState<ModuleRow[]>([emptyModule(1, 0)]);
  const [expandedMod, setExpanded]  = useState<number>(0);

  // ── Pricing ──
  const [isPaid,    setIsPaid]    = useState(false);
  const [price,     setPrice]     = useState("");
  const [currency,  setCurrency]  = useState<"INR" | "USD">("INR");

  // ── Certificate ──
  const [threshold, setThreshold] = useState(100);
  const [certTitle, setCertTitle] = useState("");

  // ── Status ──
  const [status, setStatus] = useState<ProgramStatus>("PUBLISHED");

  // ── Error ──
  const [formError, setFormError] = useState<string | null>(null);

  // keep modules in sync when duration changes
  React.useEffect(() => {
    setModules((prev) => {
      if (prev.length > maxDays) return prev.slice(0, maxDays);
      if (prev.length < maxDays) {
        return [
          ...prev,
          ...Array.from({ length: maxDays - prev.length }, (_, i) =>
            emptyModule(Date.now() + i, prev.length + i)
          ),
        ];
      }
      return prev;
    });
  }, [maxDays]);

  const updateMod = <K extends keyof ModuleRow>(idx: number, key: K, val: ModuleRow[K]) =>
    setModules((ms) => ms.map((m, i) => i === idx ? { ...m, [key]: val } : m));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim())     throw new Error("Program title is required.");
      if (!subtitle.trim())  throw new Error("Subtitle / description is required.");
      if (!certTitle.trim()) throw new Error("Certificate title is required.");

      const cleanAchievements = achievements.map((a) => a.trim()).filter(Boolean);
      if (!cleanAchievements.length) throw new Error("Add at least one achievement.");

      // validate modules
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        if (!m.title.trim())        throw new Error(`Day ${i + 1}: Module title is required.`);
        if (!m.instructions.trim()) throw new Error(`Day ${i + 1}: Instructions are required.`);
        if (!m.actionTask.trim())   throw new Error(`Day ${i + 1}: Action task is required.`);
        if (m.type === "video" && !m.videoUrl.trim())
          throw new Error(`Day ${i + 1}: Video URL is required for video type.`);
      }

      if (isPaid && (!price || parseFloat(price) <= 0))
        throw new Error("Please enter a valid price.");

      const processedModules = modules.map((m) => ({
        id:           m.id,
        title:        m.title,
        type:         m.type,
        videoUrl:     m.type === "video" ? convertToEmbedUrl(m.videoUrl) : undefined,
        instructions: m.instructions,
        actionTask:   m.actionTask,
      }));

      await createProgram({
        name:                title,
        description:         subtitle,
        durationDays:        parseInt(duration),
        unlockType,
        achievements:        cleanAchievements,
        modules:             processedModules,
        price:               isPaid ? parseFloat(price) : 0,
        currency,
        completionThreshold: threshold,
        certificateTitle:    certTitle,
        thumbnailUrl:        thumbnailUrl || undefined,
        status,
      });
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError:   (err) => setFormError(err instanceof Error ? err.message : "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900">Create Mini-Mastery Program</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">×</button>
        </div>

        <div className="p-6 space-y-8">

          {/* Error banner */}
          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600 font-medium">{formError}</p>
            </div>
          )}

          {/* ── Step 1: Basics ── */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 1 — Program Basics
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Program Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 7-Day Mindful Morning Rituals"
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Subtitle / Description *</label>
              <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                rows={2} placeholder="Transformation promise..."
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value as typeof duration)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  {["7 Days", "14 Days", "21 Days", "30 Days"].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Unlock Type</label>
                <div className="flex gap-2">
                  {(["daily", "all"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setUnlockType(t)}
                      className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                        unlockType === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                      }`}>
                      {t === "daily" ? "Daily" : "All at once"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Thumbnail upload */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Thumbnail <span className="text-gray-400 font-normal normal-case">Optional</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await imgUpload.handleFile(file);
                  if (url) setThumbnailUrl(url);
                  e.target.value = "";
                }} />

              {imgUpload.previewUrl ? (
                <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden border border-gray-100 group">
                  <img src={imgUpload.previewUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={imgUpload.uploadState === "uploading"}
                      className="bg-white text-gray-900 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                      <Upload size={12} /> Change
                    </button>
                    <button type="button"
                      onClick={() => { imgUpload.reset(); setThumbnailUrl(""); }}
                      disabled={imgUpload.uploadState === "uploading"}
                      className="bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
                      <X size={12} /> Remove
                    </button>
                  </div>
                  {imgUpload.uploadState === "uploading" && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={imgUpload.uploadState === "uploading"}
                  className="w-full aspect-[16/7] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2 transition-all disabled:cursor-not-allowed">
                  {imgUpload.uploadState === "uploading" ? (
                    <><Loader2 size={20} className="animate-spin text-blue-500" /><p className="text-xs font-bold text-blue-500">Uploading...</p></>
                  ) : (
                    <><div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"><ImageIcon size={18} className="text-gray-400" /></div>
                    <p className="text-xs font-bold text-gray-500">Click to upload thumbnail</p>
                    <p className="text-[10px] text-gray-400">JPG, PNG or WebP · Max 5MB</p></>
                  )}
                </button>
              )}
              {imgUpload.uploadError && <p className="text-[11px] text-red-500 font-medium">{imgUpload.uploadError}</p>}
            </div>
          </section>

          {/* ── Step 2: Achievements ── */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 2 — Achievements
            </p>
            <div className="space-y-2">
              {achievements.map((ach, i) => (
                <div key={i} className="flex gap-2">
                  <input value={ach}
                    onChange={(e) => setAchievements((prev) => prev.map((a, j) => j === i ? e.target.value : a))}
                    placeholder={`Achievement ${i + 1}`}
                    className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                  {achievements.length > 1 && (
                    <button type="button"
                      onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {achievements.length < 10 && (
                <button type="button"
                  onClick={() => setAchievements((prev) => [...prev, ""])}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  <Plus size={14} /> Add Achievement
                </button>
              )}
            </div>
          </section>

          {/* ── Step 3: Modules ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Step 3 — Modules ({modules.length}/{maxDays} days)
              </p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                modules.length >= maxDays ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
              }`}>
                {modules.length >= maxDays ? "Complete" : `${maxDays - modules.length} left`}
              </span>
            </div>

            <div className="space-y-2">
              {modules.map((mod, idx) => {
                const isOpen = expandedMod === idx;
                return (
                  <div key={mod.id}
                    className={`border-2 rounded-2xl transition-all ${
                      isOpen ? "border-blue-400 p-4" : "border-gray-100 p-3 cursor-pointer hover:bg-gray-50"
                    }`}>
                    {/* Row header */}
                    <div className="flex items-center justify-between" onClick={() => setExpanded(isOpen ? -1 : idx)}>
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          isOpen ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}>{idx + 1}</span>
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">
                          {mod.title || "Untitled Module"}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          mod.type === "video" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                        }`}>
                          {mod.type.toUpperCase()}
                        </span>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>

                    {/* Expanded fields */}
                    {isOpen && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Module Title *</label>
                            <input value={mod.title}
                              onChange={(e) => updateMod(idx, "title", e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                          </div>

                          {/* Content type toggle */}
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Content Type</label>
                            <div className="flex gap-2">
                              {(["video", "text"] as const).map((t) => (
                                <button key={t} type="button" onClick={() => updateMod(idx, "type", t)}
                                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    mod.type === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                                  }`}>
                                  {t === "video" ? <><Video size={13} /> Video</> : <><FileText size={13} /> Text</>}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Video URL */}
                          {mod.type === "video" && (
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">YouTube URL *</label>
                              <input value={mod.videoUrl}
                                onChange={(e) => updateMod(idx, "videoUrl", e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                            </div>
                          )}

                          {/* Instructions */}
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Instructions *</label>
                            <textarea value={mod.instructions}
                              onChange={(e) => updateMod(idx, "instructions", e.target.value)}
                              rows={3} placeholder="What should participants focus on today?"
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none" />
                          </div>

                          {/* Action Task */}
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                              Action Task * <span className="text-blue-500 font-black">Mandatory</span>
                            </label>
                            <textarea value={mod.actionTask}
                              onChange={(e) => updateMod(idx, "actionTask", e.target.value)}
                              rows={2} placeholder="Ask a question or assign a task..."
                              className="w-full p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Step 4: Pricing ── */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 4 — Pricing
            </p>
            <div className="flex gap-3">
              {([false, true] as const).map((paid) => (
                <button key={String(paid)} type="button" onClick={() => setIsPaid(paid)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    isPaid === paid ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                  }`}>
                  {paid ? "Paid" : "Free"}
                </button>
              ))}
            </div>
            {isPaid && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Currency</label>
                  <div className="flex gap-2">
                    {(["INR", "USD"] as const).map((c) => (
                      <button key={c} type="button" onClick={() => setCurrency(c)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                          currency === c ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                        }`}>
                        {c === "INR" ? "₹ INR" : "$ USD"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Price *</label>
                  <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="499"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              </div>
            )}
          </section>

          {/* ── Step 5: Certificate ── */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Step 5 — Certificate
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Completion Threshold (%)</label>
                <input type="number" min="50" max="100" value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value) || 100)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Certificate Title *</label>
                <input value={certTitle} onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="Certificate of Completion"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
            </div>
          </section>

          {/* ── Publish Status ── */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 pb-2">
              Publish Status
            </p>
            <div className="flex gap-2 flex-wrap">
              {(["PUBLISHED", "UNDER_REVIEW", "DRAFT"] as ProgramStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    status === s ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-400"
                  }`}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </section>

          {/* Submit */}
          <button type="button" onClick={() => { setFormError(null); mutation.mutate(); }}
            disabled={mutation.isPending || imgUpload.uploadState === "uploading"}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
            {mutation.isPending
              ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
              : <><Plus size={16} /> Create Program</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMMPPage() {
  const qc = useQueryClient();

  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState<ProgramStatus | "">("");
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showCreate, setShowCreate]   = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-mmp", page, statusFilter, search],
    queryFn:  () => fetchPrograms(page, statusFilter, search),
    staleTime: 20_000,
  });

  const programs   = data?.programs   ?? [];
  const pagination = data?.pagination;

  // ── Status mutation ──────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProgramStatus }) =>
      patchStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-mmp"] }),
  });

  const handleFilter = (s: ProgramStatus | "") => {
    setStatus(s);
    setPage(1);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow min-h-screen font-sans">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Mini-Mastery Programs</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm w-fit"
        >
          <Plus size={16} /> Create New Program
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="mb-5 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Search
          </button>
          {search && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleFilter(e.target.value as ProgramStatus | "")}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">All Status</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>

        {/* Refresh */}
        <button
          onClick={() => void refetch()}
          disabled={isLoading}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
        </button>

        {/* Active filter badge */}
        {(statusFilter || search) && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
            <Filter size={11} />
            {statusFilter && <span>{STATUS_CONFIG[statusFilter].label}</span>}
            {search && <span>{search}</span>}
            <button onClick={() => { clearSearch(); handleFilter(""); }}>
              <X size={11} className="ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      {isError ? (
        <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg text-sm font-medium">
          <AlertCircle size={16} /> Failed to load programs. Please refresh.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Program", "Status", "Creator", "Modules", "Price", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <SkeletonRows />
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">
                    {statusFilter || search
                      ? "No programs match your filters."
                      : "No programs found."}
                  </td>
                </tr>
              ) : (
                programs.map((prog) => {
                  const statusKey = (prog.status ?? "DRAFT") as ProgramStatus;
                  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.DRAFT;
                  const isProcessing = statusMutation.isPending &&
                    (statusMutation.variables as { id: string })?.id === prog.id;

                  return (
                    <tr key={prog.id} className="hover:bg-gray-50/50 transition-colors group">

                      {/* Program */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {prog.thumbnailUrl ? (
                            <img
                              src={prog.thumbnailUrl}
                              alt={prog.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                              <BookOpen size={16} className="text-blue-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight">{prog.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {prog.durationDays ?? "?"} Days
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Creator */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {prog.creator?.image ? (
                            <img src={prog.creator.image} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">
                              {prog.creator?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <span className="text-xs text-gray-600 font-medium">
                            {prog.creator?.name ?? prog.creator?.email ?? "Unknown"}
                          </span>
                        </div>
                      </td>

                      {/* Modules */}
                      <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                        {moduleCount(prog.modules)}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 text-sm font-bold text-gray-800">
                        {formatPrice(prog.price, prog.currency)}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {formatDate(prog.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <Link href={`/dashboard/mini-mastery-programs/${prog.id}`}>
                            <button
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye size={15} />
                            </button>
                          </Link>

                          {/* Approve → PUBLISHED */}
                          <button
                            onClick={() => statusMutation.mutate({ id: prog.id, status: "PUBLISHED" })}
                            disabled={isProcessing || statusKey === "PUBLISHED"}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Approve (Publish)"
                          >
                            {isProcessing && (statusMutation.variables as { status: string })?.status === "PUBLISHED"
                              ? <Loader2 size={15} className="animate-spin" />
                              : <CheckCircle size={15} />
                            }
                          </button>

                          {/* Disapprove → UNDER_REVIEW */}
                          <button
                            onClick={() => statusMutation.mutate({ id: prog.id, status: "UNDER_REVIEW" })}
                            disabled={isProcessing || statusKey === "UNDER_REVIEW"}
                            className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move back to Under Review"
                          >
                            {isProcessing && (statusMutation.variables as { status: string })?.status === "UNDER_REVIEW"
                              ? <Loader2 size={15} className="animate-spin" />
                              : <XCircle size={15} />
                            }
                          </button>

                          {/* Draft */}
                          <button
                            onClick={() => statusMutation.mutate({ id: prog.id, status: "DRAFT" })}
                            disabled={isProcessing || statusKey === "DRAFT"}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-black"
                            title="Move to Draft"
                          >
                            {isProcessing && (statusMutation.variables as { status: string })?.status === "DRAFT"
                              ? <Loader2 size={15} className="animate-spin" />
                              : <span className="text-[9px] font-black">D</span>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-bold text-gray-700">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)}
            </span>{" "}
            of <span className="font-bold text-gray-700">{pagination.total}</span> programs
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1)
                  acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                      page === p ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-500 border border-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => void qc.invalidateQueries({ queryKey: ["admin-mmp"] })}
        />
      )}
    </div>
  );
}