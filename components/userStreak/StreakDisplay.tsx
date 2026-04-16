"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "../ui/card";

export function StreakDisplay() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const res = await axios.get(`/api/login-streak/userStreak`);
      return res.data;
    },
  });

  if (isLoading) return null; // Don't show anything while loading
  if (error) return null; // Don't show anything if there's an error

  const streakCount = data?.streak?.currentStreak || 0;

  // Don't render anything if there's no active streak
  if (streakCount <= 0) return null;

  // return (
  // old topbar streak display i have removed 
  //   <div className="flex items-center gap-1 sm:gap-2">
  //     <div className="text-md sm:text-xl">🔥</div>
  //     <div>
  //       <div className="font-bold max-sm:text-[0.57rem] sm:text-nowrap sm:text-md">
  //         {streakCount} Day{streakCount !== 1 ? 's' : ''}  Streak
  //       </div>
  //     </div>
  //   </div>
  // );
  
  return (
    <Card className="p-3 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="bg-orange-100 p-2 rounded-lg">
          <span className="text-lg">🔥</span>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <p className="text-lg font-semibold text-orange-500 leading-none">
            {streakCount}
          </p>
          <p className="text-xs text-gray-500 leading-tight">
            Day{streakCount !== 1 ? "s" : ""} Streak
          </p>
        </div>
      </div>
    </Card>
  );
}
