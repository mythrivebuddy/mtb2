"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Gift,
  CalendarDays,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Define a type for our challenge data to match the API response
type Challenge = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  penalty?: number;
  startDate: string;
  endDate: string;
  participants: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  mode: "PUBLIC" | "PERSONAL";
  enrollmentStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
};

// This data-fetching function remains UNCHANGED.
const fetchMyChallenges = async (
  type: "hosted" | "joined"
): Promise<Challenge[]> => {
  const { data } = await axios.get(`/api/challenge/my-challenge?type=${type}`);
  return data;
};

// Helper function to format dates nicely
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function MyChallenges() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"hosted" | "joined">("hosted");
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );

  // All React Query and state logic remains UNCHANGED.
  const {
    data: challenges,
    isLoading,
    isError,
  } = useQuery<Challenge[]>({
    queryKey: ["myChallenges", activeTab],
    queryFn: () => fetchMyChallenges(activeTab),
  });

  const handleCardClick = (challengeId: string) => {
    router.push(`/dashboard/challenge/my-challenges/${challengeId}`);
  };

  const closeModal = () => {
    setIsCompletedModalOpen(false);
    setIsFailedModalOpen(false);
    setSelectedChallenge(null);
  };

  const statusColors = {
    ACTIVE: "bg-blue-100 text-blue-800",
    UPCOMING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen w-full ">
      <div className="w-full max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800">My Challenges</h1>
          <p className="text-slate-500 mt-2">
            Track your hosted and joined challenges.
          </p>
        </div>

        {/* --- Tab Buttons (No changes) --- */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200 p-1 rounded-xl flex">
            <button
              onClick={() => setActiveTab("hosted")}
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "hosted"
                  ? "bg-white text-slate-700 shadow"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Hosted
            </button>
            <button
              onClick={() => setActiveTab("joined")}
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "joined"
                  ? "bg-white text-slate-700 shadow"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Joined
            </button>
          </div>
        </div>

        {/* --- Loading and Error States (No changes) --- */}
        {isLoading && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-500" />
            <p className="text-slate-500 mt-2">Loading Challenges...</p>
          </div>
        )}
        {isError && (
          <div className="text-center py-10 bg-red-50 text-red-600 rounded-lg">
            <p>Failed to load challenges. Please try again later.</p>
          </div>
        )}

        {/* --- Content Display --- */}
        {!isLoading && !isError && (
          <div className="space-y-6">
            {challenges && challenges.length > 0 ? (
              challenges.map((challenge) => (
                // --- START OF NEW CARD DESIGN ---
                <div
                  key={challenge.id}
                  onClick={() => handleCardClick(challenge.id)}
                  className="bg-white rounded-xl shadow-md border border-slate-200/80 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:border-purple-400/50 hover:-translate-y-1"
                >
                  <div className="p-5 sm:p-6">
                    {/* Card Header */}
                    <div className="mb-4">
                      {/* THIS IS THE UPDATED TITLE ELEMENT */}
                      <h2 className="text-2xl font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors mb-2">
                        {challenge.title}
                      </h2>
                      {/* Badges are now below the title */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            statusColors[challenge.status]
                          }`}
                        >
                          {challenge.status}
                        </div>
                        <div
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            challenge.mode === "PUBLIC"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {challenge.mode}
                        </div>
                      </div>
                    </div>

                    {/* Card Description */}
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {challenge.description ||
                        "No description provided for this challenge."}
                    </p>

                    {/* Card Info (Dates) */}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CalendarDays className="w-4 h-4" />
                      <span>{formatDate(challenge.startDate)}</span>
                      <span className="text-slate-300">→</span>
                      <span>{formatDate(challenge.endDate)}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50/70 p-4 sm:px-6 rounded-b-xl border-t border-slate-200/80 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>{challenge.participants} Participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-700 font-bold text-lg">
                      <Gift className="w-5 h-5" />
                      <span>{challenge.reward} JP</span>
                    </div>
                  </div>
                </div>
                // --- END OF NEW CARD DESIGN ---
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                <p className="text-slate-500">
                  No challenges found in this category.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Modals (No changes) --- */}
      {isCompletedModalOpen && selectedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Challenge Completed!
            </h2>
            <p className="text-slate-500 mb-4">
              Great job on completing the &quot;{selectedChallenge.title}&quot;
              challenge.
            </p>
            <p className="text-lg font-semibold text-purple-600 mb-6">
              You&apos;ve earned {selectedChallenge.reward} JP!
            </p>
            <button
              onClick={closeModal}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Close & Celebrate
            </button>
          </div>
        </div>
      )}

      {isFailedModalOpen && selectedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Challenge Failed
            </h2>
            <p className="text-slate-500 mb-4">
              Don&apos;t give up! Every attempt is a step forward.
            </p>
            <p className="text-lg font-semibold text-red-600 mb-6">
              Penalty: {selectedChallenge.penalty} JP deducted.
            </p>
            <button
              onClick={closeModal}
              className="w-full bg-slate-200 text-slate-800 p-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Acknowledge & Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}