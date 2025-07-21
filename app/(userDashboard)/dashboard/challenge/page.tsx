"use client";

import { useEffect, useState } from "react";
import { ActivityType } from "@prisma/client";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import { List, PlusCircle, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { getJpAmountForActivity } from "@/lib/utils/jpAmount";

export default function Page() {
  const router = useRouter();
  const [fee, setFee] = useState<number | null>(null);

  useEffect(() => {
    const loadFee = async () => {
      const amount = await getJpAmountForActivity(
        "CHALLENGE_CREATION_FEE" as ActivityType
      );
      setFee(amount);
    };

    loadFee();
  }, []);

  const handleCreateChallenge = () => {
    router.push("challenge/create-challenge");
  };

  const handleChallengeRecord = () => {
    router.push("challenge/my-challenges");
  };

  const handleViewUpcoming = () => {
    router.push("challenge/upcoming-challenges");
  };

  useOnlineUserLeaderBoard();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Responsive heading: smaller on mobile, larger on desktop */}
        <h1 className="mb-8 text-center text-4xl font-extrabold text-indigo-900 drop-shadow-lg md:mb-10 md:text-5xl">
          Challenges Hub
        </h1>

        {/* Responsive grid: 1 column on mobile, 3 on desktop, with adjusted gap */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <button
            onClick={handleCreateChallenge}
            className="flex h-40 flex-col items-center justify-center rounded-xl bg-white p-4 text-center shadow-2xl transition-transform hover:scale-105 hover:bg-indigo-50 hover:shadow-xl md:p-6"
          >
            <PlusCircle className="mb-3 h-10 w-10 text-indigo-600 md:mb-4 md:h-12 md:w-12" />
            {/* Responsive text for card heading */}
            <h2 className="text-xl font-semibold text-indigo-800 md:text-2xl">
              Create Challenge
            </h2>
            <div className="font-semibold text-indigo-800">
              Creation fee:{" "}
              <span className="text-yellow-500">
                {fee === null ? "Loading..." : `${fee} JP`}
              </span>
            </div>
          </button>

          <button
            onClick={handleChallengeRecord}
            className="flex h-40 flex-col items-center justify-center rounded-xl bg-white p-4 text-center shadow-2xl transition-transform hover:scale-105 hover:bg-indigo-50 hover:shadow-xl md:p-6"
          >
            <List className="mb-3 h-10 w-10 text-indigo-600 md:mb-4 md:h-12 md:w-12" />
            <h2 className="text-xl font-semibold text-indigo-800 md:text-2xl">
              My Challenges
            </h2>
          </button>

          <button
            onClick={handleViewUpcoming}
            className="flex h-40 flex-col items-center justify-center rounded-xl bg-white p-4 text-center shadow-2xl transition-transform hover:scale-105 hover:bg-indigo-50 hover:shadow-xl md:p-6"
          >
            <Globe className="mb-3 h-10 w-10 text-indigo-600 md:mb-4 md:h-12 md:w-12" />
            <h2 className="text-xl font-semibold text-indigo-800 md:text-2xl">
              Upcoming Challenges
            </h2>
          </button>
        </div>

        {/* Responsive bottom text */}
        <p className="mt-8 text-center text-lg font-bold text-indigo-900 drop-shadow-md md:mt-10 md:text-2xl">
          Ready to Kick Off? Let’s Dive In!!
        </p>
      </div>
    </div>
  );
}