"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Users,
  
  Loader2,
  Gift,
  CalendarDays,
  ArrowLeft,
  Trash2,
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

// This function for fetching the list remains unchanged.
const fetchMyChallenges = async (
  type: "hosted" | "joined"
): Promise<Challenge[]> => {
  const { data } = await axios.get(`/api/challenge/my-challenge?type=${type}`);
  return data;
};

// Updated to call the correct API route that matches your folder structure.
const deleteChallenge = async (challengeId: string) => {
  const { data } = await axios.delete(`/api/challenge/my-challenge/${challengeId}`);
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"hosted" | "joined">("hosted");

  
 
  const {
    data: challenges,
    isLoading,
    isError,
  } = useQuery<Challenge[]>({
    queryKey: ["myChallenges", activeTab],
    queryFn: () => fetchMyChallenges(activeTab),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myChallenges", activeTab] });
      toast.success("Challenge Deleted", {
        description: "The challenge has been successfully deleted.",
      });
    },
    onError: (error) => {
        const apiError = error as { response?: { data?: { error?: string } } };
        const errorMessage = apiError?.response?.data?.error || "Failed to delete the challenge. Please try again.";
        toast.error("Error", {
            description: errorMessage,
        });
    },
  });

  const handleCardClick = (challengeId: string) => {
    router.push(`/dashboard/challenge/my-challenges/${challengeId}`);
  };

  const handleEditClick = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    // ✨ Added logging to help debug the ID being passed to the edit page.
    console.log("Navigating to edit page with Challenge ID:", challengeId);
    router.push(`/dashboard/challenge/edit/${challengeId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    deleteMutation.mutate(challengeId);
  };

 

  const statusColors = {
    ACTIVE: "bg-blue-100 text-blue-800",
    UPCOMING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <ArrowLeft size={20} />
            <span>Back to Challenge Hub</span>
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800">My Challenges</h1>
          <p className="text-slate-500 mt-2">
            Track your hosted and joined challenges.
          </p>
        </div>

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

        {!isLoading && !isError && (
          <div className="space-y-6">
            {challenges && challenges.length > 0 ? (
              challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  onClick={() => handleCardClick(challenge.id)}
                  className="bg-white rounded-xl shadow-md border border-slate-200/80 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:border-purple-400/50 hover:-translate-y-1"
                >
                  <div className="p-5 sm:p-6">
                    <div className="mb-4">
                      <h2 className="text-2xl font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors mb-2">
                        {challenge.title}
                      </h2>
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

                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {challenge.description ||
                        "No description provided for this challenge."}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CalendarDays className="w-4 h-4" />
                      <span>{formatDate(challenge.startDate)}</span>
                      <span className="text-slate-300">→</span>
                      <span>{formatDate(challenge.endDate)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-4 sm:px-6 rounded-b-xl border-t border-slate-200/80 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>{challenge.participants} Participants</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-purple-700 font-bold text-lg">
                        <Gift className="w-5 h-5" />
                        <span>{challenge.reward} JP</span>
                      </div>
                      {activeTab === "hosted" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleEditClick(e, challenge.id)}
                            className="p-2 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
                            title="Edit Challenge"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, challenge.id)}
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete Challenge"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
    </div>
  );
}
