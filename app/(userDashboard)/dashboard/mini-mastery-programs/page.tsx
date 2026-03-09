// // // import React from 'react';
// // // import { ChevronDown, ArrowUpDown, Sparkles, Zap } from 'lucide-react';
// // // import Link from 'next/link';

// // // const Page = () => {
// // //   const categories = ["Free", "Paid", "Duration", "Category"];

// // //   const programs = [
// // //     { id: 1, title: "Mindfulness 101", coach: "Coach Sarah", duration: "11 Days", price: "₹299", Enrolled: "450+", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400", isPaid: true },
// // //     { id: 2, title: "High-Performance Habits", coach: "Coach James", duration: "7 Days", price: "FREE", Enrolled: "820+", image: "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?auto=format&fit=crop&q=80&w=400", isPaid: false },
// // //     { id: 3, title: "Public Speaking Pro", coach: "Coach Elena", duration: "14 Days", price: "₹499", Enrolled: "310+", image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=400", isPaid: true },
// // //     { id: 4, title: "Financial Literacy", coach: "Coach Raj", duration: "10 Days", price: "FREE", Enrolled: "1.2k+", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400", isPaid: false },
// // //     { id: 5, title: "Energy Blueprint", coach: "Coach Mia", duration: "5 Days", price: "FREE", Enrolled: "670+", image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=400", isPaid: false },
// // //     { id: 6, title: "Creative Coding", coach: "Coach Alex", duration: "21 Days", price: "₹999", Enrolled: "240+", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400", isPaid: true },
// // //   ];

// // //   return (
// // //     <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 max-w-7xl mx-auto font-sans">
// // //       {/* Header Section */}
// // //       <header className="mb-12 space-y-6">
// // //         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
// // //           <div className="space-y-3">
// // //             <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">
// // //               <Sparkles size={14} />
// // //               <span>SGE Discovery</span>
// // //             </div>
// // //             <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
// // //               Mini-Mastery Programs
// // //             </h1>
// // //             <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl leading-relaxed">
// // //               Bite-sized daily transformations. Expert-led skills in under 15 minutes a day.
// // //             </p>
// // //           </div>

// // //           <div className="bg-white px-4 py-2.5 rounded-2xl text-[11px] font-bold text-slate-600 flex items-center gap-3 shadow-sm border border-slate-100 self-start md:mb-1">
// // //             <div className="flex -space-x-2">
// // //               {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
// // //             </div>
// // //             <span>Join <span className="text-blue-600 font-black">1,200+</span> growing members</span>
// // //           </div>
// // //         </div>
// // //       </header>

// // //       {/* Filters & Sorting */}
// // //       <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
// // //         <div className="flex flex-wrap gap-2">
// // //           {categories.map((cat) => (
// // //             <button key={cat} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all border border-slate-200 shadow-sm active:scale-95">
// // //               {cat} <ChevronDown size={12} className="text-slate-400" />
// // //             </button>
// // //           ))}
// // //         </div>
// // //         <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">
// // //           Sort: <span className="text-slate-900 font-black uppercase tracking-tighter">Popularity</span> <ArrowUpDown size={12} />
// // //         </button>
// // //       </div>

// // //       {/* Program Grid */}
// // //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// // //         {programs.map((prog, idx) => (
// // //           <div key={idx} className="group flex flex-col bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden relative">
            
// // //             {/* Image & Badges */}
// // //             <div className="relative aspect-[16/10] overflow-hidden">
// // //               <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
// // //               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-60" />
              
// // //               <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-900 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-sm flex items-center gap-1">
// // //                 <Zap size={10} className="text-blue-500 fill-blue-500" /> {prog.duration}
// // //               </div>
              
// // //               <div className={`absolute top-3 right-3 ${prog.isPaid ? 'bg-blue-500' : 'bg-slate-900'} text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg`}>
// // //                 {prog.price}
// // //               </div>
// // //             </div>

// // //             {/* Content */}
// // //             <div className="p-5 flex flex-col flex-1 space-y-4">
// // //               <div className="space-y-1.5">
// // //                 <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">{prog.title}</h3>
// // //                 <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
// // //                   Experience a complete transformation with expert-guided sessions designed for your busy lifestyle.
// // //                 </p>
// // //               </div>

// // //               <div className="flex items-center justify-between border-y border-slate-50 py-3">
// // //                 <div className="flex items-center gap-2">
// // //                   <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200" /> 
// // //                   <span className="text-[10px] font-bold text-slate-400 italic">{prog.coach}</span>
// // //                 </div>
// // //                 <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">
// // //                    {prog.Enrolled} Enrolled
// // //                 </div>
// // //               </div>

// // //               {/* Action Buttons - Horizontal Layout */}
// // //               <div className="flex gap-2 pt-1">
// // //                 <Link href={`/dashboard/mini-mastery-programs/enroll/${prog.id}`} className="flex-[2]">
// // //                   <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100">
// // //                     Enroll
// // //                   </button>
// // //                 </Link>
// // //                 <Link href={`/dashboard/mini-mastery-programs/${prog.id}`} className="flex-1">
// // //                   <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60">
// // //                     Info
// // //                   </button>
// // //                 </Link>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         ))}
// // //       </div>

// // //       {/* Footer Load More */}
// // //       <div className="mt-20 flex flex-col items-center gap-4">
// // //         <button className="px-8 py-3.5 border-2 border-slate-200 text-slate-900 text-xs font-black rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-sm">
// // //           Load More Programs
// // //         </button>
// // //         <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Showing 6 of 42 programs</p>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default Page;
// // "use client";

// // import React, { useState } from "react";
// // import axios from "axios";
// // import { useQuery, keepPreviousData } from "@tanstack/react-query";
// // import {
// //   ChevronDown, ArrowUpDown, Sparkles,
// //   Loader2, ServerCrash, ChevronLeft, ChevronRight,
// //   SlidersHorizontal, X, BookOpen,
// // } from "lucide-react";
// // import Link from "next/link";

