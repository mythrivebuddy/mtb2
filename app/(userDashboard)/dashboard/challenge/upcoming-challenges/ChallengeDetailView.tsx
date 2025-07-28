"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Award, Calendar, CheckCircle, Users, Loader2, PartyPopper, AlertTriangle, Coins, ShieldAlert, UserCircle } from "lucide-react";
import type { Challenge, ChallengeTask, ChallengeEnrollment, UserChallengeTask, User } from "@prisma/client";
import AppLayout from "@/components/layout/AppLayout";

// NOTE: The type definitions for Creator and the props are assumed to be correct from the previous step.
type Creator = Pick<User, "id" | "name">;

type ChallengeWithTasksAndCount = Challenge & {
  creator: Creator;
  templateTasks: ChallengeTask[];
  _count: { enrollments: number };
};

type EnrollmentWithTasks = ChallengeEnrollment & {
  userTasks: UserChallengeTask[];
};

interface ChallengeDetailViewProps {
  challenge: ChallengeWithTasksAndCount;
  initialEnrollment: EnrollmentWithTasks | null;
}

const formatDate = (dateString: string | Date) => new Date(dateString).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const getChallengeDuration = (startDateString: string | Date, endDateString: string | Date): string => {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = Math.round(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0) return "";
    if (days === 1) return `(${days} day)`;
    return `(${days} days)`;
};

