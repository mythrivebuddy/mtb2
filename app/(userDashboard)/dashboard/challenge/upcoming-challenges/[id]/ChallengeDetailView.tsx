"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {  Calendar, CheckCircle, Users, Loader2, PartyPopper, AlertTriangle } from "lucide-react";
import type { Challenge, ChallengeTask } from "@prisma/client";

// Define the shape of the props this component expects
type ChallengeWithTasksAndCount = Challenge & {
  templateTasks: ChallengeTask[];
  _count: {
    enrollments: number;
  };
};

interface ChallengeDetailViewProps {
  challenge: ChallengeWithTasksAndCount;
  isInitiallyEnrolled: boolean;
  isUserLoggedIn: boolean;
}

// A helper function to format dates
const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function ChallengeDetailView({ challenge, isInitiallyEnrolled, isUserLoggedIn }: ChallengeDetailViewProps) {
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(isInitiallyEnrolled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for our new success modal
  const [isEnrollSuccessModalOpen, setIsEnrollSuccessModalOpen] = useState(false);

  const handleEnroll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Make an API call to enroll the user
      await axios.post("/api/challenge/enroll", {
        challengeId: challenge.id,
      });
      // On success, update the state to show the user is enrolled
      setIsEnrolled(true);
      // Open the success modal instead of redirecting immediately
      setIsEnrollSuccessModalOpen(true);
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // This function will be called from the success modal's button
  const handleCloseModalAndRedirect = () => {
    setIsEnrollSuccessModalOpen(false);
    // Redirect to the My Challenges page. 
    // To land on the "Joined" tab, the My Challenges page would need to handle a query param.
    router.push("/dashboard/challenge/my-challenges");
  };

  const statusColors = {
    ACTIVE: "bg-blue-100 text-blue-800",
    UPCOMING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return (
    <>
      <div className="min-h-screen ">
        <div className="w-full max-w-3xl mx-auto py-12 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            {/* --- Header Section --- */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-800">{challenge.title}</h1>
                <div className="flex items-center gap-x-3 my-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[challenge.status] || 'bg-gray-100'}`}>
                    {challenge.status}
                  </span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${challenge.mode === 'PUBLIC' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                    {challenge.mode}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-purple-600">{challenge.reward} JP</div>
                <div className="text-sm text-slate-500">Reward</div>
              </div>
            </div>
            
            {/* --- Description --- */}
            <p className="text-slate-600 text-lg mb-6">{challenge.description}</p>
            
            {/* --- Stats --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-center">
              <div className="p-4 bg-slate-50 rounded-lg">
                <Calendar className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                <div className="text-sm text-slate-500">Starts On</div>
                <div className="font-semibold text-slate-700">{formatDate(challenge.startDate)}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <Calendar className="w-6 h-6 mx-auto text-red-500 mb-1" />
                <div className="text-sm text-slate-500">Ends On</div>
                <div className="font-semibold text-slate-700">{formatDate(challenge.endDate)}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <Users className="w-6 h-6 mx-auto text-green-500 mb-1" />
                <div className="text-sm text-slate-500">Participants</div>
                <div className="font-semibold text-slate-700">{challenge._count.enrollments}</div>
              </div>
            </div>

            {/* --- Tasks Section --- */}
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
                  <li className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                    No tasks have been added to this challenge yet.
                  </li>
                )}
              </ul>
            </div>
            
            {/* --- Action Button Section --- */}
            <div className="pt-6 border-t border-slate-200">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}
              {isEnrolled ? (
                <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center">
                  <PartyPopper className="w-6 h-6 mr-2" />
                  <span className="font-semibold text-lg">You have joined this challenge!</span>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    "Join Challenge"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Enrollment Success Modal --- */}
      {isEnrollSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Successfully Joined!
            </h2>
            <p className="text-slate-500 mb-6">
              You are now enrolled in the &quot;{challenge.title}&quot; challenge. Good luck!
            </p>
            <button
              onClick={handleCloseModalAndRedirect}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all"
            >
              View My Challenges
            </button>
          </div>
        </div>
      )}
    </>
  );
}
