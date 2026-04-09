"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  Clock,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  BookOpen,
  AlertCircle,
  AlignLeft,
  Star,
  Award,
  Eye,
  MoreVertical,
} from "lucide-react";
import Share from "../common/ShareModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleItem {
  id: number;
  title: string;
  type: "video" | "text";
  videoUrl?: string;
  instructions: string;
  actionTask: string;
}

interface PreviewData {
  isPreview: boolean;
  program: {
    id: string;
    name: string;
    description: string | null;
    durationDays: number;
    unlockType: string;
    modules: unknown;
    completionThreshold: number;
    certificateTitle: string;
    thumbnailUrl: string | null;
    status: string;
    creator: { id: string; name: string | null; image: string | null } | null;
  };
  progress: {
    logs: [];
    completedCount: number;
    totalDays: number;
    progressPct: number;
    activeDayNumber: number;
    isFullyCompleted: boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseModules(raw: unknown): ModuleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw as ModuleItem[];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PreviewSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="h-16 bg-white border-b border-slate-100" />
      <div className="h-12 bg-amber-50 border-b border-amber-100" />
      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-8">
          <div className="aspect-video bg-slate-200 rounded-[40px]" />
          <div className="space-y-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-10 w-2/3 bg-slate-200 rounded-xl" />
            <div className="h-4 w-full bg-slate-200 rounded" />
          </div>
          <div className="bg-white rounded-[32px] p-8 space-y-4">
            <div className="h-6 w-48 bg-slate-100 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full bg-slate-100 rounded" />
            ))}
            <div className="h-14 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-[32px] p-6 h-32" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-white rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Banner ───────────────────────────────────────────────────────────