export default function ChallengeDetailView({ challenge, initialEnrollment }: ChallengeDetailViewProps) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrollSuccessModalOpen, setIsEnrollSuccessModalOpen] = useState(false);

  // ... (useEffect, handleEnroll, handleJoinClick, etc. remain the same)

    useEffect(() => {
    if (enrollment && enrollment.userTasks.length === 0) {
      setIsPolling(true);
      const poll = setInterval(async () => {
        try {
          const response = await axios.get(`/api/challenge/enrollments/${challenge.id}`);
          const updatedEnrollment: EnrollmentWithTasks = response.data.enrollment;
          if (updatedEnrollment?.userTasks.length > 0) {
            setEnrollment(updatedEnrollment);
            setIsPolling(false);
            setIsEnrollSuccessModalOpen(true);
            clearInterval(poll);
          }
        } catch (err) {
          console.error("Polling failed:", err);
          setError("Could not confirm enrollment status. Please refresh the page.");
          setIsPolling(false);
          clearInterval(poll);
        }
      }, 3000);
      return () => clearInterval(poll);
    }
    }, [enrollment, challenge.id]);

    const handleEnroll = async () => {
        setIsEnrolling(true);
        setError(null);
        try {
        const response = await axios.post("/api/challenge/enroll", {
            challengeId: challenge.id,
        });
        setEnrollment(response.data.enrollment);
        } catch (err) {
        const errorMessage =
            axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "An unexpected error occurred.";
        setError(errorMessage);
        } finally {
        setIsEnrolling(false);
        }
    };

    const handleJoinClick = () => {
        if (sessionStatus === 'loading') return;

        if (sessionStatus === 'authenticated') {
        handleEnroll();
        } else {
        const redirectPath = `/dashboard/challenge/upcoming-challenges/${challenge.id}`;
        router.push(`/signin?redirect=${encodeURIComponent(redirectPath)}`);
        }
    };

    const handleCloseModalAndRedirect = () => {
        setIsEnrollSuccessModalOpen(false);
        router.push("/dashboard/challenge/my-challenges");
    };


  const statusColors = {
    ACTIVE: "bg-blue-100 text-blue-800",
    UPCOMING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  // 1. Extract the main page content into a constant to avoid code duplication.
  const pageContent = (
    <div className="min-h-screen  mx-4 sm:mx-10 mt-10 rounded-3xl">
      <div className="w-full max-w-4xl mx-auto py-12 ">
        <div className="bg-white px-4  py-8 rounded-2xl shadow-lg">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">{challenge.title}</h1>
              <div className="flex items-center gap-x-3 my-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[challenge.status] || 'bg-gray-100'}`}>{challenge.status}</span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${challenge.mode === 'PUBLIC' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>{challenge.mode}</span>
              </div>
            </div>
          </div>
          {/* Description */}
          <p className="text-slate-600 text-lg mb-8">{challenge.description}</p>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                <Coins className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <div>
                    <div className="text-sm text-slate-500">Joining Cost</div>
                    <div className="font-semibold text-slate-700">{challenge.cost > 0 ? `${challenge.cost} JP` : 'Free'}</div>
                </div>
            </div>
            <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                <Award className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" />
                <div>
                    <div className="text-sm text-slate-500">Reward</div>
                    <div className="font-semibold text-slate-700">{challenge.reward} JP</div>
                </div>
            </div>
            <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                <ShieldAlert className={`w-6 h-6 mr-3 flex-shrink-0 ${challenge.penalty > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                <div>
                    <div className="text-sm text-slate-500">Penalty</div>
                    <div className="font-semibold text-slate-700">{challenge.penalty > 0 ? `${challenge.penalty} JP` : 'None'}</div>
                </div>
            </div>
            <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                <Users className="w-6 h-6 text-slate-500 mr-3 flex-shrink-0" />
                <div>
                    <div className="text-sm text-slate-500">Participants</div>
                    <div className="font-semibold text-slate-700">{challenge._count.enrollments}</div>
                </div>
            </div>
             <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                <UserCircle className="w-6 h-6 text-gray-500 mr-3 flex-shrink-0" />
                <div>
                    <div className="text-sm text-slate-500">Created By</div>
                    <div className="font-semibold text-slate-700">{challenge.creator?.name ?? 'Unknown User'}</div>
                </div>
            </div>
          </div>
          {/* Duration */}
          <div className="flex items-center p-4 bg-slate-50 rounded-lg mb-8">
              <Calendar className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" />
              <div>
                  <div className="text-sm text-slate-500">Challenge Duration</div>
                  <div className="font-semibold text-slate-700 flex items-center gap-2">
                      <span>{formatDate(challenge.startDate)} to {formatDate(challenge.endDate)}</span>
                      <span className="text-blue-600 font-medium">{getChallengeDuration(challenge.startDate, challenge.endDate)}</span>
                  </div>
              </div>
          </div>
          {/* Tasks Section */}
          <div className="border-t border-slate-200 pt-6 mb-8">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Tasks to Complete</h2>
            <ul className="space-y-3">
              {challenge.templateTasks.length > 0 ? (
                challenge.templateTasks.map((task) => (
                  <li key={task.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <p className="text-slate-800">{task.description}</p>
                  </li>
                ))
              ) : (
                <li className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">No tasks have been added to this challenge yet.</li>
              )}
            </ul>
          </div>
          {/* Action Button Section */}
          <div className="pt-6 border-t border-slate-200">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            {(() => {
              if (enrollment && enrollment.userTasks.length > 0) {
                return (
                  <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center">
                    <PartyPopper className="w-6 h-6 mr-2" />
                    <span className="font-semibold text-lg">You have joined this challenge!</span>
                  </div>
                );
              }
              if (isPolling || (enrollment && enrollment.userTasks.length === 0)) {
                return (
                  <div className="text-center p-4 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    <span className="font-semibold text-lg">Preparing your tasks...</span>
                  </div>
                );
              }
              return (
                <button onClick={handleJoinClick} disabled={isEnrolling || sessionStatus === 'loading'} className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed">
                  {isEnrolling ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enrolling...</>) : ("Join Challenge")}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 2. Conditionally wrap pageContent based on authentication status. */}
      {sessionStatus === 'authenticated' ? (
        pageContent // If logged in, show content without AppLayout
      ) : (
        <AppLayout>{pageContent}</AppLayout> // If not logged in, wrap content in AppLayout
      )}

      {/* Enrollment Success Modal (remains outside the main layout) */}
      {isEnrollSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Successfully Joined!</h2>
            <p className="text-slate-500 mb-6">You are now enrolled in the &quot;{challenge.title}&quot; challenge. Good luck!</p>
            <button onClick={handleCloseModalAndRedirect} className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all">View My Challenges</button>
          </div>
        </div>
      )}
    </>
  );
}