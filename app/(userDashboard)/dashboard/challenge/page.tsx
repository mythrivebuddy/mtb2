"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import CreateChallenge from "./create-challenge/page";
import { toast } from "sonner";
import { useClickAway } from "react-use";

type Challenge = ChallengeDetailsForClient & {
  isHosted?: boolean;
  id: string;
  creatorName: string;
  cardType?: "myChallenge" | "upcoming";
  enrollments?: { userId: string }[];
  _count?: { enrollments: number };
};

type FilterStatus = Challenge["status"] | "ALL" | "HOSTED" | "JOINED";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getStartDateInfo = (startDate: string): string | null => {
  const now = new Date();
  const start = new Date(startDate);
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  if (start < now) return null;
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Starting Today";
  if (diffDays === 1) return "Starts in 1 day";
  return `Starts in ${diffDays} days`;
};

export default function ChallengePage() {
  const router = useRouter();
  const { status: authStatus, data: session } = useSession();

  const category1: FilterStatus[] = ["ALL", "JOINED", "HOSTED"];
  const category2: FilterStatus[] = ["ACTIVE", "UPCOMING", "COMPLETED"];

  const [searchTerm, setSearchTerm] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  // Load default filters OR from localStorage
  const [selectedFilters, setSelectedFilters] = useState<FilterStatus[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("challengeFilters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            Array.isArray(parsed) &&
            parsed.length === 2 &&
            category1.includes(parsed[0]) &&
            category2.includes(parsed[1])
          ) {
            return parsed;
          }
        } catch {
          // ignore parsing errors
        }
      }
    }
    return ["ALL", "UPCOMING"]; // default for first visit
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickAway(searchRef, () => setSearchVisible(false));

  useEffect(() => {
    if (searchVisible) {
      inputRef.current?.focus();
    }
  }, [searchVisible]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("challengeFilters", JSON.stringify(selectedFilters));
  }, [selectedFilters]);

  const handleFilterClick = (filter: FilterStatus) => {
    setSelectedFilters((prev) => {
      if (category1.includes(filter)) {
        return [filter, prev.find((f) => category2.includes(f)) || category2[0]];
      }
      if (category2.includes(filter)) {
        return [prev.find((f) => category1.includes(f)) || category1[0], filter];
      }
      return prev;
    });
  };

  const handleCreateClick = () => {
    if (authStatus === "authenticated") {
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

  const formatFilterLabel = (label: string) => {
    if (label === "JOINED") return "Joined";
    return label.charAt(0) + label.slice(1).toLowerCase();
  };

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["getAllChallenges"],
    queryFn: async () => {
      const res = await axios.get("/api/challenge/get-all");
      return res.data;
    },
  });
  const categories = category1.concat(category2);

  const filtered = useMemo(() => {
    if (!challenges) return [];
    return challenges.filter((c) => {
      const matchesSearch = c.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const category1Match =
        selectedFilters.includes("ALL") ||
        (selectedFilters.includes("HOSTED") &&
          c.creator?.id === session?.user?.id) ||
        (selectedFilters.includes("JOINED") &&
          c.enrollments?.some((e) => e.userId === session?.user?.id));

      const category2Match = selectedFilters.includes(c.status);

      return matchesSearch && category1Match && category2Match;
    });
  }, [challenges, searchTerm, selectedFilters, session?.user?.id]);

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-4">
        <div>
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
        </div>
        <div className="flex-1 text-center px-4">
          <h1 className="text-4xl font-extrabold text-indigo-900">
            Challenges
          </h1>
        </div>
        <div>
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
      </div>

      {/* Subtitle */}
      <p className="text-center text-lg text-slate-600 max-w-2xl mx-auto mb-10">
        Your personal challenges and new ones to discover, all in one place.
      </p>

      {/* Filters */}
      <div className="flex   items-center gap-2 mb-4 justify-center">
         <div className="flex flex-wrap justify-center gap-2 mb-4">
          {categories.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              className={cn(
                "px-5 py-2 text-sm font-semibold rounded-full transition",
                selectedFilters.includes(filter)
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
              )}
            >
              {formatFilterLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500">
          No challenges found for the selected filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const startDateInfo = getStartDateInfo(c.startDate);
            return (
              <div
                key={c.id}
                onClick={() =>
                  router.push(`/dashboard/challenge/my-challenges/${c.id}`)
                }
                className="relative overflow-hidden bg-white rounded-xl shadow hover:shadow-lg p-6 border cursor-pointer flex flex-col transition hover:-translate-y-1"
              >
                {c?.enrollments?.some(
                  (e) => e.userId === session?.user?.id
                ) && (
                  <div
                    className="absolute top-4 -right-9 transform rotate-45 bg-indigo-500 text-center text-white text-sm font-semibold py-1 w-32"
                    aria-label="Joined Challenge"
                  >
                    Joined
                  </div>
                )}
                <div className="mb-2 pt-4">
                  <h3 className="text-xl font-bold text-indigo-800 truncate">
                    {c.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {c.description || "No description available."}
                </p>
                <span className="inline-block w-fit bg-gradient-to-r from-indigo-50 to-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-purple-100 mb-4">
                  Created by : {c.creatorName}
                </span>

                {startDateInfo && (
                  <div className="mb-4">
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {startDateInfo}
                    </span>
                  </div>
                )}
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
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p className="mt-12 text-center text-lg font-bold text-indigo-900 drop-shadow-md md:text-2xl">
        Ready to Kick Off? Let’s Dive In!!
      </p>
    </div>
  );
}
