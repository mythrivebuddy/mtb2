/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Flame,
  Target,
  Users,
  Calendar,
  ChevronLeft,
  Loader2,
  Award,
  PartyPopper,
  CalendarX,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  XCircle,
  LucideTrash2,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getAvatar } from "@/lib/utils/getDefaultAvatar";
import ChallengeDescription from "@/components/Dompurify";
import ChallengeChat from "@/components/ChallengeChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ParticipantEntry } from "../certificates/page";
import Share from "@/components/common/ShareModal";

// --- TYPE DEFINITIONS ---
interface CompletionRecord {
  date: string;
  status: "COMPLETED" | "MISSED";
}
export interface Task {
  id: string;
  description: string;
  completed: boolean;
}
export interface LeaderboardPlayer {
  id: string;
  name: string;
  score: number;
  avatar: string;
  completedDays: number;
}
export interface ChallengeDetails {
  id: string;
  creatorId: string;
  social_link_task: string | null;
  creator: { name: string };
  title: string;
  description: string | null;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  reward: number;
  penalty: number;
  participantCount: number;
  currentStreak: number;
  longestStreak: number;
  startDate: string;
  endDate: string;
  dailyTasks: Task[];
  leaderboard: LeaderboardPlayer[];
  history: CompletionRecord[];
  isIssuingCertificate: boolean;
  participants: ParticipantEntry[];
}

