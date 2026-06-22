"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Lock,
  Clock,
  GraduationCap,
  ArrowRight,
  Target,
  LayoutPanelLeft,
  Info,
  AlertCircle,
  ChevronLeft,
  BookOpen,
  PlayCircle,
  Trophy,
  LogIn,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  ModuleItem,
  MyStatusResponse,
  Program,
  ProgramCompStatus,
} from "@/types/client/mini-mastery-program";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { DashboardContent } from "@/types/client/dashboard";
import Share from "../common/ShareModal";
import { useReferralAndRedirect } from "@/hooks/use-save-refferral-redirect";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number | null, currency: string | null): string {
  if (!price || price === 0) return "FREE";
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${price.toLocaleString("en-IN")}`;
}

function parseAchievements(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((v): v is string => typeof v === "string");
  return [];
}

function parseModules(raw: unknown): ModuleItem[] {
  if (Array.isArray(raw)) return raw as ModuleItem[];
  return [];
}

async function fetchMyStatuses(): Promise<MyStatusResponse> {
  const { data } = await axios.get<MyStatusResponse>(
    "/api/mini-mastery-programs/my-status",
  );
  return data;
}

// ─── CTA Button ───────────────────────────────────────────────────────────────

function EnrollButton({
  program,
  status,
  isLoggedIn,
  redirectToSignin
}: {
  program: Program;
  status?: ProgramCompStatus;
  isLoggedIn: boolean;
  redirectToSignin: (router: AppRouterInstance) => void; 
}) {
  const isPaid = (program.price ?? 0) > 0;
  const router = useRouter();
  const queryClient = useQueryClient();
  const enrollMutation = useMutation({
    mutationFn: async (programId: string) => {
      const res = await axios.post(
        "/api/mini-mastery-programs/enroll-for-free",
        { programId },
      );
      return res.data;
    },

    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData<MyStatusResponse>(["mmp-my-status"], (old) => {
          if (!old) return old;

          return {
            ...old,
            statuses: {
              ...old.statuses,
              [program.id]: {
                enrolled: true,
                completed: false,
              } satisfies ProgramCompStatus,
            },
          };
        });
        queryClient.setQueryData<DashboardContent>(
          ["dashboard-content"],
          (old: DashboardContent | undefined) => {
            if (!old) {
              return {
                mmpPrograms: [
                  {
                    program: {
                      id: program.id,
                      name: program.name,
                      slug: program.slug,
                    },
                  },
                ],
              } as DashboardContent;
            }

            const existing = old.mmpPrograms || [];

            return {
              ...old,
              mmpPrograms: [
                ...existing.filter((item) => item.program.id !== program.id),
                {
                  program: {
                    id: program.id,
                    name: program.name,
                    slug: program.slug,
                  },
                },
              ].slice(-3), // ✅ consistent with other features
            };
          },
        );
        toast.success(data.message || "You have enrolled successfully");

        setTimeout(() => {
          router.push(`/dashboard/mini-mastery-programs/program/${program.id}`);
        }, 100);
      }
    },

    onError: (err) => {
      console.error("Enroll failed", err);
      toast.error(getAxiosErrorMessage(err));
    },
  });

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => redirectToSignin(router)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm"
      >
        <LogIn size={16} /> Sign In to Enroll
      </button>
    );
  }

  if (status?.completed) {
    return (
      <Link href={`/dashboard/mini-mastery-programs/program/${program.id}`}>
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-200 active:scale-95 text-sm">
          <Trophy size={16} /> Completed
        </button>
      </Link>
    );
  }

  if (status?.enrolled) {
    return (
      <Link href={`/dashboard/mini-mastery-programs/program/${program.id}`}>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm">
          <PlayCircle size={16} /> Continue Learning
        </button>
      </Link>
    );
  }

  return isPaid ? (
    <Link
      href={`/dashboard/membership/checkout?mmp_programId=${program.id}&context=MMP_PROGRAM`}
    >
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all light:shadow-lg light:shadow-blue-200 active:scale-95 text-sm">
        Enroll Now <ArrowRight size={18} />
      </button>
    </Link>
  ) : (
    <button
      onClick={() => enrollMutation.mutate(program.id)}
      disabled={enrollMutation.isPending}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-xs sm:text-sm" ${enrollMutation.isPending ? "opacity-80" : ""}`}
    >
      {enrollMutation.isPending ? (
        <span className="flex gap-2">
          Enrolling... <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      ) : (
        <span className="flex gap-2">Start for free</span>
      )}
    </button>
  );
}
// ─── Status Badge ─────────────────────────────────────────────────────────────

