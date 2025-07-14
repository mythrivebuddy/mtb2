"use client"

import { useState } from "react";
import { StarIcon} from "lucide-react";
import { useRouter } from "next/navigation";


export default function page() {
  const router = useRouter();
  const [challengeInfo] = useState({
    title: "Coding challange 2025",
    reward: "200 JP",
    cost: "75 JP",
    penalty: "15 JP/day",
    description: "A 30-day coding challenge to improve your logic and earn rewards!",
  });

  const handleJoin = () => {
    router.push("/main-challenge");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white p-6 rounded-2xl shadow-2xl space-y-6 text-center">
          <input
            className="p-3 border-2 border-purple-200 rounded-xl w-full focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            placeholder="Enter Invite Link (e.g., https://challengehub.link/xyz)"
          />
          <button
            onClick={handleJoin}
            className="bg-purple-500 text-white p-3 rounded-xl hover:bg-purple-600 transition-colors w-full"
          >
            Enter
          </button>
          <div className="mt-4">
            <h2 className="text-2xl font-semibold text-purple-900">Challenge Details</h2>
            <p className="text-gray-700 mt-2">{challengeInfo.description}</p>
            <div className="flex justify-between mt-4 p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center">
                <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
                <span className="text-purple-800">Reward</span>
              </div>
              <span className="text-purple-700 font-bold">{challengeInfo.reward}</span>
            </div>
            <div className="flex justify-between mt-2 p-4 bg-purple-50 rounded-xl">
              <span className="text-purple-800">Participation Cost</span>
              <span className="text-purple-700 font-bold">{challengeInfo.cost}</span>
            </div>
            <div className="flex justify-between mt-2 p-4 bg-purple-50 rounded-xl">
              <span className="text-purple-800">Day-wise Penalty</span>
              <span className="text-purple-700 font-bold">{challengeInfo.penalty}</span>
            </div>
            <button
              onClick={handleJoin}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all w-full mt-6"
            >
              Join Challenge Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}