// --- HELPER COMPONENTS ---
const StatCard = ({
  icon,
  label,
  value,
  colorClass,
  cornerIcon,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
  cornerIcon?: React.ReactNode;
}) => (
  <div className="bg-white px-2 py-4 rounded-xl shadow-md flex items-center space-x-4 relative h-full dark:border dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30">
    <div
      className={`w-12 h-12 flex items-center justify-center rounded-full ${colorClass}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-slate-100">
        {value}
      </p>
    </div>
    {cornerIcon && <div className="absolute top-2 right-2">{cornerIcon}</div>}
  </div>
);

// --- API ROUTE HANDLER ---

const TaskItem = ({
  task,
  onToggle,
  isUpdating,
}: {
  task: Task;
  onToggle: (taskId: string, newStatus: boolean) => void;
  isUpdating: boolean;
}) => (
  <button
    onClick={() => onToggle(task.id, !task.completed)}
    disabled={isUpdating}
    className={`flex w-full text-left items-center p-4 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${task.completed ? "bg-green-100 text-gray-500 line-through dark:bg-green-900/30 dark:text-slate-400" : "bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"}`}
  >
    <div
      className={`w-6 h-6 rounded-full border-2 ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300"} flex items-center justify-center mr-4 flex-shrink-0`}
    >
      {task.completed && <Check className="w-4 h-4 text-white" />}
    </div>
    {/* <span className="flex-grow">{task.description}</span> */}
    <ChallengeDescription html={task.description} />
  </button>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
  </div>
);

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeDateToLocalString = (date: Date): string => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface ChallengeCalendarProps {
  history: CompletionRecord[];
  challengeStartDate: string;
  positionClasses: string;
  calendarRef: React.RefObject<HTMLDivElement | null>;
}

const ChallengeCalendar = ({
  history,
  challengeStartDate,
  positionClasses,
  calendarRef,
}: ChallengeCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // ✅ DEFINITIVE FIX: Create historyMap using a timezone-safe method
  const historyMap = new Map(
    history.map((item) => {
      // By creating a new Date object from the full string, JavaScript correctly
      // converts the UTC time from the server into the user's local timezone.
      const localDate = new Date(item.date);
      return [normalizeDateToLocalString(localDate), item.status];
    }),
  );

  const challengeStartUTC = new Date(challengeStartDate);
  challengeStartUTC.setUTCHours(0, 0, 0, 0);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayIndex = firstDayOfMonth.getDay();
    const grid = [];

    for (let i = 0; i < startDayIndex; i++)
      grid.push(<div key={`empty-${i}`}></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const today = new Date();

      const isToday =
        normalizeDateToLocalString(date) === normalizeDateToLocalString(today);
      today.setHours(0, 0, 0, 0);
      const isFuture = date > today;
      const isBeforeChallenge = date < challengeStartUTC;
      const isSelectable = !isFuture && !isBeforeChallenge;

      const status = historyMap.get(normalizeDateToLocalString(date));

      let dayContent;
      if (status === "COMPLETED") {
        dayContent = <CheckCircle2 className="w-6 h-6 text-green-500" />;
      } else if (status === "MISSED") {
        dayContent = <XCircle className="w-6 h-6 text-red-500" />;
      } else if (isSelectable || isToday) {
        dayContent = <span className="text-slate-700">{day}</span>;
      } else {
        dayContent = <span className="text-slate-300">{day}</span>;
      }

      grid.push(
        <div
          key={day}
          className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${isToday ? "bg-indigo-100 text-indigo-600 font-bold" : ""} ${isSelectable ? "hover:bg-slate-100" : "cursor-default"}`}
        >
          {dayContent}
        </div>,
      );
    }
    return grid;
  };

  return (
    <div
      ref={calendarRef as React.RefObject<HTMLDivElement>}
      className={`absolute ${positionClasses} w-80 max-w-[90vw] bg-white p-5 rounded-xl shadow-2xl border border-slate-200 z-50 dark:border-slate-700 dark:bg-slate-900`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1,
                ),
              )
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1,
                ),
              )
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-xs font-medium text-slate-400 uppercase tracking-wider"
          >
            {day.slice(0, 3)}
          </div>
        ))}
        {generateCalendarGrid()}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ChallengeManagementPage({
  challengeId,
}: {
  challengeId: string;
}) {
  const router = useRouter();

  const searchParams = useSearchParams();
  const from_where_user_came = searchParams.get("from");
  const slug = challengeId;
  const queryClient = useQueryClient();
  const session = useSession();

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState("top-full mt-2");
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isUserDeleting, setIsUserDeleting] = useState<boolean>(false);

  const calendarRef = useRef<HTMLDivElement | null>(null);
  const streakCardRef = useRef<HTMLDivElement>(null);

  // const SHOULD_REFETCH_FROM =
  //   "dashboard/complete-makeover-program/makeover-dashboard";
  const {
    data: challenge,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ChallengeDetails, AxiosError<{ error?: string }>>({
    queryKey: ["getChallengeDetails", slug],
    queryFn: async () => {
      const response = await axios.get(`/api/challenge/my-challenge/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const handleCalendarToggle = () => {
    if (!streakCardRef.current) return;
    const rect = streakCardRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const calendarHeight = 380;
    if (spaceBelow < calendarHeight && spaceAbove > calendarHeight) {
      setCalendarPosition("bottom-full mb-2");
    } else {
      setCalendarPosition("top-full mt-2");
    }
    setIsCalendarVisible((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCalendarVisible &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        streakCardRef.current &&
        !streakCardRef.current.contains(event.target as Node)
      ) {
        setIsCalendarVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarVisible]);
useEffect(() => {
  // if (sessionStorage.getItem("deferGettingStarted") === "true") return;
  sessionStorage.setItem("deferGettingStarted", "false");
  window.dispatchEvent(new Event("show-getting-started"));
}, []);

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      isCompleted,
      completionDate,
    }: {
      taskId: string;
      isCompleted: boolean;
      completionDate: string;
    }) => {
      // Send the user's current date to the server
      return axios.patch(`/api/challenge/tasks/${taskId}`, {
        isCompleted,
        completionDate,
      });
    },
    onSuccess: (data) => {
      if (data.data.allTasksCompleted) {
        setIsCompletionModalOpen(true);

        // ✅ FIX: Correctly handle optimistic update for today's date.
        queryClient.setQueryData(
          ["getChallengeDetails", slug],
          (oldData: ChallengeDetails | undefined) => {
            if (!oldData) return oldData;

            const today = new Date();
            const todayKey = normalizeDateToLocalString(today);

            // Correctly check if today's challenge is already completed by parsing each date properly.
            const alreadyCompleted = oldData.history.some((h) => {
              const localDate = new Date(h.date);
              return normalizeDateToLocalString(localDate) === todayKey;
            });

            if (!alreadyCompleted) {
              // Use the full ISO string for the optimistic update. This ensures it
              // will be parsed correctly by the calendar component's updated logic.
              const newHistoryEntry = {
                date: today.toISOString(),
                status: "COMPLETED",
              } as CompletionRecord;

              return {
                ...oldData,
                history: [...oldData.history, newHistoryEntry],
              };
            }
            return oldData;
          },
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["getChallengeDetails", slug],
      });
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      const specificError =
        error.response?.data?.error || "Failed to update task.";
      setErrorMessage(specificError);
      setIsErrorModalOpen(true);
    },
  });

  const handleToggleTask = (taskId: string, newStatus: boolean) => {
    // Get today's date in 'YYYY-MM-DD' format and send it
    const today = new Date();
    const completionDate = normalizeDateToLocalString(today);
    updateTaskMutation.mutate({
      taskId,
      isCompleted: newStatus,
      completionDate,
    });
  };

const ref = session?.data?.user?.referralCode;

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const shareableLink = `${baseUrl}/dashboard/challenge/upcoming-challenges/${slug}${
  ref ? `?ref=${ref}` : ""
}`;

  const deleteUserMutation = async (
    challengeId: string,
    userId: string,
    user_name: string,
  ): Promise<{ message: string }> => {
    if (!challengeId || !userId) {
      throw new Error("Challenge ID and User ID are required");
    }

    try {
      // ✅ Using searchParams (Axios `params` option auto-serializes)
      const response = await axios.delete<{ message: string }>(
        "/api/challenge/my-challenge/creator",
        {
          params: { challengeId, userId, user_name },
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || "Failed to delete user enrollment";
        throw new Error(message);
      }

      throw new Error("Unexpected error while deleting enrollment");
    }
  };
  const downloadCertificateMutation = useMutation({
    mutationFn: async ({ participantId }: { participantId: string }) => {
      const res = await axios.post(`/api/challenge/certificates/generate`, {
        participantId,
        challengeId: challenge?.id,
        issuedById: challenge?.creatorId,
      });

      return res.data;
    },

    onSuccess: async (data) => {
      // ✅ ONLY download (no new tab)
      const certUrl = data.pngUrl;
      if (certUrl) {
        const response = await fetch(certUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `certificate-${data.certificate.certificateId}.webp`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(blobUrl);
      }

      queryClient.setQueryData(
        ["getChallengeDetails", slug],
        (oldData: ChallengeDetails | undefined) => {
          if (!oldData) return oldData;

          const userId = session.data?.user.id;

          return {
            ...oldData,
            participants: oldData.participants.map((p) =>
              p.id === userId
                ? {
                    ...p,
                    isCertificateIssued: true,
                  }
                : p,
            ),
          };
        },
      );

      // // ✅ optional: ensure consistency with backend
      // queryClient.invalidateQueries({
      //   queryKey: ["getChallengeDetails", slug],
      // });

      toast.success("Certificate downloaded 🎉", {
        id: "cert-download",
      });
    },

    onError: (error: AxiosError<{ error?: string }>) => {
      const message =
        error.response?.data?.error || "Failed to download certificate";

      toast.error(message, {
        id: "cert-download",
      });
    },
  });
  /**
   * Handles the deletion flow (confirmation + toast feedback)
   */
  const handleRemoveUserFromChallenge = async (
    challengeId: string,
    userId: string,
    user_name: string,
  ): Promise<void> => {
    try {
      setIsUserDeleting(true);
      const result = await deleteUserMutation(challengeId, userId, user_name);
      await refetch();
      toast.success(result.message || "User removed successfully ✅");
    } catch (error: unknown) {
      let message = "Failed to delete the user";

      if (error instanceof Error) {
        message = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const axiosError = error as AxiosError<{ message?: string }>;
        message = axiosError.response?.data?.message || message;
      }

      toast.error(message);
    } finally {
      setIsUserDeleting(false);
    }
  };
  const handleDownloadCertificate = () => {
    if (!session.data?.user?.id) return;

    downloadCertificateMutation.mutate({
      participantId: session.data.user.id,
    });
  };
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    const errorMessage =
      axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : error.message;
    return (
      <div className="text-center text-red-500 mt-10 p-4">
        Error: {errorMessage}
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center text-gray-500 mt-10 p-4">
        Challenge data not found.
      </div>
    );
  }
  const loggedInParticipant = challenge.participants.find(
    (p) => p.id === session.data?.user.id,
  );

  // Check if their certificate has been issued
  const hasUserCertificateIssued =
    loggedInParticipant?.isCertificateIssued === true;
  const daysLeft = Math.ceil(
    (new Date(challenge.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const totalCompletedDays = (challenge.history || []).filter(
    (day) => day.status === "COMPLETED",
  ).length;
  const usersCompletedDays =
    challenge.leaderboard.find((player) => player.id === session.data?.user.id)
      ?.completedDays ?? 0;

  const totalDays =
    Math.ceil(
      (new Date(challenge.endDate).getTime() -
        new Date(challenge.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

  const completionPercentage =
    totalDays === 0 ? 0 : (usersCompletedDays / totalDays) * 100;

  const is75PercentCompleted = completionPercentage >= 75;

  const handleBack = () => {
    if (
      typeof from_where_user_came === "string" &&
      from_where_user_came.length > 0
    ) {
      router.push(`/${from_where_user_came}`);
    } else {
      router.push(`/dashboard/challenge`);
    }
  };

  return (
    <>
      <div className="min-h-screen">
        {/* HEADER */}
        <header className="bg-white m-4 p-4 sm:p-6 rounded-2xl shadow-sm dark:border dark:border-slate-700 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors dark:text-slate-300 dark:hover:text-indigo-300"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>

              <Share
                url={shareableLink}
                title={`Check out this challenge: ${challenge.title}!`}
              />
            </div>

            <div className="flex items-center gap-8 justify-between mb-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-slate-50">
                {challenge.title}
              </h1>

              <Link
                href={`/profile/${challenge.creatorId}`}
                target="_blank"
                className="w-fit bg-gradient-to-r from-indigo-50 to-purple-50 text-purple-700 text-[0.6rem] sm:text-xs font-semibold px-1 sm:py-1 rounded-md shadow-sm border flex items-center justify-center border-purple-100 dark:border-purple-800 dark:from-indigo-950/60 dark:to-purple-950/60 dark:text-purple-200"
              >
                Created by : {challenge?.creator?.name}
              </Link>
            </div>

            <div className="flex max-sm:text-[0.6rem] items-center gap-2 text-sm text-white bg-orange-700 w-fit px-2 py-1 rounded-md mt-2">
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span>{formatDate(challenge.startDate)}</span>
                <span className="text-slate-300">→</span>
                <span>{formatDate(challenge.endDate)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="mx-auto px-4  pb-8">
          {/* DESCRIPTION */}
          {challenge.description && (
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 dark:border dark:border-slate-700 dark:bg-slate-900">
              <ChallengeDescription html={challenge.description} />
            </div>
          )}

          {/* SOCIAL LINK */}
          {challenge.social_link_task?.trim() && (
            <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm mb-6 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-gray-700 font-semibold mb-1 dark:text-slate-200">
                Related Links:
              </p>
              <Link
                href={challenge.social_link_task}
                target="_blank"
                className="text-indigo-600 hover:text-indigo-700 hover:underline break-words"
              >
                {challenge.social_link_task}
              </Link>
            </div>
          )}

          {/* Certificate management page button */}
          {session.data &&
            challenge.isIssuingCertificate &&
            challenge.creatorId == session.data.user.id && (
              <div className="">
                <Link
                  href={`/dashboard/challenge/my-challenges/${challenge.id}/certificates`}
                >
                  <button className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all">
                    Certificate Management
                  </button>
                </Link>
              </div>
            )}
          {(hasUserCertificateIssued || is75PercentCompleted) && (
            <div className="flex flex-col gap-2 mt-2">
              {/* ✅ Achievements always visible if issued */}
              {hasUserCertificateIssued && (
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/challenge/my-challenges/my-achievements/${challenge.id}`,
                    )
                  }
                  className="w-full rounded-lg shadow-md py-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  My Achievements
                </button>
              )}

              {/* ✅ Download only if 75% reached */}
              {is75PercentCompleted && !hasUserCertificateIssued && (
                <button
                  onClick={handleDownloadCertificate}
                  disabled={downloadCertificateMutation.isPending}
                  className="w-full rounded-lg shadow-md py-3 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {downloadCertificateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    "Download Certificate"
                  )}
                </button>
              )}
            </div>
          )}

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 mt-8">
            <div className="relative" ref={streakCardRef}>
              <StatCard
                icon={<Flame className="w-6 h-6 text-white" />}
                label="Current Streak"
                value={`${challenge.currentStreak} Days`}
                colorClass="bg-orange-500"
                cornerIcon={
                  <button
                    onClick={handleCalendarToggle}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                  </button>
                }
              />
              {isCalendarVisible && (
                <ChallengeCalendar
                  history={challenge.history || []}
                  challengeStartDate={challenge.startDate}
                  positionClasses={`left-0 lg:left-1/2 lg:-translate-x-1/2 ${calendarPosition}`}
                  calendarRef={calendarRef}
                />
              )}
            </div>

            <StatCard
              icon={<Target className="w-6 h-6 text-white" />}
              label="Longest Streak"
              value={`${challenge.longestStreak} Days`}
              colorClass="bg-red-500"
            />

            <StatCard
              icon={<Award className="w-6 h-6 text-white" />}
              label="Reward"
              value={`${challenge.reward} GP`}
              colorClass="bg-green-500"
            />

            <StatCard
              icon={<AlertTriangle className="w-6 h-6 text-white" />}
              label="Penalty"
              value={`${challenge.penalty} GP`}
              colorClass="bg-rose-500"
            />

            <StatCard
              icon={<CheckCircle2 className="w-6 h-6 text-white" />}
              label="Days Completed"
              value={`${totalCompletedDays} Days`}
              colorClass="bg-sky-500"
            />

            <StatCard
              icon={<Users className="w-6 h-6 text-white" />}
              label="Participants"
              value={challenge.participantCount}
              colorClass="bg-blue-500"
            />

            <StatCard
              icon={<Calendar className="w-6 h-6 text-white" />}
              label="Ends In"
              value={`${daysLeft > 0 ? daysLeft : 0} Days`}
              colorClass="bg-teal-500"
            />
          </div>

          {/* ✅ FIXED GRID STRUCTURE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
            {/* ✅ LEFT COLUMN (Daily Tasks + Group Chat) */}
            <div className="lg:col-span-2 flex flex-col gap-8 min-h-0">
              {/* DAILY TASKS */}
              <div className="bg-white p-6 rounded-2xl shadow-sm dark:border dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-slate-50">
                  Your Daily Tasks
                </h2>
                <div className="space-y-3">
                  {challenge.dailyTasks?.length > 0 ? (
                    challenge.dailyTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggleTask}
                        isUpdating={updateTaskMutation.isPending}
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-slate-400">
                      No tasks defined.
                    </p>
                  )}
                </div>
              </div>

              {/* GROUP CHAT */}
              <div className="bg-white px-0 sm:px-4 py-2 rounded-2xl shadow-sm dark:border dark:border-slate-700 dark:bg-slate-950">
                <ChallengeChat
                  challengeId={challenge.id}
                  isChatDisabled={
                    new Date(challenge.endDate).getTime() < Date.now()
                  }
                  members={challenge.leaderboard || []}
                />
              </div>
            </div>

            {/* ✅ RIGHT COLUMN (Leaderboard) */}
            {/* Changes: Removed 'self-start', added 'h-full flex flex-col' */}
            <div className="lg:col-span-1 bg-white px-3 py-6 rounded-2xl shadow-sm flex flex-col h-[530px] sm:h-[790px] overflow-hidden dark:border dark:border-slate-700 dark:bg-slate-900">
              <div className="flex-shrink-0 mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center dark:text-slate-50">
                  <Users className="w-6 h-6 mr-3 text-indigo-500" /> Leaderboard
                </h2>
              </div>

              {/* ✅ SCROLL AREA */}
              {/* Changes: flex-1 (fills height), min-h-0 (allows scroll), removed fixed pixel heights */}
              <ScrollArea className="flex-1 min-h-0 w-full pr-2">
                <ul className="space-y-4">
                  {challenge.leaderboard?.map((player, index) => (
                    <li key={player.id}>
                      <div className="flex justify-between items-start hover:bg-gray-100 rounded-lg py-4 px-2 min-h-[60px] dark:hover:bg-slate-800">
                        <Link
                          href={`/profile/${player.id}`}
                          target="_blank"
                          className="flex items-center w-full"
                        >
                          <span className="text-md font-bold text-gray-400 w-6 dark:text-slate-500">
                            {index + 1}
                          </span>

                          <Image
                            src={
                              player.avatar
                                ? player.avatar
                                : getAvatar(player.name)
                            }
                            alt={player.name}
                            width={35}
                            height={35}
                            className="rounded-full mr-3"
                          />

                          <div className="flex-grow">
                            <p className="font-semibold text-gray-800 dark:text-slate-100">
                              {player.name}
                            </p>
                            <p className="text-[12px] sm:text-[16px] lg:text-[12px] xl:text-[11px] text-gray-500 dark:text-slate-400">
                              {player.completedDays} Days Completed (
                              {player.score} Streak)
                            </p>
                          </div>
                        </Link>
                        {session.data?.user.id === challenge.creatorId &&
                          player.id !== challenge.creatorId && (
                            <button
                              onClick={() =>
                                setSelectedUser({
                                  id: player.id,
                                  name: player.name,
                                })
                              }
                              className="text-red-700 hover:text-red-800 cursor-pointer"
                            >
                              <LucideTrash2 className="w-4 h-4 xl:w-5 xl:h-5" />
                            </button>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>
        </main>
      </div>

      {/* ✅ COMPLETION MODAL */}
      {isCompletionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-900">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-50">
              Day Complete!
            </h2>
            <p className="text-slate-600 mb-6 dark:text-slate-300">
              Great job! You've completed all your tasks today.
            </p>
            <button
              onClick={() => setIsCompletionModalOpen(false)}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
            >
              Keep Going!
            </button>
          </div>
        </div>
      )}

      {/* ✅ ERROR MODAL */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-900">
            <CalendarX className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-50">
              Challenge Not Active
            </h2>
            <p className="text-slate-600 mb-6 dark:text-slate-300">
              {errorMessage}
            </p>
            <button
              onClick={() => setIsErrorModalOpen(false)}
              className="w-full bg-slate-800 text-white p-3 rounded-lg font-semibold hover:bg-slate-700"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* ✅ Remove User Dialog (only one instance globally) */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{selectedUser?.name}</strong>{" "}
              from this challenge. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                if (!selectedUser) return;
                await handleRemoveUserFromChallenge(
                  challenge.id,
                  selectedUser.id,
                  selectedUser.name,
                );
                setSelectedUser(null);
              }}
              disabled={isUserDeleting}
              className={`px-4 py-2 bg-red-600 ${isUserDeleting && "bg-red-800"} hover:bg-red-700 text-white rounded-md font-semibold flex items-center justify-center gap-2`}
            >
              {isUserDeleting ? "Removing..." : "Remove"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