function HeroStatusBadge({ status }: { status?: ProgramCompStatus }) {
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

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <p className="text-slate-600 font-bold text-sm text-center max-w-xs">
        {message}
      </p>
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

const ProgramDetailViewClient = ({ program }: { program: Program }) => {
  const { status: authStatus,data:session } = useSession();
  const isLoggedIn = authStatus === "authenticated";
  const router = useRouter();
  const { redirectToSignin } = useReferralAndRedirect();

const shareUrl = (() => {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);

  // ✅ keep only pathname (clean URL)
  const cleanUrl = new URL(url.origin + url.pathname);

  const ref = session?.user?.referralCode;

  if (ref) {
    cleanUrl.searchParams.set("ref", ref);
  }

  return cleanUrl.toString();
})();
  const { data: statusData } = useQuery({
    queryKey: ["mmp-my-status"],
    queryFn: fetchMyStatuses,
    staleTime: 60_000,
    enabled: isLoggedIn,
  });

  const progStatus =
    program && statusData ? statusData.statuses[program.id] : undefined;

  if (!program) return <ErrorState message="Program not found." />;

  const achievements = parseAchievements(program.achievements);
  const modules = parseModules(program.modules);
  const hasCert = !!program.certificateTitle;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto px-4 pt-10">
        {/* Back + Share row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 dark:text-slate-200 transition-colors group"
          >
            <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 flex items-center justify-center group-hover:shadow-md transition-all">
              <ArrowLeft
                size={15}
                className="text-slate-500 dark:text-slate-200"
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">
              Back
            </span>
          </button>

          {/* Share Button */}
          <Share
            url={shareUrl}
            title={program.name}
          />
        </div>

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
              <HeroStatusBadge status={progStatus} />

              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 mx-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {program.unlockType === "daily"
                  ? "Daily Unlock"
                  : "Self-Guided Experience"}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-tighter flex items-center gap-1.5">
                    <Clock size={12} /> Duration
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {program.durationDays ?? "?"} Days
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                    <GraduationCap size={12} /> Benefit
                  </p>
                  {hasCert ? (
                    <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <CheckCircle2
                        size={14}
                        fill="currentColor"
                        className="text-blue-50"
                      />
                      Certificate Included
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-slate-400">
                      No certificate
                    </p>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Modules
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {modules.length}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Unlock
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {program.unlockType === "daily"
                      ? "One per day"
                      : "All at once"}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Investment
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatPrice(program.price, program.currency)}
                  </p>
                </div>
                <EnrollButton
                  program={program}
                  status={progStatus}
                  isLoggedIn={isLoggedIn}
                  redirectToSignin={redirectToSignin}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 mt-16 space-y-20">
        {achievements.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
                <Target size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{`What You'll Achieve`}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-100 p-5 rounded-2xl flex items-start gap-4 hover:border-blue-200 transition-colors group shadow-sm"
                >
                  <div className="mt-1 bg-blue-50 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {ach}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {modules.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
                  <LayoutPanelLeft size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Program Structure
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-200 italic">
                {modules.length} Modules •{" "}
                {program.durationDays ?? modules.length} Days
              </span>
            </div>

            <div className="space-y-2.5">
              {modules.map((mod, idx) => (
                <div
                  key={mod.id ?? idx}
                  className="bg-white dark:bg-slate-900 border border-slate-100 p-4 rounded-xl flex items-center justify-between group hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-blue-300 group-hover:text-blue-600 transition-colors">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {mod.title}
                    </h4>
                  </div>
                  <Lock
                    size={14}
                    className="text-slate-200 group-hover:text-blue-400 transition-colors shrink-0"
                  />
                </div>
              ))}

              {program.durationDays &&
                program.durationDays > modules.length && (
                  <div className="p-4 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                    Days {String(modules.length + 1).padStart(2, "0")} –{" "}
                    {String(program.durationDays).padStart(2, "0")}: Advanced
                    Content Unlocks Daily
                  </div>
                )}
            </div>
          </section>
        )}

        <div className="bg-blue-600 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-xl shadow-blue-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-sm">
            <Info size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black italic">
              Completion Requirement
            </h3>
            <p className="text-blue-50 text-[12px] leading-relaxed max-w-2xl font-medium opacity-90">
              Requires{" "}
              <span className="font-black text-white">
                {program.completionThreshold ?? 100}% completion
              </span>{" "}
              and all daily tasks marked as done to unlock the{" "}
              <span className="font-black text-white">
                {program.certificateTitle ?? "certificate"}
              </span>
              . Complete within the platform to qualify for your official
              digital credential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetailViewClient;