// // // ─── Types ────────────────────────────────────────────────────────────────────

// // interface Creator {
// //   id: string;
// //   name: string;
// //   image: string | null;
// // }

// // interface Program {
// //   id: string;
// //   name: string;
// //   slug: string;
// //   description: string | null;
// //   durationDays: number | null;
// //   unlockType: string | null;
// //   price: number | null;
// //   currency: string | null;
// //   achievements: unknown;
// //   modules: unknown;
// //   status: string | null;
// //   isActive: boolean;
// //   createdAt: string;
// //   creator: Creator | null;
// // }

// // interface Pagination {
// //   page: number;
// //   limit: number;
// //   total: number;
// //   totalPages: number;
// // }

// // interface ApiResponse {
// //   programs: Program[];
// //   pagination: Pagination;
// // }

// // // ─── Filter types ─────────────────────────────────────────────────────────────

// // type PricingFilter  = "all" | "free" | "paid";
// // type DurationFilter = "all" | "7" | "14" | "21" | "30";
// // type SortOption     = "newest" | "price_asc" | "price_desc";

// // interface Filters {
// //   pricing:  PricingFilter;
// //   duration: DurationFilter;
// //   sort:     SortOption;
// // }

// // // ─── Helpers ──────────────────────────────────────────────────────────────────

// // const LIMIT = 9;

// // function formatPrice(price: number | null, currency: string | null): string {
// //   if (!price || price === 0) return "FREE";
// //   const symbol = currency === "USD" ? "$" : "₹";
// //   return `${symbol}${price.toLocaleString("en-IN")}`;
// // }

// // function moduleCount(modules: unknown): number {
// //   return Array.isArray(modules) ? modules.length : 0;
// // }

// // const SORT_LABELS: Record<SortOption, string> = {
// //   newest:     "Newest",
// //   price_asc:  "Price: Low → High",
// //   price_desc: "Price: High → Low",
// // };

// // const DURATION_OPTIONS: { label: string; value: DurationFilter }[] = [
// //   { label: "Any Duration", value: "all" },
// //   { label: "7 Days",       value: "7"   },
// //   { label: "14 Days",      value: "14"  },
// //   { label: "21 Days",      value: "21"  },
// //   { label: "30 Days",      value: "30"  },
// // ];

// // // Gradient palettes cycled per card index — replaces image
// // const CARD_GRADIENTS = [
// //   "from-blue-500 via-blue-600 to-indigo-700",
// //   "from-violet-500 via-purple-600 to-purple-800",
// //   "from-emerald-400 via-teal-500 to-cyan-700",
// //   "from-orange-400 via-rose-500 to-pink-600",
// //   "from-amber-400 via-orange-500 to-red-600",
// //   "from-sky-400 via-blue-500 to-blue-700",
// //   "from-fuchsia-500 via-pink-500 to-rose-600",
// //   "from-lime-400 via-green-500 to-emerald-700",
// //   "from-indigo-400 via-violet-500 to-purple-700",
// // ] as const;

// // // Large background letter from program name — used as decorative element
// // function getBgLetter(name: string): string {
// //   return name.trim()[0]?.toUpperCase() ?? "M";
// // }

// // // ─── API fetcher ──────────────────────────────────────────────────────────────

// // async function fetchPublicPrograms(
// //   page: number,
// //   filters: Filters,
// // ): Promise<ApiResponse> {
// //   const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
// //   if (filters.pricing  !== "all") params.set("pricing",  filters.pricing);
// //   if (filters.duration !== "all") params.set("duration", filters.duration);
// //   params.set("sort", filters.sort);

// //   const { data } = await axios.get<ApiResponse>(
// //     `/api/mini-mastery-programs/public?${params.toString()}`,
// //   );
// //   return data;
// // }

// // // ─── Skeleton card ────────────────────────────────────────────────────────────

// // function SkeletonCard() {
// //   return (
// //     <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden animate-pulse">
// //       <div className="h-[140px] bg-slate-100" />
// //       <div className="p-5 space-y-4">
// //         <div className="space-y-2">
// //           <div className="h-4 w-3/4 bg-slate-100 rounded-lg" />
// //           <div className="h-3 w-full bg-slate-100 rounded-lg" />
// //           <div className="h-3 w-2/3 bg-slate-100 rounded-lg" />
// //         </div>
// //         <div className="flex justify-between items-center py-3 border-y border-slate-50">
// //           <div className="h-3 w-24 bg-slate-100 rounded" />
// //           <div className="h-3 w-16 bg-slate-100 rounded" />
// //         </div>
// //         <div className="flex gap-2 pt-1">
// //           <div className="flex-[2] h-10 bg-slate-100 rounded-xl" />
// //           <div className="flex-1 h-10 bg-slate-100 rounded-xl" />
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Dropdown ─────────────────────────────────────────────────────────────────

// // interface DropdownProps<T extends string> {
// //   label: string;
// //   value: T;
// //   options: { label: string; value: T }[];
// //   onChange: (v: T) => void;
// // }

// // function Dropdown<T extends string>({ label, value, options, onChange }: DropdownProps<T>) {
// //   const [open, setOpen] = useState(false);
// //   const active = options.find((o) => o.value === value);

// //   return (
// //     <div className="relative">
// //       <button
// //         onClick={() => setOpen((o) => !o)}
// //         className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${
// //           open
// //             ? "bg-slate-900 text-white border-slate-900"
// //             : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
// //         }`}
// //       >
// //         {active?.label ?? label}
// //         <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
// //       </button>

// //       {open && (
// //         <>
// //           <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
// //           <div className="absolute top-full mt-2 left-0 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden w-44 py-1">
// //             {options.map((opt) => (
// //               <button
// //                 key={opt.value}
// //                 onClick={() => { onChange(opt.value); setOpen(false); }}
// //                 className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
// //                   value === opt.value
// //                     ? "bg-blue-50 text-blue-700"
// //                     : "hover:bg-slate-50 text-slate-600"
// //                 }`}
// //               >
// //                 {opt.label}
// //               </button>
// //             ))}
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }

