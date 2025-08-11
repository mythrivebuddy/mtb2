"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Search,
  Users,
  Loader2,
  Gift,
  CalendarDays,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import AppLayout from "@/components/layout/AppLayout";

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
  const hostedChallenges = hostedRes.data.map((c: Challenge) => ({
    ...c,
    isHosted: true,
  }));
  return [...hostedChallenges, ...joinedRes.data];
};

// --- HELPER FUNCTIONS (UPDATED) ---
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStartDateInfo = (startDate: string): string | null => {
  const now = new Date();
  const start = new Date(startDate);
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const timeDiff = start.getTime() - now.getTime();
  if (timeDiff < 0) return null;

  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  if (daysDiff === 0) return "Starting Today";
  if (daysDiff === 1) return "Starts in 1 day";
  return `Starts in ${daysDiff} days`;
};


// --- COMPONENT: Create Challenge Button ---
const CreateChallengeButton = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";

  const handleClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard/challenge/create-challenge");
    } else {
      signIn();
    }
  };

  const tooltipText = isAuthenticated
    ? "Create a new challenge"
    : "Sign in to create a challenge";

  return (
    <div className="group relative">
      <button
        onClick={handleClick}
        className="flex-shrink-0 p-3 rounded-full bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label={tooltipText}
      >
        <Plus size={24} />
      </button>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max origin-top scale-95 transform rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100"
        role="tooltip"
      >
        {tooltipText}
      </div>
    </div>
  );
};
// --- END COMPONENT ---


// --- MAIN COMPONENT ---
export default function UpcomingChallengesPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    Challenge["status"] | "ALL"
  >("ALL");

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
    myChallengesData?.map((c: Challenge) => ({
      ...c,
      cardType: "myChallenge",
    })) || [];

  const myChallengeIds = new Set(myChallenges.map((c) => c.id));

  const upcomingChallenges: Challenge[] =
    upcomingChallengesData
      ?.filter((c: Challenge) => !myChallengeIds.has(c.id))
      .map((c: Challenge) => ({
        ...c,
        cardType: "upcomingChallenge",
       // status: "UPCOMING",
      })) || [];

  const allChallenges = [...myChallenges, ...upcomingChallenges];

  const filteredChallenges = allChallenges
    .filter((challenge) => {
      if (selectedStatus === "ALL") return true;
      return challenge.status === selectedStatus;
    })
    .filter((challenge) =>
      challenge.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (isLoadingMy || isLoadingUpcoming) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const filterOptions: (Challenge["status"] | "ALL")[] = [
    "ALL",
    "ACTIVE",
    "UPCOMING",
    "COMPLETED",
  ];

  const pageContent = (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900">
            Challenges
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Your personal challenges and new ones to discover, all in one place.
          </p>
        </div>
        
        <div className="mb-8 max-w-2xl mx-auto flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for any challenge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg bg-white border border-slate-300 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
          <CreateChallengeButton />
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {filterOptions.map((status) => {
            if (!status) return null;
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          {filteredChallenges.length > 0 ? (
            // --- UI CHANGE: REFACTORED CARD GRID ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((challenge) => {
                const startDateInfo = getStartDateInfo(challenge.startDate);
                const participantCount = challenge.participants ?? challenge._count?.enrollments ?? 0;

                let ribbon = null;
                if (challenge.isHosted) {
                  ribbon = (
                    <div 
                      className="absolute top-4 -right-9 transform rotate-45 bg-teal-500 text-center text-white text-sm font-semibold py-1 w-32"
                      aria-label="Hosted Challenge"
                    >
                      Hosted
                    </div>
                  );
                } else if (challenge.status === 'COMPLETED') {
                  ribbon = (
                    <div 
                      className="absolute top-4 -right-9 transform rotate-45 bg-slate-500 text-center text-white text-sm font-semibold py-1 w-32"
                      aria-label="Completed Challenge"
                    >
                      Completed
                    </div>
                  );
                } else if (challenge.cardType === 'myChallenge' && !challenge.isHosted) {
                  ribbon = (
                    <div 
                      className="absolute top-4 -right-9 transform rotate-45 bg-indigo-500 text-center text-white text-sm font-semibold py-1 w-32"
                      aria-label="Joined Challenge"
                    >
                      Joined
                    </div>
                  );
                } else if (challenge.cardType === 'upcomingChallenge') {
                  ribbon = (
                    <div 
                      className="absolute top-4 -right-9 transform rotate-45 bg-sky-500 text-center text-white text-sm font-semibold py-1 w-32"
                      aria-label="Upcoming Challenge"
                    >
                      Upcoming
                    </div>
                  );
                }

                return (
                  <div
                    key={challenge.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/challenge/${
                          challenge.cardType === "myChallenge"
                            ? "my-challenges"
                            : "upcoming-challenges"
                        }/${challenge.id}`
                      )
                    }
                    className="relative overflow-hidden bg-white rounded-xl shadow hover:shadow-lg p-6 border cursor-pointer flex flex-col transition hover:-translate-y-1 h-full"
                  >
                    {/* Render Ribbon */}
                    {ribbon}

                    <div className="mb-2 pt-4">
                      <h3 className="text-xl font-bold text-indigo-800 truncate">{challenge.title}</h3>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {challenge.description || "No description available."}
                    </p>

                    {/* Dynamic start date tag */}
                    {startDateInfo && (
                      <div className="mb-4">
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {startDateInfo}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2 text-slate-700">
                      <CalendarDays className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatDate(challenge.startDate)}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-sm font-medium">{formatDate(challenge.endDate)}</span>
                    </div>

                    <div className="flex justify-between mt-auto pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{participantCount} Joined</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-700 font-bold">
                        <Gift className="w-4 h-4" />
                        <span>{challenge.reward} JP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-slate-700">
                No Challenges Found
              </h3>
              <p className="mt-2 text-slate-500">
                Try adjusting your search or filters.
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