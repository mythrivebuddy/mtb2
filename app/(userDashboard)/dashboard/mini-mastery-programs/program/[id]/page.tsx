"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlayCircle, CheckCircle2, Lock, Clock, ChevronRight,
  Lightbulb, ArrowLeft, MoreVertical, BookOpen,
  Trophy, Loader2, AlertCircle, AlignLeft, Star,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleItem {
  id:           number;
  title:        string;
  type:         "video" | "text";
  videoUrl?:    string;
  instructions: string;
  actionTask:   string;
}

interface ProgressLog {
  id:             string;
  dayNumber:      number;
  isCompleted:    boolean;
  completedAt:    string | null;
  actionResponse: string | null;
}

interface PlayerData {
  enrolled: boolean;
  program?: {
    id:                  string;
    name:                string;
    description:         string | null;
    durationDays:        number;
    unlockType:          string;
    modules:             unknown;
    completionThreshold: number;
    certificateTitle:    string;
    thumbnailUrl:        string | null;
    creator:             { id: string; name: string | null; image: string | null } | null;
  };
  state?: {
    id:           string;
    onboarded:    boolean;
    onboardedAt:  string | null;
    createdAt:    string;
  };
  progress?: {
    logs:              ProgressLog[];
    completedCount:    number;
    totalDays:         number;
    progressPct:       number;
    activeDayNumber:   number;
    isFullyCompleted:  boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseModules(raw: unknown): ModuleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw as ModuleItem[];
}

function getDayStatus(
  dayNumber: number,
  logs: ProgressLog[],
  unlockType: string,
  enrolledAt: string,   // UserProgramState.createdAt
): "completed" | "active" | "locked" {
  const log = logs.find((l) => l.dayNumber === dayNumber);
  if (log?.isCompleted) return "completed";

  // "all" unlock type — everything always open
  if (unlockType === "all") return "active";

  // "daily" unlock — day N opens when:
  //   1. Day N-1 is completed, AND
  //   2. At least (N-1) calendar days have passed since enrollment
  if (dayNumber === 1) return "active"; // day 1 always open

  const prevLog = logs.find((l) => l.dayNumber === dayNumber - 1);
  if (!prevLog?.isCompleted) return "locked"; // prev not done → locked

  // Date gate: enrolled + (dayNumber - 1) days must have passed
  const enrollDate = new Date(enrolledAt);
  enrollDate.setHours(0, 0, 0, 0);
  const unlockDate = new Date(enrollDate);
  unlockDate.setDate(unlockDate.getDate() + (dayNumber - 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today < unlockDate) return "locked"; // too early

  return "active";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PlayerSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="h-16 bg-white border-b border-slate-100" />
      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-8">
          <div className="aspect-video bg-slate-200 rounded-[40px]" />
          <div className="space-y-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-10 w-2/3 bg-slate-200 rounded-xl" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
          </div>
          <div className="bg-white rounded-[32px] p-8 space-y-4">
            <div className="h-6 w-48 bg-slate-100 rounded" />
            {[1, 2, 3].map((i) => <div key={i} className="h-4 w-full bg-slate-100 rounded" />)}
            <div className="h-14 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-[32px] p-6 h-32" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-white rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Completed Banner ─────────────────────────────────────────────────────────

function CompletedBanner({ certTitle }: { certTitle: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white space-y-4 shadow-xl shadow-blue-200 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />
      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
        <Trophy size={28} className="text-yellow-300" />
      </div>
      <div>
        <p className="text-blue-200 text-xs font-black uppercase tracking-widest">
          Program Complete 🎉
        </p>
        <h2 className="text-2xl font-black mt-1">{certTitle}</h2>
      </div>
      <p className="text-blue-100 text-sm font-medium">
        You have completed all modules. Your certificate is being prepared.
      </p>
      <button className="bg-white text-blue-700 font-black px-6 py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
        <Trophy size={16} /> View Certificate
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgramPlayer() {
  const params    = useParams();
  const router    = useRouter();
  const qc        = useQueryClient();
  const programId = params?.id as string;

  const [activeDay,      setActiveDay]      = useState<number>(1);
  const [actionResponse, setActionResponse] = useState<string>("");
  const [showResponse,   setShowResponse]   = useState(false);

  // ── Fetch player data ──────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<PlayerData>({
    queryKey: ["program-player", programId],
    queryFn:  async () => {
      const res = await axios.get<PlayerData>(
        `/api/mini-mastery-programs/player/${programId}`
      );
      return res.data;
    },
    enabled: !!programId,
    staleTime: 30_000,
  });

  // Redirect if not enrolled
  useEffect(() => {
    if (data && !data.enrolled) {
      router.replace("/dashboard/mini-mastery-programs");
    }
  }, [data, router]);

  // Set initial active day from API (= first incomplete day)
  useEffect(() => {
    if (data?.progress?.activeDayNumber) {
      setActiveDay(data.progress.activeDayNumber);
    }
  }, [data?.progress?.activeDayNumber]);

  // ── Complete day mutation ──────────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: (vars: { dayNumber: number; actionResponse?: string; undo?: boolean }) =>
      axios.post(`/api/mini-mastery-programs/player/${programId}/complete`, vars),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["program-player", programId] });
      setShowResponse(false);
      setActionResponse("");
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) return <PlayerSkeleton />;