// // // ─── Page ─────────────────────────────────────────────────────────────────────

// // export default function EnrollPage() {
// //   const [page, setPage]       = useState(1);
// //   const [filters, setFilters] = useState<Filters>({
// //     pricing:  "all",
// //     duration: "all",
// //     sort:     "newest",
// //   });
// //   const [sortOpen, setSortOpen] = useState(false);

// //   const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => {
// //     setFilters((f) => ({ ...f, [key]: val }));
// //     setPage(1);
// //   };

// //   const clearFilters = () => {
// //     setFilters({ pricing: "all", duration: "all", sort: "newest" });
// //     setPage(1);
// //   };

// //   const hasActiveFilters = filters.pricing !== "all" || filters.duration !== "all";

// //   const { data, isLoading, isError, error } = useQuery({
// //     queryKey: ["mmp-enroll", page, filters],
// //     queryFn: () => fetchPublicPrograms(page, filters),
// //     placeholderData: keepPreviousData,
// //     staleTime: 30_000,
// //   });

// //   const programs    = data?.programs    ?? [];
// //   const pagination  = data?.pagination;

// //   return (
// //     <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 max-w-7xl mx-auto font-sans">

// //       {/* ── Header ─────────────────────────────────────────────────────────── */}
// //       <header className="mb-12 space-y-6">
// //         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
// //           <div className="space-y-3">
// //             <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">
// //               <Sparkles size={14} /> SGE Discovery
// //             </div>
// //             <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
// //               Mini-Mastery Programs
// //             </h1>
// //             <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl leading-relaxed">
// //               Bite-sized daily transformations. Expert-led skills in under 15 minutes a day.
// //             </p>
// //           </div>

// //           <div className="bg-white px-4 py-2.5 rounded-2xl text-[11px] font-bold text-slate-600 flex items-center gap-3 shadow-sm border border-slate-100 self-start md:mb-1">
// //             <div className="flex -space-x-2">
// //               {[1, 2, 3].map((i) => (
// //                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
// //               ))}
// //             </div>
// //             <span>Join <span className="text-blue-600 font-black">1,200+</span> growing members</span>
// //           </div>
// //         </div>
// //       </header>

// //       {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
// //       <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
// //         <div className="flex flex-wrap items-center gap-2">
// //           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
// //             <SlidersHorizontal size={12} /> Filters
// //           </div>

// //           {/* Pricing filter */}
// //           <Dropdown<PricingFilter>
// //             label="Pricing"
// //             value={filters.pricing}
// //             options={[
// //               { label: "All Pricing", value: "all"  },
// //               { label: "Free Only",   value: "free" },
// //               { label: "Paid Only",   value: "paid" },
// //             ]}
// //             onChange={(v) => setFilter("pricing", v)}
// //           />

// //           {/* Duration filter */}
// //           <Dropdown<DurationFilter>
// //             label="Duration"
// //             value={filters.duration}
// //             options={DURATION_OPTIONS}
// //             onChange={(v) => setFilter("duration", v)}
// //           />

// //           {/* Clear filters pill */}
// //           {hasActiveFilters && (
// //             <button
// //               onClick={clearFilters}
// //               className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
// //             >
// //               <X size={10} /> Clear
// //             </button>
// //           )}

// //           {/* Total count */}
// //           {!isLoading && pagination && (
// //             <span className="text-[10px] font-bold text-slate-400 ml-1">
// //               {pagination.total} programs
// //             </span>
// //           )}
// //         </div>

// //         {/* Sort */}
// //         <div className="relative">
// //           <button
// //             onClick={() => setSortOpen((o) => !o)}
// //             className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
// //           >
// //             Sort:{" "}
// //             <span className="text-slate-900 font-black uppercase tracking-tighter">
// //               {SORT_LABELS[filters.sort]}
// //             </span>
// //             <ArrowUpDown size={12} />
// //           </button>

// //           {sortOpen && (
// //             <>
// //               <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
// //               <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden w-48 py-1">
// //                 {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
// //                   <button
// //                     key={s}
// //                     onClick={() => { setFilter("sort", s); setSortOpen(false); }}
// //                     className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
// //                       filters.sort === s
// //                         ? "bg-blue-50 text-blue-700"
// //                         : "hover:bg-slate-50 text-slate-600"
// //                     }`}
// //                   >
// //                     {SORT_LABELS[s]}
// //                   </button>
// //                 ))}
// //               </div>
// //             </>
// //           )}
// //         </div>
// //       </div>

// //       {/* ── Error state ─────────────────────────────────────────────────────── */}
// //       {isError && (
// //         <div className="flex flex-col items-center gap-3 py-24 text-center">
// //           <ServerCrash size={36} className="text-slate-300" />
// //           <p className="text-slate-500 font-bold text-sm">
// //             {axios.isAxiosError(error) && error.response?.data
// //               ? (error.response.data as { message?: string }).message ?? "Something went wrong."
// //               : "Could not load programs. Please try again."}
// //           </p>
// //           <button
// //             onClick={() => setPage(1)}
// //             className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all"
// //           >
// //             Retry
// //           </button>
// //         </div>
// //       )}

// //       {/* ── Program Grid ────────────────────────────────────────────────────── */}
// //       {!isError && (
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// //           {isLoading
// //             ? Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)
// //             : programs.length === 0
// //             ? (
// //               <div className="col-span-full flex flex-col items-center gap-3 py-24">
// //                 <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
// //                   <Sparkles size={24} className="text-slate-300" />
// //                 </div>
// //                 <p className="text-slate-500 font-bold text-sm">No programs match your filters.</p>
// //                 {hasActiveFilters && (
// //                   <button
// //                     onClick={clearFilters}
// //                     className="text-blue-600 text-xs font-black underline underline-offset-4"
// //                   >
// //                     Clear all filters
// //                   </button>
// //                 )}
// //               </div>
// //             )
// //             : programs.map((prog, idx) => {
// //               const isPaid   = (prog.price ?? 0) > 0;
// //               const modules  = moduleCount(prog.modules);
// //               const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
// //               const bgLetter = getBgLetter(prog.name);

