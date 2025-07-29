"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // 1. Import useSession
import { Search, Users, Award, Calendar, Loader2, Coins } from "lucide-react";
import axios from "axios";
import AppLayout from "@/components/layout/AppLayout";

type ChallengeWithCount = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  cost: number;
  startDate: string;
  _count: {
    enrollments: number;
  };
};

// A helper function to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Helper function to calculate days remaining
const getDaysRemaining = (startDateString: string): string => {
  const now = new Date();
  const startDate = new Date(startDateString);

  now.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const timeDiff = startDate.getTime() - now.getTime();

  if (timeDiff < 0) {
    return "";
  }

  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return "(Starts today)";
  }
  if (daysDiff === 1) {
    return "(in 1 day)";
  }
  return `(in ${daysDiff} days)`;
};

export default function UpcomingChallengesPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession(); // 2. Get authentication status

  const [challenges, setChallenges] = useState<ChallengeWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await axios.get("/api/challenge/upcoming");
        setChallenges(response.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.error ||
              "Failed to fetch challenges from the server."
          );
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const filteredChallenges = challenges.filter((challenge) =>
    challenge.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Extract the page content into a constant
  const pageContent = (
    <div className="min-h-screen p-4 mx-4 sm:p-6 lg:p-8 rounded-2xl mt-10">
      <div className="max-w-7xl mx-auto">
        {/* --- Header Section --- */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900">
            Upcoming Challenges
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Browse through the list of upcoming public challenges. Join one
            and test your limits!
          </p>
        </div>

        {/* --- Search Bar --- */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for challenges by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg bg-white border border-slate-300 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
        </div>

        {/* --- Centering Wrapper for the Grid --- */}
        <div className="flex justify-center">
          {filteredChallenges.length > 0 ? (
            // --- Challenges Grid ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group transition-transform duration-300 hover:-translate-y-2"
                >
                  <div className="p-6 flex-grow">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                      {challenge.title}
                    </h2>
                    <p className="text-slate-600 mb-6 h-20 overflow-hidden break-words">
                      {challenge.description
                        ? challenge.description.length > 100 // Increased slice length
                          ? `${challenge.description.slice(0, 100)}...`
                          : challenge.description
                        : "No description provided."}
                    </p>

                    {/* --- Stats --- */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center text-slate-700">
                        <Coins className="w-4 h-4 mr-2 text-green-500" />
                        <span className="font-semibold">
                          {challenge.cost > 0
                            ? `Cost of Joining : ${challenge.cost} JP `
                            : "Free to Join"}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-700">
                        <Award className="w-4 h-4 mr-2 text-yellow-500" />
                        <span className="font-semibold">
                          {challenge.reward} JP Reward
                        </span>
                      </div>
                      <div className="flex items-center text-slate-700 gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold">
                          Starts: {formatDate(challenge.startDate)}
                        </span>
                        <span className="text-blue-600 font-medium">
                          {getDaysRemaining(challenge.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-700">
                        <Users className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="font-semibold">
                          {challenge._count.enrollments} Participants
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* --- Action Button --- */}
                  <div className="p-6 bg-gray-50">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/challenge/upcoming-challenges/${challenge.id}`
                        )
                      }
                      className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // --- No Results Message ---
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-slate-700">
                No Challenges Found
              </h3>
              <p className="mt-2 text-slate-500">
                {challenges.length > 0
                  ? "Try adjusting your search term."
                  : "Check back later for new challenges!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <h2 className="text-2xl font-semibold text-red-600">
          Failed to Load Challenges
        </h2>
        <p className="text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  // 4. Conditionally render the layout based on session status
  if (sessionStatus === "authenticated") {
    return pageContent; // Render without AppLayout if logged in
  } else {
    return <AppLayout>{pageContent}</AppLayout>; // Render with AppLayout if not logged in
  }
}