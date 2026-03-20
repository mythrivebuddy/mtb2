"use client";

import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  CheckCircle2, Lock, Clock, GraduationCap,
  ArrowRight, Target, LayoutPanelLeft, Info,
  AlertCircle, ChevronLeft, BookOpen,
  PlayCircle, Trophy, LogIn,
  ArrowLeft,
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
  thumbnailUrl: string | null;
  status: string | null;
  createdAt: string;
  creator: Creator | null;
}

interface ProgramStatus {
  enrolled: boolean;
  completed: boolean;
}

interface MyStatusResponse {
  statuses: Record<string, ProgramStatus>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number | null, currency: string | null): string {
  if (!price || price === 0) return "FREE";
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${price.toLocaleString("en-IN")}`;
}

function parseAchievements(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
  return [];
}

function parseModules(raw: unknown): ModuleItem[] {
  if (Array.isArray(raw)) return raw as ModuleItem[];
  return [];
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchProgram(id: string): Promise<Program> {
  const { data } = await axios.get<{ program: Program }>(
    `/api/mini-mastery-programs/public/${id}`
  );
  return data.program;
}

async function fetchMyStatuses(): Promise<MyStatusResponse> {
  const { data } = await axios.get<MyStatusResponse>("/api/mini-mastery-programs/my-status");
  return data;
}

// ─── CTA Button ───────────────────────────────────────────────────────────────

function EnrollButton({
  program,
  status,
  isLoggedIn,
}: {
  program: Program;
  status?: ProgramStatus;
  isLoggedIn: boolean;
}) {
  const isPaid = (program.price ?? 0) > 0;

  // Not logged in
  if (!isLoggedIn) {
    return (
      <button
        onClick={() => signIn()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm"
      >
        <LogIn size={16} /> Sign In to Enroll
      </button>
    );
  }

  // Completed
  if (status?.completed) {
    return (
      <Link href={`/dashboard/mini-mastery-programs/program/${program.id}`}>
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-200 active:scale-95 text-sm">
          <Trophy size={16} /> Completed
        </button>
      </Link>
    );
  }

  // Enrolled but not completed
  if (status?.enrolled) {
    return (
      <Link href={`/dashboard/mini-mastery-programs/program/${program.id}`}>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm">
          <PlayCircle size={16} /> Continue Learning
        </button>
      </Link>
    );
  }

  // Not enrolled
  return (
    <Link href={`/dashboard/membership/checkout?mmp_programId=${program.id}&context=MMP_PROGRAM`}>
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm">
        {isPaid ? "Enroll Now" : "Start Free"} <ArrowRight size={18} />
      </button>
    </Link>
  );
}

// ─── Status Badge (hero area) ─────────────────────────────────────────────────

function HeroStatusBadge({ status }: { status?: ProgramStatus }) {
  if (status?.completed) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
        <Trophy size={11} /> You completed this program
      </div>
    );
  }
  if (status?.enrolled) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
        <PlayCircle size={11} /> Currently enrolled
      </div>
    );
  }
  return null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          <div className="w-full lg:w-1/2 aspect-video rounded-[32px] bg-slate-200 border-4 border-white" />
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-36 bg-slate-200 rounded-lg" />
              <div className="h-10 w-3/4 bg-slate-200 rounded-xl" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="flex items-center gap-2 pt-1">
                <div className="w-7 h-7 rounded-full bg-slate-200" />
                <div className="h-3 w-28 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-[24px] p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                    <div className="h-5 w-20 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
              <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-8 w-20 bg-slate-100 rounded" />
                </div>
                <div className="h-12 w-36 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-16 space-y-20">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="h-7 w-48 bg-slate-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-200 rounded-[32px] h-32" />
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <p className="text-slate-600 font-bold text-sm text-center max-w-xs">{message}</p>
      <Link
        href="/dashboard/mini-mastery-programs"
        className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline underline-offset-4"
      >
        <ChevronLeft size={16} /> Back to Programs
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProgramDetails = () => {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  const { status: authStatus } = useSession();
  const isLoggedIn = authStatus === "authenticated";
  const router = useRouter()

  const { data: program, isLoading, isError, error } = useQuery({
    queryKey: ["mmp-detail", id],
    queryFn: () => fetchProgram(id),
    enabled: !!id,
    staleTime: 60_000,
  });

  const { data: statusData } = useQuery({
    queryKey: ["mmp-my-status"],
    queryFn: fetchMyStatuses,
    staleTime: 60_000,
    enabled: isLoggedIn,
  });

  const progStatus = program && statusData ? statusData.statuses[program.id] : undefined;

  if (isLoading) return <Skeleton />;

  if (isError) {
    const msg = axios.isAxiosError(error)
      ? (error.response?.data as { message?: string })?.message ?? "Program not found."
      : "Something went wrong.";
    return <ErrorState message={msg} />;
  }

  if (!program) return <ErrorState message="Program not found." />;

  const achievements = parseAchievements(program.achievements);
  const modules = parseModules(program.modules);
  const hasCert = !!program.certificateTitle;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-blue-100">

      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto px-4 pt-10">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors mb-6 group"
        >
          <div className="w-8 h-8 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center group-hover:shadow-md transition-all">
            <ArrowLeft size={15} className="text-slate-500" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-10 items-center">

          {/* Thumbnail */}
          <div className="w-full lg:w-1/2 aspect-video rounded-[32px] overflow-hidden shadow-2xl shadow-blue-100/50 bg-black relative group border-4 border-white">
            {program.thumbnailUrl ? (
              <img
                src={program.thumbnailUrl}
                alt={program.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
                <BookOpen size={48} className="text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />

            {/* Status overlay badge on thumbnail */}
            {isLoggedIn && progStatus?.completed && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-md">
                <Trophy size={11} /> Completed
              </div>
            )}
            {isLoggedIn && progStatus?.enrolled && !progStatus.completed && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-md">
                <PlayCircle size={11} /> Enrolled
              </div>
            )}
          </div>

          {/* Info */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="space-y-3">
              {/* Status badge below title */}
              <HeroStatusBadge status={progStatus} />

              <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                {program.unlockType === "daily" ? "Daily Unlock" : "Self-Guided Experience"}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {program.name}
              </h1>
              {program.description && (
                <p className="text-base text-slate-500 font-medium leading-relaxed max-w-md">
                  {program.description}
                </p>
              )}
              {program.creator && (
                <div className="flex items-center gap-2 pt-1">
                  {program.creator.image ? (
                    <img
                      src={program.creator.image}
                      alt={program.creator.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black">
                      {program.creator.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-400 italic">
                    by {program.creator.name}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                    <Clock size={12} /> Duration
                  </p>
                  <p className="text-lg font-bold text-slate-800">{program.durationDays ?? "?"} Days</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                    <GraduationCap size={12} /> Benefit
                  </p>
                  {hasCert ? (
                    <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <CheckCircle2 size={14} fill="currentColor" className="text-blue-50" />
                      Certificate Included
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-slate-400">No certificate</p>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Modules</p>
                  <p className="text-lg font-bold text-slate-800">{modules.length}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Unlock</p>
                  <p className="text-xs font-bold text-slate-700">
                    {program.unlockType === "daily" ? "One per day" : "All at once"}
                  </p>
                </div>
              </div>

              {/* CTA row */}
              <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Investment</p>
                  <p className="text-2xl font-black text-slate-900">
                    {formatPrice(program.price, program.currency)}
                  </p>
                </div>
                <EnrollButton
                  program={program}
                  status={progStatus}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 mt-16 space-y-20">

        {/* Achievements */}
        {achievements.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
                <Target size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{`What You'll Achieve`}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 p-5 rounded-2xl flex items-start gap-4 hover:border-blue-200 transition-colors group shadow-sm"
                >
                  <div className="mt-1 bg-blue-50 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">{ach}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Structure */}
        {modules.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
                  <LayoutPanelLeft size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Program Structure</h2>
              </div>
              <span className="text-xs font-bold text-slate-400 italic">
                {modules.length} Modules • {program.durationDays ?? modules.length} Days
              </span>
            </div>

            <div className="space-y-2.5">
              {modules.map((mod, idx) => (
                <div
                  key={mod.id ?? idx}
                  className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between group hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-blue-300 group-hover:text-blue-600 transition-colors">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className="text-sm font-bold text-slate-700">{mod.title}</h4>
                  </div>
                  <Lock size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors shrink-0" />
                </div>
              ))}

              {program.durationDays && program.durationDays > modules.length && (
                <div className="p-4 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                  Days {String(modules.length + 1).padStart(2, "0")} – {String(program.durationDays).padStart(2, "0")}: Advanced Content Unlocks Daily
                </div>
              )}
            </div>
          </section>
        )}

        {/* Completion banner */}
        <div className="bg-blue-600 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-xl shadow-blue-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-sm">
            <Info size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black italic">Completion Requirement</h3>
            <p className="text-blue-50 text-[12px] leading-relaxed max-w-2xl font-medium opacity-90">
              Requires{" "}
              <span className="font-black text-white">{program.completionThreshold ?? 100}% completion</span>{" "}
              and all daily tasks marked as done to unlock the{" "}
              <span className="font-black text-white">{program.certificateTitle ?? "certificate"}</span>.
              Complete within the platform to qualify for your official digital credential.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgramDetails;