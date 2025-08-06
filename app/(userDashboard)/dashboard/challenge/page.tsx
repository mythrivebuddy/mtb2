"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarDays,
  Gift,
  Loader2,
  PlusCircle,
  Search,
  Users,
} from "lucide-react";
import { ChallengeDetailsForClient } from "@/types/client/challengeDetail";
import { cn } from "@/lib/utils/tw";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import CreateChallenge from "./create-challenge/page";
import { toast } from "sonner";
import { useClickAway } from "react-use";

// --- Types ---
type Challenge = ChallengeDetailsForClient & {
  isHosted?: boolean;
  cardType?: "myChallenge" | "upcoming";
};

// --- API Calls ---
const fetchUpcomingChallenges = async () => {
  const { data } = await axios.get("/api/challenge/upcoming");
  return data;
};

const fetchMyChallenges = async () => {
  const [hostedRes, joinedRes] = await Promise.all([
    axios.get(`/api/challenge/my-challenge?type=hosted`),
    axios.get(`/api/challenge/my-challenge?type=joined`),
  ]);

  const hostedChallenges = hostedRes.data.map((c: ChallengeDetailsForClient) => ({
    ...c,
    isHosted: true,
    cardType: "myChallenge",
  }));

  const joinedChallenges = joinedRes.data.map((c: ChallengeDetailsForClient) => ({
    ...c,
    cardType: "myChallenge",
  }));

  return [...hostedChallenges, ...joinedChallenges];
};

// --- Helpers ---
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// --- Main Component ---
export default function ChallengePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Challenge["status"] | "ALL" | "HOSTED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickAway(searchRef, () => setSearchVisible(false));

  const { data: myChallenges, isLoading: loadingMy } = useQuery<Challenge[]>({
    queryKey: ["myChallenges"],
    queryFn: fetchMyChallenges,
    enabled: status === "authenticated",
  });

  const { data: upcomingChallenges, isLoading: loadingUpcoming } = useQuery<Challenge[]>({
    queryKey: ["upcomingChallenges"],
    queryFn: fetchUpcomingChallenges,
  });

  const myIds = new Set(myChallenges?.map((c) => c.id));
  const availableChallenges =
    upcomingChallenges?.filter((c) => !myIds.has(c.id)).map((c) => ({
      ...c,
      status: "UPCOMING",
      cardType: "upcoming",
    })) || [];
  const all = [...(myChallenges || []), ...availableChallenges];

  useEffect(() => {
    if (status !== "authenticated") {
      setSelectedStatus("UPCOMING");
    } else {
      const hasJoined = myChallenges?.some((c) => !c.isHosted);
      const hasHosted = myChallenges?.some((c) => c.isHosted);
      if (hasJoined) setSelectedStatus("ACTIVE");
      else if (hasHosted) setSelectedStatus("HOSTED");
      else setSelectedStatus("UPCOMING");
    }
  }, [status, myChallenges]);

  useEffect(() => {
    if (searchVisible) {
      inputRef.current?.focus();
    }
  }, [searchVisible]);

  const filtered = all
    .filter((c) => {
      if (selectedStatus === "ALL") return true;
      if (selectedStatus === "HOSTED") return c.isHosted;
      return c.status === selectedStatus;
    })
    .filter((c) => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateClick = () => {
    if (status === "authenticated") {
      setIsModalOpen(true);
    } else {
      toast.error("Login to create a challenge.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchVisible(false);
    }
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition"
            >
              <PlusCircle size={28} />
              <span className="font-semibold hidden sm:inline">Create</span>
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateChallenge onSuccess={() => setIsModalOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setSearchVisible((prev) => !prev)}
            className="p-1 rounded-full hover:bg-gray-100 transition"
            aria-label="Toggle search"
          >
            <Search size={24} className="text-gray-600" />
          </button>

          {searchVisible && (
            <div className="absolute right-0 top-10 z-20 bg-white border border-gray-300 rounded-lg shadow-lg p-2 w-72 flex items-center gap-2 animate-fade-in transition">
              <Search size={16} className="text-gray-400" />
              <input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search challenges..."
                className="flex-1 text-sm bg-transparent focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-gray-400 hover:text-gray-600 text-lg px-1"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-indigo-900">Challenges</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-2">
          Your personal challenges and new ones to discover, all in one place.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {["ALL", "ACTIVE", "UPCOMING", "COMPLETED", "HOSTED"].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status as any)}
            className={cn(
              "px-5 py-2 text-sm font-semibold rounded-full transition",
              selectedStatus === status
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
            )}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loadingMy || loadingUpcoming ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500">No challenges found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() =>
                router.push(
                  `/dashboard/challenge/${c.cardType === "myChallenge" ? "my-challenges" : "upcoming-challenges"}/${c.id}`
                )
              }
              className="bg-white rounded-xl shadow hover:shadow-lg p-6 border cursor-pointer flex flex-col transition hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-indigo-800">{c.title}</h3>
                {c.isHosted && (
                  <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full">
                    Hosted
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {c.description || "No description available."}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm">{formatDate(c.startDate)}</span>
                <span className="text-slate-300">→</span>
                <span className="text-sm">{formatDate(c.endDate)}</span>
              </div>
              <div className="flex justify-between mt-auto pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>{c._count?.enrollments ?? 0} Joined</span>
                </div>
                <div className="flex items-center gap-2 text-purple-700 font-bold">
                  <Gift className="w-4 h-4" />
                  <span>{c.reward} JP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <p className="mt-12 text-center text-lg font-bold text-indigo-900 drop-shadow-md md:text-2xl">
        Ready to Kick Off? Let’s Dive In!!
      </p>
    </div>
  );
}
