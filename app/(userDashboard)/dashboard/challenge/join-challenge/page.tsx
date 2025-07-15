"use client";

import { useState } from "react";
import { StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [challengeInfo] = useState({
    title: "Coding challenge 2025",
    reward: "200 JP",
    cost: "75 JP",
    penalty: "15 JP/day",
    description: "A 30-day coding challenge to improve your logic and earn rewards!",
  });

  const handleJoin = () => {
    router.push("/dashboard/challenge/main-challenge");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <div className="w-full max-w-3xl">
        <div className="space-y-6 rounded-2xl bg-white p-6 text-center shadow-2xl">
          
          <div className="mt-4">
            <h2 className="text-2xl font-semibold text-purple-900">
              Challenge Details
            </h2>
            <p className="mt-2 text-gray-700">{challengeInfo.description}</p>
            <div className="mt-4 flex justify-between rounded-xl bg-purple-50 p-4">
              <div className="flex items-center">
                <StarIcon className="mr-2 h-6 w-6 text-yellow-500" />
                <span className="text-purple-800">Reward</span>
              </div>
              <span className="font-bold text-purple-700">
                {challengeInfo.reward}
              </span>
            </div>
            <div className="mt-2 flex justify-between rounded-xl bg-purple-50 p-4">
              <span className="text-purple-800">Participation Cost</span>
              <span className="font-bold text-purple-700">
                {challengeInfo.cost}
              </span>
            </div>
            <div className="mt-2 flex justify-between rounded-xl bg-purple-50 p-4">
              <span className="text-purple-800">Day-wise Penalty</span>
              <span className="font-bold text-purple-700">
                {challengeInfo.penalty}
              </span>
            </div>
            <button
              onClick={handleJoin}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 p-3 text-white transition-all hover:from-purple-600 hover:to-indigo-700"
            >
              Join Challenge Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}