// //               return (
// //                 <div
// //                   key={prog.id}
// //                   className="group flex flex-col bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden"
// //                 >
// //                   {/* ── Gradient Banner (replaces image) ── */}
// //                   <div className={`relative h-[140px] bg-gradient-to-br ${gradient} overflow-hidden`}>
// //                     {/* Decorative large letter */}
// //                     <span className="absolute -bottom-4 -right-3 text-[120px] font-black text-white/10 leading-none select-none pointer-events-none">
// //                       {bgLetter}
// //                     </span>

// //                     {/* Decorative circles */}
// //                     <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
// //                     <div className="absolute top-4 right-16 w-8 h-8 rounded-full bg-white/10" />

// //                     {/* Icon center */}
// //                     <div className="absolute inset-0 flex items-center justify-center">
// //                       <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
// //                         <BookOpen size={22} className="text-white" />
// //                       </div>
// //                     </div>

// //                     {/* Duration badge */}
// //                     <div className="absolute bottom-3 left-3 bg-black/30 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1 border border-white/10">
// //                       {prog.durationDays ?? "?"} Days
// //                     </div>

// //                     {/* Price badge */}
// //                     <div className={`absolute bottom-3 right-3 ${isPaid ? "bg-white text-blue-600" : "bg-white text-slate-900"} px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md`}>
// //                       {formatPrice(prog.price, prog.currency)}
// //                     </div>
// //                   </div>

// //                   {/* ── Content ── */}
// //                   <div className="p-5 flex flex-col flex-1 space-y-4">
// //                     <div className="space-y-1.5">
// //                       <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
// //                         {prog.name}
// //                       </h3>
// //                       <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
// //                         {prog.description ?? "Experience a complete transformation with expert-guided sessions designed for your busy lifestyle."}
// //                       </p>
// //                     </div>

// //                     {/* Meta row */}
// //                     <div className="flex items-center justify-between border-y border-slate-50 py-3">
// //                       <div className="flex items-center gap-2">
// //                         {prog.creator?.image ? (
// //                           <img
// //                             src={prog.creator.image}
// //                             alt={prog.creator.name}
// //                             className="w-5 h-5 rounded-full object-cover border border-slate-200"
// //                           />
// //                         ) : (
// //                           <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border border-slate-200 flex items-center justify-center text-white text-[8px] font-black">
// //                             {prog.creator?.name?.[0]?.toUpperCase() ?? "C"}
// //                           </div>
// //                         )}
// //                         <span className="text-[10px] font-bold text-slate-400 italic">
// //                           {prog.creator?.name ?? "Expert Coach"}
// //                         </span>
// //                       </div>
// //                       <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">
// //                         {modules} Modules
// //                       </div>
// //                     </div>

// //                     {/* CTA buttons */}
// //                     <div className="flex gap-2 pt-1 mt-auto">
// //                       <Link href={`/dashboard/mini-mastery-programs/enroll/${prog.id}`} className="flex-[2]">
// //                         <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100">
// //                           Enroll
// //                         </button>
// //                       </Link>
// //                       <Link href={`/dashboard/mini-mastery-programs/${prog.id}`} className="flex-1">
// //                         <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60">
// //                           Info
// //                         </button>
// //                       </Link>
// //                     </div>
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //         </div>
// //       )}

// //       {/* ── Pagination ──────────────────────────────────────────────────────── */}
// //       {pagination && pagination.totalPages > 1 && !isLoading && (
// //         <div className="mt-16 flex flex-col items-center gap-5">
// //           <div className="flex items-center gap-2">
// //             {/* Prev */}
// //             <button
// //               onClick={() => setPage((p) => Math.max(1, p - 1))}
// //               disabled={page === 1}
// //               className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
// //             >
// //               <ChevronLeft size={14} /> Prev
// //             </button>

// //             {/* Page pills */}
// //             <div className="flex items-center gap-1">
// //               {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
// //                 .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
// //                 .reduce<(number | "...")[]>((acc, p, idx, arr) => {
// //                   if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
// //                     acc.push("...");
// //                   }
// //                   acc.push(p);
// //                   return acc;
// //                 }, [])
// //                 .map((p, idx) =>
// //                   p === "..." ? (
// //                     <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
// //                   ) : (
// //                     <button
// //                       key={p}
// //                       onClick={() => setPage(p as number)}
// //                       className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
// //                         page === p
// //                           ? "bg-slate-900 text-white shadow-md"
// //                           : "hover:bg-slate-100 text-slate-500 bg-white border border-slate-100"
// //                       }`}
// //                     >
// //                       {p}
// //                     </button>
// //                   )
// //                 )}
// //             </div>

// //             {/* Next */}
// //             <button
// //               onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
// //               disabled={page >= pagination.totalPages}
// //               className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
// //             >
// //               Next <ChevronRight size={14} />
// //             </button>
// //           </div>

// //           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
// //             Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total} programs
// //           </p>
// //         </div>
// //       )}

// //       {/* No pagination needed state */}
// //       {pagination && pagination.totalPages <= 1 && !isLoading && programs.length > 0 && (
// //         <p className="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
// //           Showing all {pagination.total} programs
// //         </p>
// //       )}
// //     </div>
// //   );
// // }

// "use client";

// import React, { useState } from "react";
// import axios from "axios";
// import { useQuery, keepPreviousData } from "@tanstack/react-query";
// import {
//   ChevronDown, ArrowUpDown, Sparkles, Zap,
//   Loader2, ServerCrash, ChevronLeft, ChevronRight,
//   SlidersHorizontal, X,
// } from "lucide-react";
// import Link from "next/link";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Creator {
//   id: string;
//   name: string;
//   image: string | null;
// }

