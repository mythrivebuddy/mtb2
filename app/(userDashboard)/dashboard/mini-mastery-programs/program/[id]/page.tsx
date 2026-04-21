"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  Clock,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  MoreVertical,
  BookOpen,
  Loader2,
  AlertCircle,
  AlignLeft,
  Star,
  Download,
  Award,
  PartyPopper,
  X,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleItem {
  id: number;
  title: string;
  type: "video" | "text";
  videoUrl?: string;
  instructions: string;
  actionTask: string;
}

interface ProgressLog {
  id: string;
  dayNumber: number;
  isCompleted: boolean;
  completedAt: string | null;
  actionResponse: string | null;
}

interface CourseCompletion {
  id?: string;
  courseCompleted: boolean;
  courseCompletedAt: string | null;
  certificateDownloaded: boolean;
  certificateDownloadedAt: string | null;
  certificatePath: string | null;
  certificateUrl?: string | null;
  certificateId?: string | null;
}

interface PlayerData {
  enrolled: boolean;
  program?: {
    id: string;
    name: string;
    description: string | null;
    durationDays: number;
    unlockType: string;
    modules: unknown;
    completionThreshold: number;
    certificateTitle: string;
    thumbnailUrl: string | null;
    creator: { id: string; name: string | null; image: string | null } | null;
  };
  state?: {
    id: string;
    onboarded: boolean;
    onboardedAt: string | null;
    createdAt: string;
  };
  progress?: {
    logs: ProgressLog[];
    completedCount: number;
    totalDays: number;
    progressPct: number;
    activeDayNumber: number;
    isFullyCompleted: boolean;
  };
  courseCompletion?: CourseCompletion;
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
  enrolledAt: string,
): "completed" | "active" | "locked" {
  const log = logs.find((l) => l.dayNumber === dayNumber);
  if (log?.isCompleted) return "completed";

  if (unlockType === "all") return "active";

  if (dayNumber === 1) return "active";

  const prevLog = logs.find((l) => l.dayNumber === dayNumber - 1);
  if (!prevLog?.isCompleted) return "locked";

  const enrollDate = new Date(enrolledAt);
  const unlockDate = new Date(
    Date.UTC(
      enrollDate.getUTCFullYear(),
      enrollDate.getUTCMonth(),
      enrollDate.getUTCDate() + (dayNumber - 1),
    ),
  );

  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (todayUTC < unlockDate) return "locked";

  return "active";
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#06B6D4",
  "#F97316",
];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: "rect" | "circle" | "star";
  rotation: number;
}

