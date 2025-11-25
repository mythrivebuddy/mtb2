/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Share2,
  Link2 as CopyIcon,
  X as CloseIcon,
  ChevronRight,
  CheckCircle2,
  XCircle,
  LucideTrash2,
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

// --- TYPE DEFINITIONS ---
interface CompletionRecord {
  date: string;
  status: "COMPLETED" | "MISSED";
}
interface Task {
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
  <div className="bg-white px-2 py-4 rounded-xl shadow-md flex items-center space-x-4 relative h-full">
    <div
      className={`w-12 h-12 flex items-center justify-center rounded-full ${colorClass}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-800">{value}</p>
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
    className={`flex w-full text-left items-center p-4 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${task.completed ? "bg-green-100 text-gray-500 line-through" : "bg-gray-50 hover:bg-gray-100"}`}
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
    })
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
        </div>
      );
    }
    return grid;
  };

  return (
    <div
      ref={calendarRef as React.RefObject<HTMLDivElement>}
      className={`absolute ${positionClasses} w-80 max-w-[90vw] bg-white p-5 rounded-xl shadow-2xl border border-slate-200 z-50`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">
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
                  1
                )
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
                  1
                )
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

const socialLinksData = [
  {
    name: "X",
    icon: (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 fill-current"
      >
        {" "}
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />{" "}
      </svg>
    ),
    template: `https://x.com/intent/tweet?url={url}&text={text}`,
  },
  {
    name: "Facebook",
    icon: (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 fill-current"
      >
        {" "}
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />{" "}
      </svg>
    ),
    template: `https://www.facebook.com/sharer/sharer.php?u={url}`,
  },
  {
    name: "LinkedIn",
    icon: (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 fill-current"
      >
        {" "}
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />{" "}
      </svg>
    ),
    template: `https://www.linkedin.com/sharing/share-offsite/?url={url}`,
  },
  {
    name: "Telegram",
    icon: (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 fill-current"
      >
        {" "}
        <path d="M.48 11.727c-1.256.49-1.233 1.21.05 1.57l4.38 1.353 1.353 4.38c.36.118 1.08.103 1.57-.05L9.63 17.85l5.523 4.08c1.02.75 1.83.343 2.138-.853l3.96-18.498c.39-1.84-.89-2.52-2.19-1.995L.48 11.727z" />{" "}
      </svg>
    ),
    template: `https://t.me/share/url?url={url}&text={text}`,
  },
  {
    name: "WhatsApp",
    icon: (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 fill-current"
      >
        {" "}
        <path d="M12.04 2.004c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.5 1.36 5.06l-1.43 5.23 5.36-1.42c1.48.82 3.16 1.25 4.88 1.25 5.46 0 9.91-4.45 9.91-9.91 0-5.47-4.45-9.91-9.91-9.91m0 18.26c-1.63 0-3.24-.44-4.65-1.28l-.34-.2-3.44.91.93-3.35-.22-.36c-.92-1.48-1.4-3.2-1.4-5.01 0-4.57 3.71-8.28 8.28-8.28 4.57 0 8.28 3.71 8.28 8.28 0 4.57-3.71 8.28-8.28 8.28m4.51-6.15c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.2-.72-.65-1.2-1.45-1.34-1.7-.14-.24 0-.37.11-.48.1-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.29-.74-1.77s-.4-.41-.54-.41-.28-.01-.42-.01c-.14 0-.38.06-.58.3-.2.24-.76.74-.76 1.8 0 1.06.78 2.08.88 2.22.1.14 1.55 2.5 3.76 3.32.53.2 1 .32 1.34.4.45.1.86.08 1.18-.06.38-.16 1.25-1.03 1.42-1.29.17-.26.17-.48.12-.6z" />{" "}
      </svg>
    ),
    template: `https://api.whatsapp.com/send?text={text}%20{url}`,
  },
];