// interface Program {
//   id: string;
//   name: string;
//   slug: string;
//   description: string | null;
//   durationDays: number | null;
//   unlockType: string | null;
//   price: number | null;
//   currency: string | null;
//   achievements: unknown;
//   modules: unknown;
//   status: string | null;
//   isActive: boolean;
//   createdAt: string;
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

// // ─── Filter types ─────────────────────────────────────────────────────────────

// type PricingFilter  = "all" | "free" | "paid";
// type DurationFilter = "all" | "7" | "14" | "21" | "30";
// type SortOption     = "newest" | "price_asc" | "price_desc";

// interface Filters {
//   pricing:  PricingFilter;
//   duration: DurationFilter;
//   sort:     SortOption;
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const LIMIT = 9;

// function formatPrice(price: number | null, currency: string | null): string {
//   if (!price || price === 0) return "FREE";
//   const symbol = currency === "USD" ? "$" : "₹";
//   return `${symbol}${price.toLocaleString("en-IN")}`;
// }

// function moduleCount(modules: unknown): number {
//   return Array.isArray(modules) ? modules.length : 0;
// }

// const SORT_LABELS: Record<SortOption, string> = {
//   newest:     "Newest",
//   price_asc:  "Price: Low → High",
//   price_desc: "Price: High → Low",
// };

// const DURATION_OPTIONS: { label: string; value: DurationFilter }[] = [
//   { label: "Any Duration", value: "all" },
//   { label: "7 Days",       value: "7"   },
//   { label: "14 Days",      value: "14"  },
//   { label: "21 Days",      value: "21"  },
//   { label: "30 Days",      value: "30"  },
// ];

// // Unsplash cover images cycled by index as placeholder
// const COVER_IMAGES = [
//   "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600",
//   "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?auto=format&fit=crop&q=80&w=600",
//   "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600",
//   "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600",
//   "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=600",
//   "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
// ];

// // ─── API fetcher ──────────────────────────────────────────────────────────────

// async function fetchPublicPrograms(
//   page: number,
//   filters: Filters,
// ): Promise<ApiResponse> {
//   const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
//   if (filters.pricing  !== "all") params.set("pricing",  filters.pricing);
//   if (filters.duration !== "all") params.set("duration", filters.duration);
//   params.set("sort", filters.sort);

//   const { data } = await axios.get<ApiResponse>(
//     `/api/mini-mastery-programs/public?${params.toString()}`,
//   );
//   return data;
// }

// // ─── Skeleton card ────────────────────────────────────────────────────────────

// function SkeletonCard() {
//   return (
//     <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden animate-pulse">
//       <div className="aspect-[16/10] bg-slate-100" />
//       <div className="p-5 space-y-4">
//         <div className="space-y-2">
//           <div className="h-4 w-3/4 bg-slate-100 rounded-lg" />
//           <div className="h-3 w-full bg-slate-100 rounded-lg" />
//           <div className="h-3 w-2/3 bg-slate-100 rounded-lg" />
//         </div>
//         <div className="flex justify-between items-center py-3 border-y border-slate-50">
//           <div className="h-3 w-24 bg-slate-100 rounded" />
//           <div className="h-3 w-16 bg-slate-100 rounded" />
//         </div>
//         <div className="flex gap-2 pt-1">
//           <div className="flex-[2] h-10 bg-slate-100 rounded-xl" />
//           <div className="flex-1 h-10 bg-slate-100 rounded-xl" />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Dropdown ─────────────────────────────────────────────────────────────────

// interface DropdownProps<T extends string> {
//   label: string;
//   value: T;
//   options: { label: string; value: T }[];
//   onChange: (v: T) => void;
// }

// function Dropdown<T extends string>({ label, value, options, onChange }: DropdownProps<T>) {
//   const [open, setOpen] = useState(false);
//   const active = options.find((o) => o.value === value);

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setOpen((o) => !o)}
//         className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${
//           open
//             ? "bg-slate-900 text-white border-slate-900"
//             : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
//         }`}
//       >
//         {active?.label ?? label}
//         <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
//       </button>

//       {open && (
//         <>
//           <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
//           <div className="absolute top-full mt-2 left-0 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden w-44 py-1">
//             {options.map((opt) => (
//               <button
//                 key={opt.value}
//                 onClick={() => { onChange(opt.value); setOpen(false); }}
//                 className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
//                   value === opt.value
//                     ? "bg-blue-50 text-blue-700"
//                     : "hover:bg-slate-50 text-slate-600"
//                 }`}
//               >
//                 {opt.label}
//               </button>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function EnrollPage() {
//   const [page, setPage]       = useState(1);
//   const [filters, setFilters] = useState<Filters>({
//     pricing:  "all",
//     duration: "all",
//     sort:     "newest",
//   });
//   const [sortOpen, setSortOpen] = useState(false);

//   const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => {
//     setFilters((f) => ({ ...f, [key]: val }));
//     setPage(1);
//   };

//   const clearFilters = () => {
//     setFilters({ pricing: "all", duration: "all", sort: "newest" });
//     setPage(1);
//   };

//   const hasActiveFilters = filters.pricing !== "all" || filters.duration !== "all";

//   const { data, isLoading, isError, error } = useQuery({
//     queryKey: ["mmp-enroll", page, filters],
//     queryFn: () => fetchPublicPrograms(page, filters),
//     placeholderData: keepPreviousData,
//     staleTime: 30_000,
//   });
//   console.log({ data });
//   const programs    = data?.programs    ?? [];
//   const pagination  = data?.pagination;

//   return (
//     <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 max-w-7xl mx-auto font-sans">