function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) return;
    const newPieces: ConfettiPiece[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 6,
      delay: Math.random() * 1.2,
      duration: Math.random() * 2 + 2.5,
      shape: (["rect", "circle", "star"] as const)[
        Math.floor(Math.random() * 3)
      ],
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);

    // Auto-cleanup after animation
    const t = setTimeout(() => setPieces([]), 5000);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        >
          {p.shape === "circle" ? (
            <div
              style={{
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ) : p.shape === "star" ? (
            <div
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ) : (
            <div
              style={{
                width: p.size,
                height: p.size * 0.5,
                backgroundColor: p.color,
                borderRadius: 2,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          )}
        </div>
      ))}

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
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

// ─── Course Completed Modal ───────────────────────────────────────────────────

function CourseCompletedModal({
  certTitle,
  programName,
  onDownload,
  onClose,
  isDownloading = false,
}: {
  certTitle: string;
  programName: string;
  onDownload: () => void;
  onClose: () => void;
  isDownloading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <PartyPopper size={32} className="text-yellow-300" />
            </div>
            <p className="text-blue-200 text-xs font-black uppercase tracking-widest">
              🎉 Course Complete!
            </p>
            <h2 className="text-2xl font-black mt-1 leading-tight">
              {programName}
            </h2>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              You have successfully completed all modules. Your certificate is
              ready to download.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-amber-100">
              <Award size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                Certificate of Completion
              </p>
              <p className="text-sm font-black text-slate-800 truncate">
                {certTitle}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Preparing…
                </>
              ) : (
                <>
                  <Download size={18} /> Download Certificate
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-full text-slate-500 font-bold py-3 rounded-2xl hover:bg-slate-50 transition-colors text-sm"
            >
              View Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 🎉 Full Completion Celebration Modal ─────────────────────────────────────

function CourseFinishedCelebrationModal({
  programName,
  totalDays,
  onClose,
}: {
  programName: string;
  totalDays: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden relative text-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Top gradient burst */}
        <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 pt-10 pb-8 px-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 20%, white 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          {/* Trophy icon with glow */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/30 blur-xl" />
            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <Trophy size={40} className="text-yellow-500" />
            </div>
          </div>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mt-4">
            🎊 You did it!
          </p>
          <h2 className="text-white text-2xl font-black mt-1 leading-tight drop-shadow-sm">
            Course Complete!
          </h2>
        </div>

        {/* Body */}
        <div className="px-8 py-7 space-y-5">
          <div className="space-y-1">
            <p className="text-slate-800 font-black text-base leading-snug">
              {programName}
            </p>
            <p className="text-slate-500 text-sm font-medium">
              You completed all {totalDays} days. That&apos;s incredible
              dedication! 🔥
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex gap-3">
            <div className="flex-1 bg-green-50 border border-green-100 rounded-2xl py-3 px-2 text-center">
              <p className="text-2xl font-black text-green-600">{totalDays}</p>
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-wide">
                Days Done
              </p>
            </div>
            <div className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl py-3 px-2 text-center">
              <p className="text-2xl font-black text-blue-600">100%</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">
                Complete
              </p>
            </div>
            <div className="flex-1 bg-amber-50 border border-amber-100 rounded-2xl py-3 px-2 text-center">
              <p className="text-2xl font-black text-amber-500">🏆</p>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                Champion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Certificate Downloaded / Error Modal ─────────────────────────────────────

function CertificateDownloadedModal({
  certTitle,
  onClose,
  isError = false,
}: {
  certTitle: string;
  onClose: () => void;
  isError?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center space-y-5">
          <div
            className={`w-20 h-20 ${isError ? "bg-red-100" : "bg-green-100"} rounded-full flex items-center justify-center mx-auto`}
          >
            {isError ? (
              <AlertCircle size={40} className="text-red-500" />
            ) : (
              <CheckCircle2 size={40} className="text-green-500" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900">
              {isError ? "Download Failed" : "Certificate Downloaded!"}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {isError
                ? "Something went wrong while downloading your certificate. Please try again."
                : "Your certificate has been saved to your device."}
            </p>
          </div>

          {!isError && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Certificate
              </p>
              <p className="text-sm font-black text-slate-700 mt-0.5">
                {certTitle}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className={`w-full ${isError ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-slate-800"} text-white font-black py-3.5 rounded-2xl transition-all active:scale-95`}
          >
            {isError ? "Close" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Certificate Card ─────────────────────────────────────────────────────────

function CertificateCard({
  certTitle,
  progressPct,
  threshold,
  onDownload,
  alreadyDownloaded = false,
  isDownloading = false,
}: {
  certTitle: string;
  progressPct: number;
  threshold: number;
  onDownload: () => void;
  alreadyDownloaded?: boolean;
  isDownloading?: boolean;
}) {
  const unlocked = progressPct >= threshold;

  return (
    <div
      className={`rounded-[32px] p-6 border space-y-4 relative overflow-hidden transition-all ${
        unlocked
          ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg shadow-amber-50"
          : "bg-white border-slate-100"
      }`}
    >
      {unlocked && (
        <>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-yellow-200/30 rounded-full blur-xl pointer-events-none" />
        </>
      )}
      <div className="relative flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            unlocked
              ? "bg-amber-400 shadow-md shadow-amber-100"
              : "bg-slate-100"
          }`}
        >
          <Award
            size={20}
            className={unlocked ? "text-white" : "text-slate-300"}
          />
        </div>
        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${
              unlocked ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {unlocked ? "🎓 Certificate Unlocked" : "Certificate"}
          </p>
          <p className="text-sm font-black text-slate-800 leading-tight truncate max-w-[160px]">
            {certTitle}
          </p>
        </div>
      </div>

      {unlocked ? (
        alreadyDownloaded ? (
          <div className="space-y-2">
            <div className="w-full bg-green-100 text-green-700 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
              <CheckCircle2 size={15} /> Certificate Downloaded
            </div>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
            >
              {isDownloading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Download Again
            </button>
          </div>
        ) : (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="relative w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 shadow-md shadow-amber-100"
          >
            {isDownloading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Preparing…
              </>
            ) : (
              <>
                <Download size={15} /> Download Certificate
              </>
            )}
          </button>
        )
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>Progress needed</span>
            <span>
              {progressPct}% / {threshold}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (progressPct / threshold) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Complete {threshold - progressPct}% more to unlock
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgramPlayer() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const from_where_user_came = searchParams.get("from");
  const programId = params?.id as string;

  const [activeDay, setActiveDay] = useState<number>(1);
  const [actionResponse, setActionResponse] = useState<string>("");

  // Modal states
  const CELEBRATION_KEY = `mmp-celebration-shown-${programId}`;

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showDownloadedModal, setShowDownloadedModal] = useState(false);
  const [completionModalShown, setCompletionModalShown] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [certDownloading, setCertDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  // ── Fetch player data ──────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<PlayerData>({
    queryKey: ["program-player", programId],
    queryFn: async () => {
      const res = await axios.get<PlayerData>(
        `/api/mini-mastery-programs/player/${programId}`,
      );
      return res.data;
    },
    enabled: !!programId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      const name = data?.program?.name;
      toast.success(
        `🎉 Purchase Successful!\n\n` +
          `${name ? `${name}\n` : ""}` +
          `You are now enrolled.`,
      );
      // URL clean karo without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("orderId");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Redirect if not enrolled
  useEffect(() => {
    if (data && !data.enrolled) {
      router.replace("/dashboard/mini-mastery-programs");
    }
  }, [data, router]);

  // Set initial active day from API
  useEffect(() => {
    if (data?.progress?.activeDayNumber) {
      setActiveDay(data.progress.activeDayNumber);
    }
  }, [data?.progress?.activeDayNumber]);
  useEffect(() => {
    if (!data?.progress) return;

    const log = data.progress.logs.find((l) => l.dayNumber === activeDay);

    setActionResponse(log?.actionResponse || "");
  }, [activeDay, data?.progress]);

  // 🎉 Show CELEBRATION when all modules fully done (100%) — only ONCE ever
  // Persisted in localStorage so it never re-shows after the first visit
  useEffect(() => {
    if (!data?.progress?.isFullyCompleted) return;
    if (typeof window === "undefined") return;

    const alreadyShown = localStorage.getItem(CELEBRATION_KEY) === "1";
    if (alreadyShown) return;

    localStorage.setItem(CELEBRATION_KEY, "1");
    setConfettiActive(true);
    setTimeout(() => setShowCelebrationModal(true), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.progress?.isFullyCompleted]);

  // Show cert download modal when courseCompleted=true but not yet downloaded
  // Only if celebration was NOT just shown (avoid double modal)
  useEffect(() => {
    if (
      data?.courseCompletion?.courseCompleted &&
      !data?.courseCompletion?.certificateDownloaded &&
      !completionModalShown &&
      !data?.progress?.isFullyCompleted // don't show — celebration handles it
    ) {
      setShowCompletionModal(true);
      setCompletionModalShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.courseCompletion?.courseCompleted]);

  // ── Complete day mutation ──────────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: (vars: {
      dayNumber: number;
      actionResponse?: string;
      undo?: boolean;
    }) =>
      axios.post(
        `/api/mini-mastery-programs/player/${programId}/complete`,
        vars,
      ),
    onSuccess: async (_, vars) => {
      if (!vars.undo) {
        const current = qc.getQueryData<PlayerData>([
          "program-player",
          programId,
        ]);
        const totalDays = current?.progress?.totalDays ?? 0;
        const completed = current?.progress?.completedCount ?? 0;
        const isLastDay = totalDays > 0 && completed + 1 >= totalDays;
        const notRecorded = !current?.courseCompletion?.courseCompleted;

        if (isLastDay && notRecorded) {
          await markCompleteMutation.mutateAsync();
          return;
        }
      }
      if (vars.undo) {
        toast.success(`Day ${vars.dayNumber} marked incomplete`);
      } else {
        toast.success(`Day ${vars.dayNumber} completed 🎉 Keep going 🔥`);
      }
      void qc.invalidateQueries({ queryKey: ["program-player", programId] });
    },
  });

  // ── Mark course complete mutation ──────────────────────────────────────────
  const markCompleteMutation = useMutation({
    mutationFn: () =>
      axios.post(`/api/mini-mastery-programs/player/${programId}/completion`, {
        action: "mark_complete",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["program-player", programId] });
    },
  });

  // ── Certificate download handler ───────────────────────────────────────────
  async function handleDownloadCertificate() {
    setCertDownloading(true);
    setShowCompletionModal(false);
    try {
      const res = await axios.post<{
        success: boolean;
        certificate: { certificateUrl: string; certificateId: string };
        pngUrl: string;
      }>(`/api/mini-mastery-programs/player/${programId}/certificate`);

      const certUrl = res.data.pngUrl ?? res.data.certificate?.certificateUrl;
      if (certUrl) {
        const response = await fetch(certUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `certificate-${programId}.webp`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(blobUrl);
      }
      void qc.invalidateQueries({ queryKey: ["program-player", programId] });

      setDownloadError(false);
      setShowDownloadedModal(true);
    } catch (err) {
      console.error("Certificate download failed:", err);
      setDownloadError(true);
      setShowDownloadedModal(true);
    } finally {
      setCertDownloading(false);
    }
  }
  const handleBack = () => {
    if (
      typeof from_where_user_came === "string" &&
      from_where_user_came.length > 0
    ) {
      router.push(`/${from_where_user_came}`);
    } else {
      router.push(`/dashboard/mini-mastery-programs`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) return <PlayerSkeleton />;

  if (isError || !data?.enrolled || !data.program || !data.progress) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={40} className="text-slate-300 mx-auto" />
          <p className="text-slate-500 font-bold">Unable to load program.</p>
          <Link
            href="/dashboard/mini-mastery-programs"
            className="inline-block text-blue-600 font-bold text-sm underline"
          >
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
  const enrolledAt = data.state?.createdAt ?? new Date().toISOString();

  const currentLog = logs.find((l) => l.dayNumber === activeDay);
  const isDayComplete = currentLog?.isCompleted ?? false;
  const dayStatus = getDayStatus(
    activeDay,
    logs,
    program.unlockType,
    enrolledAt,
  );
  const isLocked = dayStatus === "locked";

  return (
    <div className="min-h-screen max-sm:mx-4 bg-slate-50">
      {/* ── Confetti ── */}
      <Confetti active={confettiActive} />

      {/* ── Modals ── */}
      {showCelebrationModal && (
        <CourseFinishedCelebrationModal
          programName={program.name}
          totalDays={progress.totalDays}
          onClose={() => {
            setShowCelebrationModal(false);
            // After celebration closes — show cert download modal if not yet downloaded
            if (
              !data.courseCompletion?.certificateDownloaded &&
              !completionModalShown
            ) {
              setCompletionModalShown(true);
              setTimeout(() => setShowCompletionModal(true), 200);
            }
          }}
        />
      )}
      {showCompletionModal && (
        <CourseCompletedModal
          certTitle={program.certificateTitle}
          programName={program.name}
          onDownload={handleDownloadCertificate}
          onClose={() => setShowCompletionModal(false)}
          isDownloading={certDownloading}
        />
      )}
      {showDownloadedModal && (
        <CertificateDownloadedModal
          certTitle={program.certificateTitle}
          onClose={() => {
            setShowDownloadedModal(false);
            setDownloadError(false);
          }}
          isError={downloadError}
        />
      )}

      {/* ── Top Nav ── */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>

          <div>
            <h2 className="font-black text-slate-900 leading-none">
              {program.name}
            </h2>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
              Day {activeDay} of {progress.totalDays}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-blue-600">
              {progress.progressPct}%
            </span>
          </div>
          <button className="p-2 hover:bg-slate-50 rounded-full">
            <MoreVertical size={20} className="text-slate-400" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
        {/* ── LEFT ── */}
        <div className="flex-1 space-y-8">
          {isLocked ? (
            <div className="aspect-video bg-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <Lock size={28} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-400 text-lg">
                  Day {activeDay} is Locked
                </p>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  Day {activeDay} will unlock tomorrow.
                </p>
              </div>
            </div>
          ) : (
            <>
              {currentModule?.type === "video" && currentModule.videoUrl ? (
                <div className="aspect-video bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative">
                  <iframe
                    src={currentModule.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentModule.title}
                  />
                  {isDayComplete && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                      <CheckCircle2 size={11} /> Completed
                    </div>
                  )}
                </div>
              ) : currentModule?.type === "text" ? (
                <div className="relative rounded-[40px] overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 min-h-[320px] flex flex-col justify-between p-10">
                  <div className="absolute -top-10 -right-10 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
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
                          className={`w-6 h-6 rounded-full border-2 border-blue-950 ${
                            i === 0
                              ? "bg-blue-400"
                              : i === 1
                                ? "bg-indigo-400"
                                : "bg-slate-500"
                          }`}
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

              {currentModule && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                    <div
                      className={`w-2 h-2 rounded-full ${isDayComplete ? "bg-green-500" : "bg-blue-600 animate-pulse"}`}
                    />
                    {isDayComplete ? "Completed" : "Active Module"}
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    Day {activeDay}: {currentModule.title}
                  </h1>
                  <div
                    className="text-lg text-slate-500 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{
                      __html: currentModule.instructions,
                    }}
                  />
                </div>
              )}

              {currentModule && (
                <div
                  className={`border rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden transition-all ${
                    isDayComplete
                      ? "bg-green-50 border-green-100"
                      : "bg-white border-blue-100"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                        isDayComplete ? "bg-green-500" : "bg-blue-600"
                      }`}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">
                      {isDayComplete
                        ? "Task Completed ✓"
                        : "Today's Action Task"}
                    </h3>
                  </div>
                  <div
                    className="text-slate-600 font-medium leading-relaxed 
             [&_ul]:list-disc [&_ul]:pl-5 
             [&_ol]:list-decimal [&_ol]:pl-5 
             [&_li]:mb-1"
                    dangerouslySetInnerHTML={{
                      __html: currentModule.actionTask,
                    }}
                  />

                  {!isDayComplete && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-blue-600">
                        ✍️ Your response <span className="text-red-500">*</span>
                      </p>
                      {/* {showResponse && ( */}
                      <textarea
                        value={actionResponse}
                        onChange={(e) => setActionResponse(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder="Write your thoughts or answer here..."
                        className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium resize-none"
                      />
                      {/* )} */}
                    </div>
                  )}

                  {isDayComplete && currentLog?.actionResponse && (
                    <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-1">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                        Your Response
                      </p>
                      <div
                        className="text-sm text-slate-600 font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: currentLog.actionResponse || "",
                        }}
                      />
                    </div>
                  )}

                  {!isDayComplete ? (
                    <button
                      onClick={() => {
                        if (!actionResponse.trim()) {
                          toast.error(
                            "Please write your response before marking as complete.",
                          );
                          return;
                        }
                        completeMutation.mutate({
                          dayNumber: activeDay,
                          actionResponse,
                        });
                      }}
                      disabled={completeMutation.isPending}
                      className="text-xs sm:text-sm w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black max-sm:px-2 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 active:scale-95"
                    >
                      {completeMutation.isPending ? (
                        <>
                          <Loader2 size={20} className="animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          Mark Day {activeDay} as Complete{" "}
                          <CheckCircle2 size={20} />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-green-100 text-green-700 font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                        <CheckCircle2 size={18} /> Day {activeDay} Complete!
                      </div>
                      <button
                        onClick={() =>
                          completeMutation.mutate({
                            dayNumber: activeDay,
                            undo: true,
                          })
                        }
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
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Program Progress
              </span>
              <span className="text-sm font-black text-blue-600">
                {progress.progressPct}%
              </span>
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
              <div
                className={`flex items-center gap-1 text-[11px] font-black uppercase italic ${
                  progress.isFullyCompleted ? "text-green-600" : "text-blue-600"
                }`}
              >
                {progress.isFullyCompleted ? (
                  <>
                    <Trophy size={12} /> Complete!
                  </>
                ) : (
                  <>
                    <Clock size={12} /> Active
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {modules.map((_, i) => {
                const dn = i + 1;
                const st = getDayStatus(
                  dn,
                  logs,
                  program.unlockType,
                  enrolledAt,
                );
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

          <CertificateCard
            certTitle={program.certificateTitle}
            progressPct={progress.progressPct}
            threshold={program.completionThreshold}
            onDownload={handleDownloadCertificate}
            alreadyDownloaded={
              data.courseCompletion?.certificateDownloaded ?? false
            }
            isDownloading={certDownloading}
          />

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Curriculum
            </h4>
            <div className="space-y-2">
              {modules.map((mod, i) => {
                const dn = i + 1;
                const status = getDayStatus(
                  dn,
                  logs,
                  program.unlockType,
                  enrolledAt,
                );
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
                        <span
                          className={`text-xs font-black block ${isActive ? "text-blue-900" : "text-slate-500"}`}
                        >
                          Day {dn}
                        </span>
                        <span
                          className={`text-sm font-bold truncate block ${isActive ? "text-blue-800" : "text-slate-700"}`}
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
                            isActive ? "text-blue-400" : "text-slate-300"
                          }
                        />
                      ) : (
                        <AlignLeft
                          size={14}
                          className={
                            isActive ? "text-blue-400" : "text-slate-300"
                          }
                        />
                      )}
                      {isActive && (
                        <ChevronRight size={15} className="text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-600 rounded-[32px] p-6 text-white space-y-4 relative overflow-hidden group shadow-lg shadow-blue-100">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Lightbulb size={80} />
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-blue-200" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Pro Tip
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-blue-100">
              Completing modules consistently — even small ones — builds the
              habit loop that drives long-term transformation.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Star size={12} className="text-yellow-300 fill-yellow-300" />
              <span className="text-[10px] font-bold text-blue-100">
                {progress.completedCount} day
                {progress.completedCount !== 1 ? "s" : ""} completed so far
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
