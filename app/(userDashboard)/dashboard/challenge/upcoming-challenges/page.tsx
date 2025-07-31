"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Search,
  Users,
  Award,
  Calendar,
  Loader2,
  Coins,
  Gift,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AppLayout from "@/components/layout/AppLayout";

// --- TYPE DEFINITIONS ---

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  startDate: string;
  cardType: "myChallenge" | "upcomingChallenge";
  endDate?: string;
  participants?: number;
  status?: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  mode?: "PUBLIC" | "PERSONAL";
  isHosted?: boolean;
  cost?: number;
  _count?: {
    enrollments: number;
  };
};

// --- API FETCHING FUNCTIONS ---

const fetchUpcomingChallenges = async () => {
  const { data } = await axios.get("/api/challenge/upcoming");
  return data;
};

const fetchMyChallenges = async () => {
  const [hostedRes, joinedRes] = await Promise.all([
    axios.get(`/api/challenge/my-challenge?type=hosted`),
    axios.get(`/api/challenge/my-challenge?type=joined`),
  ]);
  // ✨ FIX: Replaced 'any' with 'Challenge'
  const hostedChallenges = hostedRes.data.map((c: Challenge) => ({
    ...c,
    isHosted: true,
  }));
  return [...hostedChallenges, ...joinedRes.data];
};

// --- HELPER FUNCTIONS ---

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getDaysRemaining = (startDateString: string): string => {
  const now = new Date();
  const startDate = new Date(startDateString);
  now.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const timeDiff = startDate.getTime() - now.getTime();
  if (timeDiff < 0) return "";

  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  if (daysDiff === 0) return "(Starts today)";
  if (daysDiff === 1) return "(in 1 day)";
  return `(in ${daysDiff} days)`;
};

// --- MAIN COMPONENT ---

export default function UpcomingChallengesPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: myChallengesData, isLoading: isLoadingMy } = useQuery<
    Challenge[]
  >({
    queryKey: ["myChallengesCombined"],
    queryFn: fetchMyChallenges,
    enabled: sessionStatus === "authenticated",
  });

  const { data: upcomingChallengesData, isLoading: isLoadingUpcoming } =
    useQuery<Challenge[]>({
      queryKey: ["upcomingChallenges"],
      queryFn: fetchUpcomingChallenges,
    });

  const myChallenges: Challenge[] =
    // ✨ FIX: Replaced 'any' with 'Challenge'
    myChallengesData?.map((c: Challenge) => ({
      ...c,
      cardType: "myChallenge",
    })) || [];

  const myChallengeIds = new Set(myChallenges.map((c) => c.id));

  const upcomingChallenges: Challenge[] =
    upcomingChallengesData
      // ✨ FIX: Replaced 'any' with 'Challenge'
      ?.filter((c: Challenge) => !myChallengeIds.has(c.id))
      // ✨ FIX: Replaced 'any' with 'Challenge'
      .map((c: Challenge) => ({
        ...c,
        cardType: "upcomingChallenge",
      })) || [];

  const allChallenges = [...myChallenges, ...upcomingChallenges];

  const filteredChallenges = allChallenges.filter((challenge) =>
    challenge.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    ACTIVE: "bg-blue-100 text-blue-800",
    UPCOMING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  if (isLoadingMy || isLoadingUpcoming) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const pageContent = (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
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

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900">
            Upcoming Challenges
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Your personal challenges and new ones to discover, all in one place.
          </p>
        </div>

        <div className="mb-10 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for any challenge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg bg-white border border-slate-300 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
        </div>

        <div className="flex justify-center">
          {filteredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredChallenges.map((challenge) =>
                challenge.cardType === "myChallenge" ? (
                  <div
                    key={challenge.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/challenge/my-challenges/${challenge.id}`
                      )
                    }
                    className="bg-white rounded-xl shadow-md border border-slate-200/80 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:border-purple-400/50 hover:-translate-y-1 h-full flex flex-col"
                  >
                    <div className="p-5 sm:p-6 flex-grow">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {challenge.title}
                        </h3>
                        {challenge.isHosted && (
                          <span className="text-xs font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full whitespace-nowrap">
                            Hosted by You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            statusColors[
                              challenge.status as keyof typeof statusColors
                            ]
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
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                        {challenge.description ||
                          "No description provided for this challenge."}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="w-4 h-4" />
                        <span>{formatDate(challenge.startDate)}</span>
                        <span className="text-slate-300">→</span>
                        <span>{formatDate(challenge.endDate!)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50/70 p-4 sm:px-6 rounded-b-xl border-t border-slate-200/80 flex justify-between items-center mt-auto">
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
                ) : (
                  <div
                    key={challenge.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group transition-transform duration-300 hover:-translate-y-2 h-full"
                  >
                    <div className="p-6 flex-grow">
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        {challenge.title}
                      </h3>
                      <p className="text-slate-600 mb-6 h-20 overflow-hidden break-words">
                        {challenge.description
                          ? challenge.description.length > 100
                            ? `${challenge.description.slice(0, 100)}...`
                            : challenge.description
                          : "No description provided."}
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center text-slate-700">
                          <Coins className="w-4 h-4 mr-2 text-green-500" />
                          <span className="font-semibold">
                            {challenge.cost! > 0
                              ? `Cost to Join: ${challenge.cost} JP`
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
                            {challenge._count!.enrollments} Participants
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 mt-auto">
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
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-slate-700">
                No Challenges Found
              </h3>
              <p className="mt-2 text-slate-500">
                Try adjusting your search or check back later for new
                challenges!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (sessionStatus === "authenticated") {
    return pageContent;
  } else {
    return <AppLayout>{pageContent}</AppLayout>;
  }
}