//       {/* ── Header ─────────────────────────────────────────────────────────── */}
//       <header className="mb-12 space-y-6">
//         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
//           <div className="space-y-3">
//             <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">
//               <Sparkles size={14} /> SGE Discovery
//             </div>
//             <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
//               Mini-Mastery Programs
//             </h1>
//             <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl leading-relaxed">
//               Bite-sized daily transformations. Expert-led skills in under 15 minutes a day.
//             </p>
//           </div>

//           <div className="bg-white px-4 py-2.5 rounded-2xl text-[11px] font-bold text-slate-600 flex items-center gap-3 shadow-sm border border-slate-100 self-start md:mb-1">
//             <div className="flex -space-x-2">
//               {[1, 2, 3].map((i) => (
//                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
//               ))}
//             </div>
//             <span>Join <span className="text-blue-600 font-black">1,200+</span> growing members</span>
//           </div>
//         </div>
//       </header>

//       {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
//       <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
//         <div className="flex flex-wrap items-center gap-2">
//           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
//             <SlidersHorizontal size={12} /> Filters
//           </div>

//           {/* Pricing filter */}
//           <Dropdown<PricingFilter>
//             label="Pricing"
//             value={filters.pricing}
//             options={[
//               { label: "All Pricing", value: "all"  },
//               { label: "Free Only",   value: "free" },
//               { label: "Paid Only",   value: "paid" },
//             ]}
//             onChange={(v) => setFilter("pricing", v)}
//           />

//           {/* Duration filter */}
//           <Dropdown<DurationFilter>
//             label="Duration"
//             value={filters.duration}
//             options={DURATION_OPTIONS}
//             onChange={(v) => setFilter("duration", v)}
//           />

//           {/* Clear filters pill */}
//           {hasActiveFilters && (
//             <button
//               onClick={clearFilters}
//               className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
//             >
//               <X size={10} /> Clear
//             </button>
//           )}

//           {/* Total count */}
//           {!isLoading && pagination && (
//             <span className="text-[10px] font-bold text-slate-400 ml-1">
//               {pagination.total} programs
//             </span>
//           )}
//         </div>

//         {/* Sort */}
//         <div className="relative">
//           <button
//             onClick={() => setSortOpen((o) => !o)}
//             className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
//           >
//             Sort:{" "}
//             <span className="text-slate-900 font-black uppercase tracking-tighter">
//               {SORT_LABELS[filters.sort]}
//             </span>
//             <ArrowUpDown size={12} />
//           </button>

//           {sortOpen && (
//             <>
//               <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
//               <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden w-48 py-1">
//                 {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
//                   <button
//                     key={s}
//                     onClick={() => { setFilter("sort", s); setSortOpen(false); }}
//                     className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
//                       filters.sort === s
//                         ? "bg-blue-50 text-blue-700"
//                         : "hover:bg-slate-50 text-slate-600"
//                     }`}
//                   >
//                     {SORT_LABELS[s]}
//                   </button>
//                 ))}
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* ── Error state ─────────────────────────────────────────────────────── */}
//       {isError && (
//         <div className="flex flex-col items-center gap-3 py-24 text-center">
//           <ServerCrash size={36} className="text-slate-300" />
//           <p className="text-slate-500 font-bold text-sm">
//             {axios.isAxiosError(error) && error.response?.data
//               ? (error.response.data as { message?: string }).message ?? "Something went wrong."
//               : "Could not load programs. Please try again."}
//           </p>
//           <button
//             onClick={() => setPage(1)}
//             className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all"
//           >
//             Retry
//           </button>
//         </div>
//       )}

//       {/* ── Program Grid ────────────────────────────────────────────────────── */}
//       {!isError && (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {isLoading
//             ? Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)
//             : programs.length === 0
//             ? (
//               <div className="col-span-full flex flex-col items-center gap-3 py-24">
//                 <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
//                   <Sparkles size={24} className="text-slate-300" />
//                 </div>
//                 <p className="text-slate-500 font-bold text-sm">No programs match your filters.</p>
//                 {hasActiveFilters && (
//                   <button
//                     onClick={clearFilters}
//                     className="text-blue-600 text-xs font-black underline underline-offset-4"
//                   >
//                     Clear all filters
//                   </button>
//                 )}
//               </div>
//             )
//             : programs.map((prog, idx) => {
//               const isPaid  = (prog.price ?? 0) > 0;
//               const cover   = COVER_IMAGES[idx % COVER_IMAGES.length];
//               const modules = moduleCount(prog.modules);

//               return (
//                 <div
//                   key={prog.id}
//                   className="group flex flex-col bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden"
//                 >
//                   {/* Image */}
//                   <div className="relative aspect-[16/10] overflow-hidden">
//                     <img
//                       src={prog.thumbnailUrl}
//                       alt={prog.name}
//                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
//                     />
//                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />

//                     {/* Duration badge */}
//                     <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-900 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-sm flex items-center gap-1">
//                       <Zap size={10} className="text-blue-500 fill-blue-500" />
//                       {prog.durationDays ?? "?"} Days
//                     </div>

//                     {/* Price badge */}
//                     <div className={`absolute top-3 right-3 ${isPaid ? "bg-blue-500" : "bg-slate-900"} text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg`}>
//                       {formatPrice(prog.price, prog.currency)}
//                     </div>
//                   </div>

//                   {/* Content */}
//                   <div className="p-5 flex flex-col flex-1 space-y-4">
//                     <div className="space-y-1.5">
//                       <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
//                         {prog.name}
//                       </h3>
//                       <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
//                         {prog.description ?? "Experience a complete transformation with expert-guided sessions designed for your busy lifestyle."}
//                       </p>
//                     </div>

//                     {/* Meta row */}
//                     <div className="flex items-center justify-between border-y border-slate-50 py-3">
//                       <div className="flex items-center gap-2">
//                         {prog.creator?.image ? (
//                           <img
//                             src={prog.thumbnailUrl ?? prog.creator.image}
//                             alt={prog.creator.name}
//                             className="w-5 h-5 rounded-full object-cover border border-slate-200"
//                           />
//                         ) : (
//                           <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200" />
//                         )}
//                         <span className="text-[10px] font-bold text-slate-400 italic">
//                           {prog.creator?.name ?? "Expert Coach"}
//                         </span>
//                       </div>
//                       <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">
//                         {modules} Modules
//                       </div>
//                     </div>

