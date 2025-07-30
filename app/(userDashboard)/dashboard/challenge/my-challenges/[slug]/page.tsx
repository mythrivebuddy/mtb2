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
  Share2, // Added Share2 icon
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
    <div className={`p-3 max-sm:h-10 flex items-center justify-center max-sm:w-10 rounded-full ${colorClass}`}>{icon}</div>
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
    className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${task.completed ? "bg-green-100 text-gray-500 line-through" : "bg-gray-50 hover:bg-gray-100"}`}
  >
    <div
      className={`w-6 h-6 rounded-full border-2 ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300"} flex items-center justify-center mr-4 flex-shrink-0`}
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // Added state for share modal
  const [copied, setCopied] = useState(false); // Added state for copy feedback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || typeof window !== "undefined" ? window.location.origin : ""; // Modified to handle server-side rendering
  const shareableLink = `${baseUrl}/dashboard/challenge/upcoming-challenges/${slug}`; // Shareable link

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
  }, [slug, challenge]);

  useEffect(() => {
    fetchChallengeDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

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
      <div className="min-h-screen font-sans">
        <header className="bg-white mx-4 p-3 rounded-2xl shadow mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-indigo-600"
              >
                <ChevronLeft className="w-5 h-5 mr-2" /> Back
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold hover:bg-indigo-200 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${challenge.status === "ACTIVE" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {challenge.status}
                </span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-4">
              {challenge.title}
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {challenge.description && (
            <div className="bg-white p-6 rounded-2xl shadow mb-8">
              <p className="text-gray-600 leading-relaxed">
                {challenge.description}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Your Daily Tasks
              </h2>
              <div className="space-y-3">
                {challenge.dailyTasks.length > 0 ? (
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
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-indigo-500" /> Leaderboard
              </h2>
              <ul className="space-y-4">
                {challenge.leaderboard.map((player, index) => (
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
                      <p className="font-semibold text-gray-800">{player.name}</p>
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
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Day Complete!
            </h2>
            <p className="text-slate-500 mb-6">
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
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <CalendarX className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Challenge Not Active
            </h2>
            <p className="text-slate-500 mb-6">
              {errorMessage || "This challenge is currently inactive or has ended. You can no longer submit tasks for it."}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <Share2 className="w-20 h-20 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Share Challenge
            </h2>
            <p className="text-slate-500 mb-4">
              Invite others to join this challenge!
            </p>
            <div className="bg-gray-100 p-2 rounded-lg mb-4 break-all">
              <p className="text-sm text-gray-700">{shareableLink}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full mt-2 bg-gray-200 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}