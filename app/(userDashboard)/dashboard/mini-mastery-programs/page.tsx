"use client";

import React, { useState } from "react";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ChevronDown, ArrowUpDown, Sparkles,
  ServerCrash, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, BookOpen,
  CheckCircle2, PlayCircle, Trophy,
  Lock, ArrowRight, Target, LayoutPanelLeft,
  Info, AlertCircle, Clock, GraduationCap,
  LogIn, Zap, Shield,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Creator {
  id: string;
  name: string;
  image: string | null;
}

interface ModuleItem {
  id: number;
  title: string;
  type: "video" | "text";
  videoUrl?: string;
  instructions: string;
  actionTask: string;
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
  completionThreshold: number | null;
  certificateTitle: string | null;
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

interface ProgramStatus {
  enrolled: boolean;
  completed: boolean;
}

interface MyStatusResponse {
  statuses: Record<string, ProgramStatus>;
}

type PricingFilter = "all" | "free" | "paid";
type DurationFilter = "all" | "7" | "14" | "21" | "30";
type SortOption = "newest" | "price_asc" | "price_desc";

interface Filters {
  pricing: PricingFilter;
  duration: DurationFilter;
  sort: SortOption;
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

function parseAchievements(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
  return [];
}

function parseModules(raw: unknown): ModuleItem[] {
  if (Array.isArray(raw)) return raw as ModuleItem[];
  return [];
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

function getBgLetter(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "M";
}

// ─── API fetchers ─────────────────────────────────────────────────────────────

async function fetchPublicPrograms(page: number, filters: Filters): Promise<ApiResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (filters.pricing !== "all") params.set("pricing", filters.pricing);
  if (filters.duration !== "all") params.set("duration", filters.duration);
  params.set("sort", filters.sort);
  const { data } = await axios.get<ApiResponse>(`/api/mini-mastery-programs/public?${params.toString()}`);
  return data;
}

async function fetchMyStatuses(): Promise<MyStatusResponse> {
  const { data } = await axios.get<MyStatusResponse>("/api/mini-mastery-programs/my-status");
  return data;
}

async function fetchProgramDetail(id: string): Promise<Program> {
  const { data } = await axios.get<{ program: Program }>(`/api/mini-mastery-programs/public/${id}`);
  return data.program;
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────
// Shown at top of page when user is not signed in

function GuestBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[28px] p-6 mb-10 shadow-xl shadow-blue-200/50">
      {/* Decorative blobs */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-violet-400/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
            <LogIn size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-base leading-none">Sign in to enroll</p>
            <p className="text-blue-100 text-xs font-medium mt-1">
              Create a free account to start any program and track your progress.
            </p>
          </div>
        </div>
        <button
          onClick={() => signIn()}
          className="shrink-0 bg-white hover:bg-blue-50 text-blue-700 font-black px-6 py-3 rounded-xl text-sm transition-all active:scale-95 shadow-lg shadow-blue-900/20 flex items-center gap-2 whitespace-nowrap"
        >
          <LogIn size={15} /> Sign In / Sign Up
        </button>
      </div>
    </div>
  );
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
                  value === opt.value ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
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

// ─── CTA Button ───────────────────────────────────────────────────────────────

function ProgramCTA({
  prog,
  status,
  isLoggedIn,
  }: {
  prog:        Program;
  status?:     ProgramStatus;
  isLoggedIn:  boolean;
  onInfoClick: (prog: Program) => void;
}) {
  // Not logged in — both buttons redirect to signIn
  if (!isLoggedIn) {
    return (
      <div className="flex gap-2 pt-1 mt-auto">
        <button
          onClick={() => signIn()}
          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5"
        >
          <LogIn size={13} /> Enroll
        </button>
        <button
          onClick={() => signIn()}
          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60"
        >
          Info
        </button>
      </div>
    );
  }

  if (status?.completed) {
    return (
      <div className="flex gap-2 pt-1 mt-auto items-stretch">
        <Link href={`/dashboard/mini-mastery-programs/program/${prog.id}`} className="flex-[2] flex">
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-green-100 flex items-center justify-center gap-1.5">
            <Trophy size={13} /> Completed
          </button>
        </Link>
        <Link href={`/dashboard/mini-mastery-programs/${prog.id}`} className="flex-1 flex">
          <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60">
            Info
          </button>
        </Link>
      </div>
    );
  }

  if (status?.enrolled) {
    return (
      <div className="flex gap-2 pt-1 mt-auto items-stretch">
        <Link href={`/dashboard/mini-mastery-programs/program/${prog.id}`} className="flex-[2] flex">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5">
            <PlayCircle size={13} /> Continue Learning
          </button>
        </Link>
        <Link href={`/dashboard/mini-mastery-programs/${prog.id}`} className="flex-1 flex">
          <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60">
            Info
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-2 pt-1 mt-auto items-stretch">
      <Link href={`/dashboard/membership/checkout?mmp_programId=${prog.id}&context=MMP_PROGRAM`} className="flex-[2] flex">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center">
          Enroll
        </button>
      </Link>
      <Link href={`/dashboard/mini-mastery-programs/${prog.id}`} className="flex-1 flex">
        <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-black py-3 rounded-xl text-[11px] tracking-wider transition-all border border-slate-200/60">
          Info
        </button>
      </Link>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function CardStatusBadge({ status }: { status?: ProgramStatus }) {
  if (status?.completed) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-md">
        <CheckCircle2 size={10} /> Completed
      </div>
    );
  }
  if (status?.enrolled) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-md">
        <PlayCircle size={10} /> Enrolled
      </div>
    );
  }
  return null;
}

// ─── Program Detail Drawer / Modal ────────────────────────────────────────────
// Shown when user clicks "Info" — works for both logged in and guest users

function ProgramDetailModal({
  programId,
  isLoggedIn,
  onClose,
}: {
  programId:  string;
  isLoggedIn: boolean;
  onClose:    () => void;
}) {
  const { data: program, isLoading, isError } = useQuery({
    queryKey:  ["mmp-detail-modal", programId],
    queryFn:   () => fetchProgramDetail(programId),
    staleTime: 60_000,
  });

  const achievements = program ? parseAchievements(program.achievements) : [];
  const modules      = program ? parseModules(program.modules) : [];
  const isPaid       = (program?.price ?? 0) > 0;
  const hasCert      = !!program?.certificateTitle;

  function handleEnroll() {
    if (!isLoggedIn) {
      signIn();
      return;
    }
    window.location.href = `/dashboard/membership/checkout?mmp_programId=${programId}&context=MMP_PROGRAM`;
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close pill */}
        <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-white/90 backdrop-blur-sm rounded-t-[32px]">
          <button
            onClick={onClose}
            className="w-10 h-1.5 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
          />
        </div>

        {isLoading && (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-6 w-2/3 bg-slate-100 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
          </div>
        )}

        {isError && (
          <div className="p-8 text-center">
            <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold text-sm">Could not load program details.</p>
          </div>
        )}

        {program && (
          <div className="px-6 pb-8 pt-2 space-y-6">

            {/* Cover */}
            <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
              {program.thumbnailUrl ? (
                <img src={program.thumbnailUrl} alt={program.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center`}>
                  <BookOpen size={40} className="text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-black text-xl leading-tight">{program.name}</p>
                {program.creator && (
                  <p className="text-white/70 text-xs font-medium mt-1">by {program.creator.name}</p>
                )}
              </div>
            </div>

            {/* Description */}
            {program.description && (
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{program.description}</p>
            )}

            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <Clock size={14} />,          label: "Duration",  value: `${program.durationDays ?? "?"} Days` },
                { icon: <BookOpen size={14} />,       label: "Modules",   value: `${modules.length}` },
                { icon: <GraduationCap size={14} />,  label: "Cert",      value: hasCert ? "Included" : "None" },
                { icon: <Zap size={14} />,            label: "Unlock",    value: program.unlockType === "daily" ? "Daily" : "All" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="flex justify-center text-blue-500 mb-1">{icon}</div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5 leading-tight">{value}</p>
                </div>
              ))}
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Target size={14} className="text-white" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">What You&apos;ll Achieve</h3>
                </div>
                <div className="space-y-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <CheckCircle2 size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{ach}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modules list */}
            {modules.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                    <LayoutPanelLeft size={14} className="text-white" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Program Structure</h3>
                </div>
                <div className="space-y-1.5">
                  {modules.slice(0, 5).map((mod, idx) => (
                    <div key={mod.id ?? idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-blue-400 w-5 shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <p className="text-xs font-bold text-slate-700 flex-1 truncate">{mod.title}</p>
                      <Lock size={11} className="text-slate-200 shrink-0" />
                    </div>
                  ))}
                  {modules.length > 5 && (
                    <p className="text-center text-[10px] font-bold text-slate-400 py-1">
                      +{modules.length - 5} more modules
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Completion info */}
            <div className="bg-blue-600 rounded-2xl p-4 text-white flex items-start gap-3">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium leading-relaxed text-blue-50">
                Requires{" "}
                <span className="font-black text-white">{program.completionThreshold ?? 100}% completion</span>{" "}
                to unlock the{" "}
                <span className="font-black text-white">{program.certificateTitle ?? "certificate"}</span>.
              </p>
            </div>

            {/* Guest CTA */}
            {!isLoggedIn && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <Shield size={18} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800">Sign in to enroll</p>
                  <p className="text-[10px] text-slate-500 font-medium">Free account — no credit card needed</p>
                </div>
              </div>
            )}

            {/* Sticky footer CTA */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Investment</p>
                <p className="text-2xl font-black text-slate-900">
                  {formatPrice(program.price, program.currency)}
                </p>
              </div>
              <button
                onClick={handleEnroll}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm"
              >
                {!isLoggedIn
                  ? <><LogIn size={16} /> Sign In to Enroll</>
                  : isPaid
                  ? <>Enroll Now <ArrowRight size={16} /></>
                  : <>Start Free <ArrowRight size={16} /></>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EnrollPage ───────────────────────────────────────────────────────────────

export default function EnrollPage() {
  const { status: authStatus } = useSession();
  const isLoggedIn = authStatus === "authenticated";

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    pricing:  "all",
    duration: "all",
    sort:     "newest",
  });
  const [sortOpen,         setSortOpen]         = useState(false);
  const [selectedInfoProg, setSelectedInfoProg] = useState<Program | null>(null);

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
    queryKey:        ["mmp-enroll", page, filters],
    queryFn:         () => fetchPublicPrograms(page, filters),
    placeholderData: keepPreviousData,
    staleTime:       30_000,
  });

  const { data: statusData } = useQuery({
    queryKey: ["mmp-my-status"],
    queryFn:  fetchMyStatuses,
    staleTime: 60_000,
    enabled:  isLoggedIn,
  });

  const programs   = data?.programs ?? [];
  const pagination = data?.pagination;
  const statuses   = statusData?.statuses ?? {};

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 max-w-7xl mx-auto font-sans">

      {/* ── Info Modal ── */}
      {selectedInfoProg && (
        <ProgramDetailModal
          programId={selectedInfoProg.id}
          isLoggedIn={isLoggedIn}
          onClose={() => setSelectedInfoProg(null)}
        />
      )}

      {/* ── Header ── */}
      <header className="mb-8 space-y-4">
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

      {/* ── Guest Banner (only when not logged in) ── */}
      {!isLoggedIn && authStatus !== "loading" && <GuestBanner />}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
            <SlidersHorizontal size={12} /> Filters
          </div>

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

          <Dropdown<DurationFilter>
            label="Duration"
            value={filters.duration}
            options={DURATION_OPTIONS}
            onChange={(v) => setFilter("duration", v)}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
            >
              <X size={10} /> Clear
            </button>
          )}

          {!isLoading && pagination && (
            <span className="text-[10px] font-bold text-slate-400 ml-1">
              {pagination.total} programs
            </span>
          )}
        </div>

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
                      filters.sort === s ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
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

      {/* ── Error ── */}
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

      {/* ── Grid ── */}
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
                  <button onClick={clearFilters} className="text-blue-600 text-xs font-black underline underline-offset-4">
                    Clear all filters
                  </button>
                )}
              </div>
            )
            : programs.map((prog, idx) => {
                const isPaid    = (prog.price ?? 0) > 0;
                const modules   = moduleCount(prog.modules);
                const gradient  = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                const bgLetter  = getBgLetter(prog.name);
                const progStatus = isLoggedIn ? statuses[prog.id] : undefined;

                return (
                  <div
                    key={prog.id}
                    className="group flex flex-col bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden"
                  >
                    {/* Cover */}
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

                      {prog.thumbnailUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      )}

                      {/* Status badge — only for logged-in users */}
                      {isLoggedIn && <CardStatusBadge status={progStatus} />}

                      {/* Guest lock badge */}
                      {!isLoggedIn && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border border-white/10">
                          <Lock size={9} /> Sign in to enroll
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1 border border-white/10">
                        {prog.durationDays ?? "?"} Days
                      </div>

                      <div className={`absolute bottom-3 right-3 ${isPaid ? "bg-white text-blue-600" : "bg-white text-slate-900"} px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md`}>
                        {formatPrice(prog.price, prog.currency)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1 space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                          {prog.name}
                        </h3>
                        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                          {prog.description ?? "Experience a complete transformation with expert-guided sessions designed for your busy lifestyle."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-y border-slate-50 py-3">
                        <div className="flex items-center gap-2">
                          {prog.creator?.image ? (
                            <img src={prog.creator.image} alt={prog.creator.name} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
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

                      <ProgramCTA
                        prog={prog}
                        status={progStatus}
                        isLoggedIn={isLoggedIn}
                        onInfoClick={setSelectedInfoProg}
                      />
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="mt-16 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
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

      {pagination && pagination.totalPages <= 1 && !isLoading && programs.length > 0 && (
        <p className="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          Showing all {pagination.total} programs
        </p>
      )}
    </div>
  );
}