//                     {/* CTA buttons */}
//                     <div className="flex gap-2 pt-1 mt-auto">
//                       {/* /dashboard/membership/checkout?plan=${prog.id} */}
//                       <Link href={`/dashboard/mini-mastery-programs/enroll/${prog.id}`} className="flex-[2]">
//                         <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100">
//                           Enroll
//                         </button>
//                       </Link>
//                       <Link href={`/dashboard/mini-mastery-programs/${prog.id}`} className="flex-1">
//                         <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60">
//                           Info
//                         </button>
//                       </Link>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//         </div>
//       )}

//       {/* ── Pagination ──────────────────────────────────────────────────────── */}
//       {pagination && pagination.totalPages > 1 && !isLoading && (
//         <div className="mt-16 flex flex-col items-center gap-5">
//           <div className="flex items-center gap-2">
//             {/* Prev */}
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page === 1}
//               className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
//             >
//               <ChevronLeft size={14} /> Prev
//             </button>

//             {/* Page pills */}
//             <div className="flex items-center gap-1">
//               {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
//                 .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
//                 .reduce<(number | "...")[]>((acc, p, idx, arr) => {
//                   if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
//                     acc.push("...");
//                   }
//                   acc.push(p);
//                   return acc;
//                 }, [])
//                 .map((p, idx) =>
//                   p === "..." ? (
//                     <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
//                   ) : (
//                     <button
//                       key={p}
//                       onClick={() => setPage(p as number)}
//                       className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
//                         page === p
//                           ? "bg-slate-900 text-white shadow-md"
//                           : "hover:bg-slate-100 text-slate-500 bg-white border border-slate-100"
//                       }`}
//                     >
//                       {p}
//                     </button>
//                   )
//                 )}
//             </div>

//             {/* Next */}
//             <button
//               onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
//               disabled={page >= pagination.totalPages}
//               className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
//             >
//               Next <ChevronRight size={14} />
//             </button>
//           </div>

//           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
//             Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total} programs
//           </p>
//         </div>
//       )}

//       {/* No pagination needed state */}
//       {pagination && pagination.totalPages <= 1 && !isLoading && programs.length > 0 && (
//         <p className="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
//           Showing all {pagination.total} programs
//         </p>
//       )}
//     </div>
//   );
// }

"use client";

import React, { useState } from "react";
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ChevronDown, ArrowUpDown, Sparkles,
  Loader2, ServerCrash, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, BookOpen,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Creator {
  id: string;
  name: string;
  image: string | null;
}

