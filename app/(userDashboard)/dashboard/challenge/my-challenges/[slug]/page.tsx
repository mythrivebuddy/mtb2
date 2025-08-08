"use client";

import { useState, useEffect, useCallback } from "react";
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
  ShieldAlert,
  PartyPopper,
  CalendarX,
  CalendarDays,
  Share2,
  Link2 as CopyIcon,
  X as CloseIcon,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";

// --- TYPE DEFINITIONS ---
interface Task {
  id: string;
  description: string;
  completed: boolean;
}
interface LeaderboardPlayer {
  id: string;
  name: string;
  score: number;
  avatar: string;
}
interface ChallengeDetails {
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
}

// --- HELPER COMPONENTS ---
const StatCard = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
}) => (
  <div className="bg-white px-2 py-4 rounded-xl shadow-md flex items-center space-x-4">
    <div className={`w-12 h-12 flex items-center justify-center rounded-full ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);
const TaskItem = ({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (taskId: string, newStatus: boolean) => void;
}) => (
  <div
    onClick={() => onToggle(task.id, !task.completed)}
    className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
      task.completed
        ? "bg-green-100 text-gray-500 line-through"
        : "bg-gray-50 hover:bg-gray-100"
    }`}
  >
    <div
      className={`w-6 h-6 rounded-full border-2 ${
        task.completed ? "bg-green-500 border-green-500" : "border-gray-300"
      } flex items-center justify-center mr-4 flex-shrink-0`}
    >
      {task.completed && <Check className="w-4 h-4 text-white" />}
    </div>
    <span className="flex-grow">{task.description}</span>
  </div>
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

// --- MAIN PAGE COMPONENT ---
export default function ChallengeManagementPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareableLink = `${baseUrl}/dashboard/challenge/upcoming-challenges/${slug}`;

  const fetchChallengeDetails = useCallback(async () => {
    if (!slug) return;
    try {
      if (!challenge) setLoading(true);
      const response = await axios.get(`/api/challenge/my-challenge/${slug}`);
      setChallenge(response.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchChallengeDetails();
  }, [fetchChallengeDetails]);

  const handleToggleTask = async (taskId: string, newStatus: boolean) => {
    const originalTasks = challenge?.dailyTasks;

    setChallenge((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        dailyTasks: prev.dailyTasks.map((t) =>
          t.id === taskId ? { ...t, completed: newStatus } : t
        ),
      };
    });

    try {
      const response = await axios.patch(`/api/challenge/tasks/${taskId}`, {
        isCompleted: newStatus,
      });

      if (response.data.allTasksCompleted) {
        setIsCompletionModalOpen(true);
      }

      await fetchChallengeDetails();
    } catch (error) {
      console.error("Failed to update task:", error);
      const specificError =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to update the task. Please try again.";
      setErrorMessage(specificError);
      setIsErrorModalOpen(true);

      // Revert the UI change
      setChallenge((prev) => {
        if (!prev) return null;
        return { ...prev, dailyTasks: originalTasks || [] };
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Share functions for different platforms
  const shareText = encodeURIComponent(
    `Check out this challenge: ${challenge?.title}!`
  );
  const shareUrl = encodeURIComponent(shareableLink);

  const socialLinks = [
    {
      name: "X",
      onClick: () =>
        window.open(`https://x.com/intent/tweet?url=${shareUrl}&text=${shareText}`),
      icon: (
        <svg
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 fill-current"
        >
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      onClick: () =>
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`),
      icon: (
        <svg
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 fill-current"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      onClick: () =>
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
        ),
      icon: (
        <svg
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 fill-current"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      onClick: () =>
        window.open(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`),
      icon: (
        <svg
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 fill-current"
        >
          <path d="M.48 11.727c-1.256.49-1.233 1.21.05 1.57l4.38 1.353 1.353 4.38c.36.118 1.08.103 1.57-.05L9.63 17.85l5.523 4.08c1.02.75 1.83.343 2.138-.853l3.96-18.498c.39-1.84-.89-2.52-2.19-1.995L.48 11.727z" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      onClick: () =>
        window.open(
          `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`
        ),
      icon: (
        <svg
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 fill-current"
        >
          <path d="M12.04 2.004c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.5 1.36 5.06l-1.43 5.23 5.36-1.42c1.48.82 3.16 1.25 4.88 1.25 5.46 0 9.91-4.45 9.91-9.91 0-5.47-4.45-9.91-9.91-9.91m0 18.26c-1.63 0-3.24-.44-4.65-1.28l-.34-.2-3.44.91.93-3.35-.22-.36c-.92-1.48-1.4-3.2-1.4-5.01 0-4.57 3.71-8.28 8.28-8.28 4.57 0 8.28 3.71 8.28 8.28 0 4.57-3.71 8.28-8.28 8.28m4.51-6.15c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.2-.72-.65-1.2-1.45-1.34-1.7-.14-.24 0-.37.11-.48.1-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.29-.74-1.77s-.4-.41-.54-.41-.28-.01-.42-.01c-.14 0-.38.06-.58.3-.2.24-.76.74-.76 1.8 0 1.06.78 2.08.88 2.22.1.14 1.55 2.5 3.76 3.32.53.2 1 .32 1.34.4.45.1.86.08 1.18-.06.38-.16 1.25-1.03 1.42-1.29.17-.26.17-.48.12-.6z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return <div className="text-center text-red-500 mt-10 p-4">{error}</div>;
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

  return (
    <>
      <div className="min-h-screen font-sans ">
        <header className="bg-white m-4 p-4 sm:p-6 rounded-2xl shadow-sm">
          <div className="max-w-7xl mx-auto">
            {/* Top row: Back and Share buttons */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold hover:bg-indigo-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
              {challenge.title}
            </h1>

            {/* Date Range */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span>{formatDate(challenge.startDate)}</span>
                <span className="text-slate-300">→</span>
                <span>{formatDate(challenge.endDate)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {challenge.description && (
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
              <p className="text-gray-600 leading-relaxed">
                {challenge.description}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <StatCard
              icon={<Flame className="w-6 h-6 text-white" />}
              label="Current Streak"
              value={`${challenge.currentStreak} Days`}
              colorClass="bg-orange-500"
            />
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
              icon={<ShieldAlert className="w-6 h-6 text-white" />}
              label="Penalty"
              value={`${challenge.penalty} JP`}
              colorClass="bg-gray-500"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
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
                    />
                  ))
                ) : (
                  <p className="text-gray-500">
                    No tasks defined for this challenge yet.
                  </p>
                )}
              </div>
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-indigo-500" /> Leaderboard
              </h2>
              <ul className="space-y-4">
                {challenge.leaderboard?.map((player, index) => (
                  <li key={player.id} className="flex items-center">
                    <span className="text-lg font-bold text-gray-400 w-8">
                      {index + 1}
                    </span>
                    <Image
                      src={player.avatar}
                      alt={player.name}
                      width={40}
                      height={40}
                      className="rounded-full mr-4"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800">
                        {player.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {player.score.toLocaleString()} Day Streak
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* --- Day Completion Modal --- */}
      {isCompletionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl transform translate-y-[-10px] transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border border-gray-100">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Day Complete!
            </h2>
            <p className="text-slate-600 mb-6">
              Great job! You&apos;ve completed all your tasks for today. Your
              streak has been updated.
            </p>
            <button
              onClick={() => setIsCompletionModalOpen(false)}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all"
            >
              Keep Going!
            </button>
          </div>
        </div>
      )}

      {/* --- Error Modal --- */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl transform translate-y-[-10px] transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border border-gray-100">
            <CalendarX className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Challenge Not Active
            </h2>
            <p className="text-slate-600 mb-6">
              {errorMessage ||
                "This challenge is currently inactive or has ended. You can no longer submit tasks for it."}
            </p>
            <button
              onClick={() => setIsErrorModalOpen(false)}
              className="w-full bg-slate-800 text-white p-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* --- Share Modal --- */}
      {isShareModalOpen && (
        <div
          onClick={() => setIsShareModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 sm:p-8"
          >
            {/* --- Modal Header --- */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Share</h2>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div>
              {/* --- Social Links Section --- */}
              <h3 className="text-sm font-semibold text-slate-500 mb-3">
                Share link via
              </h3>
              <div className="flex items-center justify-start gap-4 text-slate-700 mb-6 flex-wrap">
                {socialLinks.map((social) => (
                  <button
                    key={social.name}
                    onClick={social.onClick}
                    aria-label={`Share on ${social.name}`}
                    className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    {social.icon}
                  </button>
                ))}
              </div>

              {/* --- Direct Link Section --- */}
              <h3 className="text-sm font-semibold text-slate-500 mb-3">
                Page direct
              </h3>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                <CopyIcon className="w-5 h-5" />
                <span>{copied ? "Copied!" : "Copy link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}