  if (isError || !data?.enrolled || !data.program || !data.progress) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={40} className="text-slate-300 mx-auto" />
          <p className="text-slate-500 font-bold">Unable to load program.</p>
          <Link href="/dashboard/mini-mastery-programs"
            className="inline-block text-blue-600 font-bold text-sm underline">
            Back to Programs
          </Link>
        </div>
      </div>
    );
  }

  const { program, progress } = data;
  const modules = parseModules(program.modules);
  const currentModule = modules[activeDay - 1];
  const logs = progress.logs;

  const enrolledAt    = data.state?.createdAt ?? new Date().toISOString();

  // Current day log
  const currentLog    = logs.find((l) => l.dayNumber === activeDay);
  const isDayComplete = currentLog?.isCompleted ?? false;
  const dayStatus     = getDayStatus(activeDay, logs, program.unlockType, enrolledAt);
  const isLocked      = dayStatus === "locked";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Nav ── */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/mini-mastery-programs">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
          </Link>
          <div>
            <h2 className="font-black text-slate-900 leading-none">{program.name}</h2>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
              Day {activeDay} of {progress.totalDays}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mini progress pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-blue-600">{progress.progressPct}%</span>
          </div>
          <button className="p-2 hover:bg-slate-50 rounded-full">
            <MoreVertical size={20} className="text-slate-400" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-10">

        {/* ── LEFT: Main Content ── */}
        <div className="flex-1 space-y-8">

          {/* Fully completed banner */}
          {progress.isFullyCompleted && (
            <CompletedBanner certTitle={program.certificateTitle} />
          )}

          {/* Locked day overlay */}
          {isLocked ? (
            <div className="aspect-video bg-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <Lock size={28} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-400 text-lg">Day {activeDay} is Locked</p>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  Complete Day {activeDay - 1} to unlock this module.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Video / Text Module ── */}
              {currentModule?.type === "video" && currentModule.videoUrl ? (
                <div className="aspect-video bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative group">
                  <iframe
                    src={currentModule.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentModule.title}
                  />
                  {/* Completed overlay */}
                  {isDayComplete && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                      <CheckCircle2 size={11} /> Completed
                    </div>
                  )}
                </div>
              ) : currentModule?.type === "text" ? (
                // ── Rich text module card — image-like appearance ──
                <div className="relative rounded-[40px] overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 min-h-[320px] flex flex-col justify-between p-10">
                  {/* Decorative blobs */}
                  <div className="absolute -top-10 -right-10 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Top badge row */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                        <AlignLeft size={17} className="text-white" />
                      </div>
                      <div>
                        <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest block">
                          Text Module
                        </span>
                        <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                          Day {activeDay}
                        </span>
                      </div>
                    </div>
                    {isDayComplete && (
                      <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black px-3 py-1 rounded-full">
                        <CheckCircle2 size={11} /> Completed
                      </div>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="relative space-y-5 my-6">
                    <h3 className="text-3xl font-black text-white leading-tight tracking-tight">
                      {currentModule.title}
                    </h3>
                    <p className="text-blue-100/80 text-base font-medium leading-relaxed line-clamp-5">
                      {currentModule.instructions}
                    </p>
                  </div>

                  {/* Bottom row — decorative */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full border-2 border-blue-950 ${
                          i === 0 ? "bg-blue-400" : i === 1 ? "bg-indigo-400" : "bg-slate-500"
                        }`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      <BookOpen size={12} /> Read & Reflect
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-slate-200 rounded-[40px] flex items-center justify-center">
                  <BookOpen size={40} className="text-slate-300" />
                </div>
              )}

              {/* ── Module Description ── */}
              {currentModule && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                    <div className={`w-2 h-2 rounded-full ${isDayComplete ? "bg-green-500" : "bg-blue-600 animate-pulse"}`} />
                    {isDayComplete ? "Completed" : "Active Module"}
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    Day {activeDay}: {currentModule.title}
                  </h1>
                  <p className="text-lg text-slate-500 leading-relaxed font-medium">
                    {currentModule.instructions}
                  </p>
                </div>
              )}

              {/* ── Action Task Card ── */}
              {currentModule && (
                <div className={`border rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden transition-all ${
                  isDayComplete
                    ? "bg-green-50 border-green-100"
                    : "bg-white border-blue-100"
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl" />

                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      isDayComplete ? "bg-green-500" : "bg-blue-600"
                    }`}>
                      <CheckCircle2 size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">
                      {isDayComplete ? "Task Completed ✓" : "Today's Action Task"}
                    </h3>
                  </div>

                  <p className="text-slate-600 font-medium leading-relaxed">
                    {currentModule.actionTask}
                  </p>

                  {/* Action response textarea */}
                  {!isDayComplete && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowResponse((v) => !v)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                      >
                        {showResponse ? "▲ Hide response" : "▼ Write your response (optional)"}
                      </button>
                      {showResponse && (
                        <textarea
                          value={actionResponse}
                          onChange={(e) => setActionResponse(e.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder="Write your thoughts or answer here..."
                          className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium resize-none"
                        />
                      )}
                    </div>
                  )}

                  {/* Previous response */}
                  {isDayComplete && currentLog?.actionResponse && (
                    <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-1">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                        Your Response
                      </p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {currentLog.actionResponse}
                      </p>
                    </div>
                  )}

                  {/* CTA Button */}
                  {!isDayComplete ? (
                    <button
                      onClick={() =>
                        completeMutation.mutate({
                          dayNumber: activeDay,
                          actionResponse: actionResponse || undefined,
                        })
                      }
                      disabled={completeMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 active:scale-95"
                    >
                      {completeMutation.isPending ? (
                        <><Loader2 size={20} className="animate-spin" /> Saving…</>
                      ) : (
                        <>Mark Day {activeDay} as Complete <CheckCircle2 size={20} /></>
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-green-100 text-green-700 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                        <CheckCircle2 size={18} /> Day {activeDay} Complete!
                      </div>
                      <button
                        onClick={() => completeMutation.mutate({ dayNumber: activeDay, undo: true })}
                        disabled={completeMutation.isPending}
                        className="px-5 text-slate-400 hover:text-red-500 font-bold text-xs border border-slate-200 rounded-2xl hover:border-red-200 transition-colors disabled:opacity-40"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="w-full lg:w-80 space-y-6">

          {/* Progress Card */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Program Progress
              </span>
              <span className="text-sm font-black text-blue-600">{progress.progressPct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${progress.progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-3">
              <p className="text-[11px] font-bold text-slate-400">
                {progress.completedCount} of {progress.totalDays} Days
              </p>
              <div className="flex items-center gap-1 text-[11px] font-black text-blue-600 uppercase italic">
                <Clock size={12} /> Active
              </div>
            </div>
            {/* Day dots */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {modules.map((_, i) => {
                const dn  = i + 1;
                const st  = getDayStatus(dn, logs, program.unlockType, enrolledAt);
                return (
                  <button
                    key={dn}
                    onClick={() => st !== "locked" && setActiveDay(dn)}
                    disabled={st === "locked"}
                    title={`Day ${dn}`}
                    className={`w-6 h-6 rounded-lg text-[9px] font-black transition-all ${
                      dn === activeDay
                        ? "bg-blue-600 text-white scale-110 shadow-md shadow-blue-200"
                        : st === "completed"
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : st === "locked"
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {dn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Curriculum List */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Curriculum
            </h4>
            <div className="space-y-2">
              {modules.map((mod, i) => {
                const dn     = i + 1;
                const status = getDayStatus(dn, logs, program.unlockType, enrolledAt);
                const isActive = dn === activeDay;

                return (
                  <button
                    key={mod.id ?? dn}
                    onClick={() => status !== "locked" && setActiveDay(dn)}
                    disabled={status === "locked"}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left ${
                      isActive
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : status === "completed"
                        ? "bg-white border-slate-100 opacity-70 hover:opacity-100"
                        : status === "locked"
                        ? "bg-white border-slate-50 opacity-40 cursor-not-allowed"
                        : "bg-white border-slate-100 hover:border-blue-100 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {status === "completed" ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : status === "locked" ? (
                          <Lock size={18} className="text-slate-300" />
                        ) : isActive ? (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-black block ${
                          isActive ? "text-blue-900" : "text-slate-500"
                        }`}>
                          Day {dn}
                        </span>
                        <span className={`text-sm font-bold truncate block ${
                          isActive ? "text-blue-800" : "text-slate-700"
                        }`}>
                          {mod.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {mod.type === "video" ? (
                        <PlayCircle size={14} className={isActive ? "text-blue-400" : "text-slate-300"} />
                      ) : (
                        <AlignLeft size={14} className={isActive ? "text-blue-400" : "text-slate-300"} />
                      )}
                      {isActive && <ChevronRight size={15} className="text-blue-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Execution Tip Box */}
          <div className="bg-blue-600 rounded-[32px] p-6 text-white space-y-4 relative overflow-hidden group shadow-lg shadow-blue-100">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Lightbulb size={80} />
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-blue-200" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pro Tip</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-blue-100">
              Completing modules consistently — even small ones — builds the habit loop that drives
              long-term transformation.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Star size={12} className="text-yellow-300 fill-yellow-300" />
              <span className="text-[10px] font-bold text-blue-100">
                {progress.completedCount} day{progress.completedCount !== 1 ? "s" : ""} completed so far
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}