interface Program {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationDays: number | null;
  unlockType: string | null;
  price: number | null;
  currency: string | null;
  achievements: unknown;
  modules: unknown;
  status: string | null;
  isActive: boolean;
  createdAt: string;
  thumbnailUrl: string | null;
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

// ─── Filter types ─────────────────────────────────────────────────────────────

type PricingFilter  = "all" | "free" | "paid";
type DurationFilter = "all" | "7" | "14" | "21" | "30";
type SortOption     = "newest" | "price_asc" | "price_desc";

interface Filters {
  pricing:  PricingFilter;
  duration: DurationFilter;
  sort:     SortOption;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIMIT = 9;

function formatPrice(price: number | null, currency: string | null): string {
  if (!price || price === 0) return "FREE";
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${price.toLocaleString("en-IN")}`;
}

function moduleCount(modules: unknown): number {
  return Array.isArray(modules) ? modules.length : 0;
}

const SORT_LABELS: Record<SortOption, string> = {
  newest:     "Newest",
  price_asc:  "Price: Low → High",
  price_desc: "Price: High → Low",
};

const DURATION_OPTIONS: { label: string; value: DurationFilter }[] = [
  { label: "Any Duration", value: "all" },
  { label: "7 Days",       value: "7"   },
  { label: "14 Days",      value: "14"  },
  { label: "21 Days",      value: "21"  },
  { label: "30 Days",      value: "30"  },
];

// Gradient palettes cycled per card index — replaces image
const CARD_GRADIENTS = [
  "from-blue-500 via-blue-600 to-indigo-700",
  "from-violet-500 via-purple-600 to-purple-800",
  "from-emerald-400 via-teal-500 to-cyan-700",
  "from-orange-400 via-rose-500 to-pink-600",
  "from-amber-400 via-orange-500 to-red-600",
  "from-sky-400 via-blue-500 to-blue-700",
  "from-fuchsia-500 via-pink-500 to-rose-600",
  "from-lime-400 via-green-500 to-emerald-700",
  "from-indigo-400 via-violet-500 to-purple-700",
] as const;

// Large background letter from program name — used as decorative element
function getBgLetter(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "M";
}

// ─── API fetcher ──────────────────────────────────────────────────────────────

async function fetchPublicPrograms(
  page: number,
  filters: Filters,
): Promise<ApiResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (filters.pricing  !== "all") params.set("pricing",  filters.pricing);
  if (filters.duration !== "all") params.set("duration", filters.duration);
  params.set("sort", filters.sort);

  const { data } = await axios.get<ApiResponse>(
    `/api/mini-mastery-programs/public?${params.toString()}`,
  );
  console.log("Fetched programs:", data);
  return data;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-[140px] bg-slate-100" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-slate-100 rounded-lg" />
          <div className="h-3 w-full bg-slate-100 rounded-lg" />
          <div className="h-3 w-2/3 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex justify-between items-center py-3 border-y border-slate-50">
          <div className="h-3 w-24 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-[2] h-10 bg-slate-100 rounded-xl" />
          <div className="flex-1 h-10 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

interface DropdownProps<T extends string> {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}

function Dropdown<T extends string>({ label, value, options, onChange }: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${
          open
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
        }`}
      >
        {active?.label ?? label}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden w-44 py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                  value === opt.value
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnrollPage() {
  const [page, setPage]       = useState(1);
  const [filters, setFilters] = useState<Filters>({
    pricing:  "all",
    duration: "all",
    sort:     "newest",
  });
  const [sortOpen, setSortOpen] = useState(false);

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ pricing: "all", duration: "all", sort: "newest" });
    setPage(1);
  };

  const hasActiveFilters = filters.pricing !== "all" || filters.duration !== "all";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["mmp-enroll", page, filters],
    queryFn: () => fetchPublicPrograms(page, filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const programs    = data?.programs    ?? [];
  const pagination  = data?.pagination;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 max-w-7xl mx-auto font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">
              <Sparkles size={14} /> SGE Discovery
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Mini-Mastery Programs
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              Bite-sized daily transformations. Expert-led skills in under 15 minutes a day.
            </p>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-2xl text-[11px] font-bold text-slate-600 flex items-center gap-3 shadow-sm border border-slate-100 self-start md:mb-1">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <span>Join <span className="text-blue-600 font-black">1,200+</span> growing members</span>
          </div>
        </div>
      </header>

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
            <SlidersHorizontal size={12} /> Filters
          </div>

          {/* Pricing filter */}
          <Dropdown<PricingFilter>
            label="Pricing"
            value={filters.pricing}
            options={[
              { label: "All Pricing", value: "all"  },
              { label: "Free Only",   value: "free" },
              { label: "Paid Only",   value: "paid" },
            ]}
            onChange={(v) => setFilter("pricing", v)}
          />

          {/* Duration filter */}
          <Dropdown<DurationFilter>
            label="Duration"
            value={filters.duration}
            options={DURATION_OPTIONS}
            onChange={(v) => setFilter("duration", v)}
          />

          {/* Clear filters pill */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
            >
              <X size={10} /> Clear
            </button>
          )}

          {/* Total count */}
          {!isLoading && pagination && (
            <span className="text-[10px] font-bold text-slate-400 ml-1">
              {pagination.total} programs
            </span>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
          >
            Sort:{" "}
            <span className="text-slate-900 font-black uppercase tracking-tighter">
              {SORT_LABELS[filters.sort]}
            </span>
            <ArrowUpDown size={12} />
          </button>

          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden w-48 py-1">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setFilter("sort", s); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                      filters.sort === s
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {SORT_LABELS[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {isError && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <ServerCrash size={36} className="text-slate-300" />
          <p className="text-slate-500 font-bold text-sm">
            {axios.isAxiosError(error) && error.response?.data
              ? (error.response.data as { message?: string }).message ?? "Something went wrong."
              : "Could not load programs. Please try again."}
          </p>
          <button
            onClick={() => setPage(1)}
            className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Program Grid ────────────────────────────────────────────────────── */}
      {!isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)
            : programs.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center gap-3 py-24">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Sparkles size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-sm">No programs match your filters.</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 text-xs font-black underline underline-offset-4"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )
            : programs.map((prog, idx) => {
              const isPaid   = (prog.price ?? 0) > 0;
              const modules  = moduleCount(prog.modules);
              const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
              const bgLetter = getBgLetter(prog.name);

              return (
                <div
                  key={prog.id}
                  className="group flex flex-col bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden"
                >
                  {/* ── Cover: real thumbnail or gradient fallback ── */}
                  <div className="relative h-[160px] overflow-hidden">
                    {prog.thumbnailUrl ? (
                      <img
                        src={prog.thumbnailUrl}
                        alt={prog.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <span className="absolute -bottom-4 -right-3 text-[120px] font-black text-white/10 leading-none select-none pointer-events-none">
                          {bgLetter}
                        </span>
                        <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen size={22} className="text-white" />
                        </div>
                      </div>
                    )}

                    {/* Subtle gradient overlay on real images for badge readability */}
                    {prog.thumbnailUrl && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    )}

                    {/* Duration badge */}
                    <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1 border border-white/10">
                      {prog.durationDays ?? "?"} Days
                    </div>

                    {/* Price badge */}
                    <div className={`absolute bottom-3 right-3 ${isPaid ? "bg-white text-blue-600" : "bg-white text-slate-900"} px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md`}>
                      {formatPrice(prog.price, prog.currency)}
                    </div>
                  </div>

                  {/* ── Content ── */}
                  <div className="p-5 flex flex-col flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                        {prog.name}
                      </h3>
                      <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                        {prog.description ?? "Experience a complete transformation with expert-guided sessions designed for your busy lifestyle."}
                      </p>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between border-y border-slate-50 py-3">
                      <div className="flex items-center gap-2">
                        {prog.creator?.image ? (
                          <img
                            src={prog.creator.image}
                            alt={prog.creator.name}
                            className="w-5 h-5 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border border-slate-200 flex items-center justify-center text-white text-[8px] font-black">
                            {prog.creator?.name?.[0]?.toUpperCase() ?? "C"}
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 italic">
                          {prog.creator?.name ?? "Expert Coach"}
                        </span>
                      </div>
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">
                        {modules} Modules
                      </div>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex gap-2 pt-1 mt-auto">
                      <Link href={`/dashboard/mini-mastery-programs/program/${prog.id}`} className="flex-[2]">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100">
                          Enroll
                        </button>
                      </Link>
                      <Link href={`/dashboard/mini-mastery-programs/${prog.id}`} className="flex-1">
                        <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60">
                          Info
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="mt-16 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {/* Page pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                        page === p
                          ? "bg-slate-900 text-white shadow-md"
                          : "hover:bg-slate-100 text-slate-500 bg-white border border-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total} programs
          </p>
        </div>
      )}

      {/* No pagination needed state */}
      {pagination && pagination.totalPages <= 1 && !isLoading && programs.length > 0 && (
        <p className="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          Showing all {pagination.total} programs
        </p>
      )}
    </div>
  );
}