function PreviewBanner({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
    PUBLISHED: "bg-green-50 text-green-700 border-green-200",
  };
  const colorClass = statusColors[status] ?? statusColors.DRAFT;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
          <Eye size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-amber-800">
            Preview Mode — This is how learners will see your program
          </p>
          <p className="text-[10px] text-amber-600 font-medium">
            Actions are disabled. All modules are unlocked for review.
          </p>
        </div>
      </div>
      <span
        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${colorClass}`}
      >
        {status}
      </span>
    </div>
  );
}

// ─── Certificate Preview Card ─────────────────────────────────────────────────

function CertificatePreviewCard({
  certTitle,
  threshold,
}: {
  certTitle: string;
  threshold: number;
}) {
  return (
    <div className="rounded-[32px] p-6 border space-y-4 bg-white border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
          <Award size={20} className="text-slate-300" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Certificate
          </p>
          <p className="text-sm font-black text-slate-800 leading-tight truncate max-w-[160px]">
            {certTitle}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>Unlock requirement</span>
          <span>{threshold}% completion</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-200 rounded-full w-0" />
        </div>
        <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg inline-block">
          ⚠ Certificate actions disabled in preview
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgramPreview({ programId }: { programId: string }) {
  const router = useRouter();

  const [activeDay, setActiveDay] = useState<number>(1);

  const { data, isLoading, isError } = useQuery<PreviewData>({
    queryKey: ["program-preview", programId],
    queryFn: async () => {
      const res = await axios.get<PreviewData>(
        `/api/mini-mastery-programs/preview/${programId}`,
      );
      return res.data;
    },
    enabled: !!programId,
    staleTime: 60_000,
    retry: false,
  });

  // Redirect if forbidden (non-creator, non-admin)
  useEffect(() => {
    if (isError) {
      router.replace("/dashboard/mini-mastery-programs");
    }
  }, [isError, router]);

  if (isLoading) return <PreviewSkeleton />;

  if (isError || !data?.program) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={40} className="text-slate-300 mx-auto" />
          <p className="text-slate-500 font-bold">Unable to load preview.</p>
          <button
            onClick={() => router.back()}
            className="inline-block text-blue-600 font-bold text-sm underline"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  const { program, progress } = data;
  const modules = parseModules(program.modules);
  const currentModule = modules[activeDay - 1];
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/mini-mastery-programs/${program.id}`
      : "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Nav ── */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h2 className="font-black text-slate-900 leading-none">
              {program.name}
            </h2>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1 flex items-center gap-1">
              <Eye size={10} /> Preview Mode · Day {activeDay} of{" "}
              {progress.totalDays}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {program.status === "PUBLISHED" && (
            <Share url={shareUrl} title={program.name} />
          )}
          <div className="hidden sm:flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
            <Eye size={12} className="text-amber-500" />
            <span className="text-[10px] font-black text-amber-600">
              Preview
            </span>
          </div>
          <button className="p-2 hover:bg-slate-50 rounded-full">
            <MoreVertical size={20} className="text-slate-400" />
          </button>
        </div>
      </nav>

      {/* ── Preview Banner ── */}
      <PreviewBanner status={program.status} />

      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
        {/* ── LEFT ── */}
        <div className="flex-1 space-y-8">
          {/* Video or Text module */}
          {currentModule?.type === "video" && currentModule.videoUrl ? (
            <div className="aspect-video bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative">
              <iframe
                src={currentModule.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentModule.title}
              />
              {/* Preview badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                <Eye size={10} /> Preview
              </div>
            </div>
          ) : currentModule?.type === "text" ? (
            <div className="relative rounded-[40px] overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 min-h-[320px] flex flex-col justify-between p-10">
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
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
                <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full">
                  <Eye size={10} /> Preview
                </div>
              </div>
              <div className="relative space-y-5 my-6">
                <h3 className="text-3xl font-black text-white leading-tight tracking-tight">
                  {currentModule.title}
                </h3>
                <div
                  className="text-blue-100/80 text-base font-medium leading-relaxed line-clamp-5"
                  dangerouslySetInnerHTML={{
                    __html: currentModule.instructions,
                  }}
                />
              </div>
              <div className="relative flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full border-2 border-blue-950 ${i === 0 ? "bg-blue-400" : i === 1 ? "bg-indigo-400" : "bg-slate-500"}`}
                    />
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

          {/* Module Info */}
          {currentModule && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">
                <Eye size={12} /> Preview · Day {activeDay}
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Day {activeDay}: {currentModule.title}
              </h1>
              <div
                className="text-lg text-slate-500 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: currentModule.instructions }}
              />
            </div>
          )}

          {/* Action Task — read only */}
          {currentModule && (
            <div className="border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6 bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-slate-400">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Today&apos;s Action Task
                </h3>
              </div>
              <div
                className="text-slate-600 font-medium leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentModule.actionTask }}
              />

              {/* Disabled textarea placeholder */}
              <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-400 font-medium cursor-not-allowed">
                Learner response area (disabled in preview)
              </div>

              {/* Disabled complete button */}
              <div className="w-full bg-slate-100 text-slate-400 font-black py-5 rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed select-none border-2 border-dashed border-slate-200">
                <Lock size={18} /> Mark Complete (disabled in preview)
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Progress card */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Program Progress
              </span>
              <span className="text-sm font-black text-amber-500 flex items-center gap-1">
                <Eye size={12} /> Preview
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-200 rounded-full w-0" />
            </div>
            <div className="flex justify-between mt-3">
              <p className="text-[11px] font-bold text-slate-400">
                0 of {progress.totalDays} Days
              </p>
              <div className="flex items-center gap-1 text-[11px] font-black uppercase italic text-slate-400">
                <Clock size={12} /> Preview
              </div>
            </div>

            {/* Day grid — all active */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {modules.map((_, i) => {
                const dn = i + 1;
                return (
                  <button
                    key={dn}
                    onClick={() => setActiveDay(dn)}
                    title={`Day ${dn}`}
                    className={`w-6 h-6 rounded-lg text-[9px] font-black transition-all ${
                      dn === activeDay
                        ? "bg-amber-500 text-white scale-110 shadow-md shadow-amber-200"
                        : "bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                    }`}
                  >
                    {dn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Certificate preview */}
          <CertificatePreviewCard
            certTitle={program.certificateTitle}
            threshold={program.completionThreshold}
          />

          {/* Curriculum */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Curriculum
            </h4>
            <div className="space-y-2">
              {modules.map((mod, i) => {
                const dn = i + 1;
                const isActive = dn === activeDay;
                return (
                  <button
                    key={mod.id ?? dn}
                    onClick={() => setActiveDay(dn)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left ${
                      isActive
                        ? "bg-amber-50 border-amber-200 shadow-sm"
                        : "bg-white border-slate-100 hover:border-amber-100 hover:bg-amber-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {isActive ? (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-black block ${isActive ? "text-amber-700" : "text-slate-500"}`}
                        >
                          Day {dn}
                        </span>
                        <span
                          className={`text-sm font-bold truncate block ${isActive ? "text-amber-800" : "text-slate-700"}`}
                        >
                          {mod.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {mod.type === "video" ? (
                        <PlayCircle
                          size={14}
                          className={
                            isActive ? "text-amber-400" : "text-slate-300"
                          }
                        />
                      ) : (
                        <AlignLeft
                          size={14}
                          className={
                            isActive ? "text-amber-400" : "text-slate-300"
                          }
                        />
                      )}
                      {isActive && (
                        <ChevronRight size={15} className="text-amber-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pro tip */}
          <div className="bg-amber-500 rounded-[32px] p-6 text-white space-y-4 relative overflow-hidden group shadow-lg shadow-amber-100">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Lightbulb size={80} />
            </div>
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-amber-200" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Preview Mode
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-amber-100">
              You are viewing this program as a learner would see it. All{" "}
              {progress.totalDays} days are unlocked for review. Actions are
              disabled.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Star size={12} className="text-yellow-300 fill-yellow-300" />
              <span className="text-[10px] font-bold text-amber-100">
                {progress.totalDays} day program · Read-only mode
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