// --- MAIN PAGE COMPONENT ---
export default function ChallengeManagementPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  const session = useSession();


  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
          }
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

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareableLink = `${baseUrl}/dashboard/challenge/upcoming-challenges/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = encodeURIComponent(
    `Check out this challenge: ${challenge?.title}!`
  );
  const shareUrl = encodeURIComponent(shareableLink);
  const socialLinks = socialLinksData.map((social) => ({
    name: social.name,
    icon: social.icon,
    onClick: () =>
      window.open(
        social.template.replace("{url}", shareUrl).replace("{text}", shareText)
      ),
  }));
  const deleteUserMutation = async (
    challengeId: string,
    userId: string,
    user_name: string
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
        }
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

  /**
   * Handles the deletion flow (confirmation + toast feedback)
   */
  const handleRemoveUserFromChallenge = async (
    challengeId: string,
    userId: string,
    user_name: string
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

  const daysLeft = Math.ceil(
    (new Date(challenge.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const totalCompletedDays = (challenge.history || []).filter(
    (day) => day.status === "COMPLETED"
  ).length;

  return (
    <>
      <div className="min-h-screen font-sans">
        {/* HEADER */}
        <header className="bg-white m-4 p-4 sm:p-6 rounded-2xl shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push(`/dashboard/challenge`)}
                className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-full text-md font-semibold hover:bg-amber-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            <div className="flex items-center gap-8 justify-between mb-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
                {challenge.title}
              </h1>

              <Link
                href={`/profile/${challenge.creatorId}`}
                target="_blank"
                className="w-fit bg-gradient-to-r from-indigo-50 to-purple-50 text-purple-700 text-[0.6rem] sm:text-xs font-semibold px-1 sm:py-1 rounded-md shadow-sm border flex items-center justify-center border-purple-100"
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {/* DESCRIPTION */}
          {challenge.description && (
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
              <ChallengeDescription html={challenge.description} />
            </div>
          )}

          {/* SOCIAL LINK */}
          {challenge.social_link_task?.trim() && (
            <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm mb-6">
              <p className="text-gray-700 font-semibold mb-1">Related Links:</p>
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
          {
           session.data && challenge.isIssuingCertificate && challenge.creatorId == session.data.user.id && (
              <div className="">
                <Link href={`/dashboard/challenge/my-challenges/${challenge.id}/certificates`}>
                  <button className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all">
                    Certificate Management
                  </button>
                </Link>
              </div>
            )
          }

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
              value={`${challenge.reward} JP`}
              colorClass="bg-green-500"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
  {/* ✅ LEFT COLUMN (Daily Tasks + Group Chat) */}
  <div className="lg:col-span-2 flex flex-col gap-8">
    {/* DAILY TASKS */}
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
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
          <p className="text-gray-500">No tasks defined.</p>
        )}
      </div>
    </div>

    {/* GROUP CHAT */}
    <div className="bg-white px-0 sm:px-4 py-2 rounded-2xl shadow-sm">
      <ChallengeChat
        challengeId={challenge.id}
        isChatDisabled={new Date(challenge.endDate).getTime() < Date.now()}
        members={challenge.leaderboard || []}
      />
    </div>
  </div>

  {/* ✅ RIGHT COLUMN (Leaderboard) */}
  {/* Changes: Removed 'self-start', added 'h-full flex flex-col' */}
  <div className="lg:col-span-1 bg-white px-3 py-6 rounded-2xl shadow-sm flex flex-col h-full">
    <div className="flex-shrink-0 mb-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Users className="w-6 h-6 mr-3 text-indigo-500" /> Leaderboard
      </h2>
    </div>

    {/* ✅ SCROLL AREA */}
    {/* Changes: flex-1 (fills height), min-h-0 (allows scroll), removed fixed pixel heights */}
    <ScrollArea className="flex-1 min-h-0 w-full pr-2">
      <ul className="space-y-4">
        {challenge.leaderboard?.map((player, index) => (
          <li key={player.id}>
            <div className="flex justify-between items-start hover:bg-gray-100 rounded-lg py-4 px-2 min-h-[60px]">
              <Link
                href={`/profile/${player.id}`}
                target="_blank"
                className="flex items-center w-full"
              >
                <span className="text-md font-bold text-gray-400 w-6">
                  {index + 1}
                </span>

                <Image
                  src={player.avatar ? player.avatar : getAvatar(player.name)}
                  alt={player.name}
                  width={35}
                  height={35}
                  className="rounded-full mr-3"
                />

                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">{player.name}</p>
                  <p className="text-[12px] sm:text-[16px] lg:text-[12px] xl:text-[11px] text-gray-500">
                    {player.completedDays} Days Completed ({player.score} Streak)
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
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Day Complete!
            </h2>
            <p className="text-slate-600 mb-6">
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
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
            <CalendarX className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Challenge Not Active
            </h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => setIsErrorModalOpen(false)}
              className="w-full bg-slate-800 text-white p-3 rounded-lg font-semibold hover:bg-slate-700"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* ✅ SHARE MODAL */}
      {isShareModalOpen && (
        <div
          onClick={() => setIsShareModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 sm:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Share</h2>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 mb-3">
              Share link via
            </h3>

            <div className="flex items-center justify-start gap-4 text-slate-700 mb-6 flex-wrap">
              {socialLinks.map((social) => (
                <button
                  key={social.name}
                  onClick={social.onClick}
                  aria-label={`Share on ${social.name}`}
                  className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full"
                >
                  {social.icon}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-500 mb-3">
              Page direct
            </h3>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
            >
              <CopyIcon className="w-5 h-5" />
              <span>{copied ? "Copied!" : "Copy link"}</span>
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
                  selectedUser.name
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
