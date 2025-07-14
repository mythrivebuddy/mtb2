"use client"

import { useState } from "react";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyChallenges() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hosted");
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);

  const hostedChallenges = [
    { name: "Fitness Marathon", description: "Run 5km daily", reward: "200 JP", startDate: "2025-07-15", endDate: "2025-08-13", participants: 15 },
    { name: "Coding Bootcamp", description: "Code 2 hours daily", reward: "150 JP", startDate: "2025-07-10", endDate: "2025-07-31", participants: 10 },
  ];

  const joinedChallenges = [
    { name: "Art Challenge", description: "Draw daily", reward: "100 JP", startDate: "2025-07-14", endDate: "2025-07-28", participants: 8 },
    { name: "Yoga Session", description: "30 mins yoga", reward: "80 JP", startDate: "2025-07-16", endDate: "2025-08-05", participants: 12 },
  ];

  const currentChallenges = activeTab === "hosted" ? hostedChallenges : joinedChallenges;

  const handleComplete = () => setIsCompletedModalOpen(true);
  const handleFail = () => setIsFailedModalOpen(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-extrabold text-purple-900 text-center mb-6 drop-shadow-lg">My Challenges</h1>
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setActiveTab("hosted")}
            className={`px-6 py-2 rounded-l-xl ${activeTab === "hosted" ? "bg-purple-600 text-white" : "bg-white text-purple-800"} transition-all hover:bg-purple-500`}
          >
            Hosted Challenges
          </button>
          <button
            onClick={() => setActiveTab("joined")}
            className={`px-6 py-2 rounded-r-xl ${activeTab === "joined" ? "bg-purple-600 text-white" : "bg-white text-purple-800"} transition-all hover:bg-purple-500`}
          >
            Joined Challenges
          </button>
        </div>
        {currentChallenges.map((challenge, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-xl mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-purple-900">{challenge.name}</h2>
              <p className="text-gray-700">{challenge.description}</p>
              <p className="text-purple-600">Reward: {challenge.reward}</p>
              <p className="text-gray-600">Start Date: {challenge.startDate}</p>
              <p className="text-gray-600">End Date: {challenge.endDate}</p>
            </div>
            <div className="mt-2 sm:mt-0">
              <button
                onClick={() => router.push(`/participants?name=${challenge.name}&participants=${challenge.participants}`)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center"
              >
                <Users className="w-5 h-5 mr-2" /> Total Participants: {challenge.participants}
              </button>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={handleComplete}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 mr-2 inline" /> Complete
                </button>
                <button
                  onClick={handleFail}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-5 h-5 mr-2 inline" /> Fail
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isCompletedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out hover:scale-105">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Challenge Completed!</h2>
            <p className="text-3xl font-cursive text-center text-purple-700 mb-6">Congratulations!</p>
            <p className="text-gray-700 mb-4">You’ve earned 200 JP and unlocked a badge!</p>
            <p className="text-purple-600 font-semibold">Share your success:</p>
            <div className="flex justify-center space-x-4 mt-4">
              <span className="text-purple-600">G</span>
              <span className="text-purple-600">in</span>
              <span className="text-purple-600">f</span>
              <span className="text-purple-600">o</span>
            </div>
            <button
              onClick={() => setIsCompletedModalOpen(false)}
              className="mt-6 w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all"
            >
              Close & Celebrate
            </button>
          </div>
        </div>
      )}
      {isFailedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out hover:scale-105">
            <h2 className="text-2xl font-bold text-red-900 mb-4">Challenge Failed!</h2>
            <p className="text-red-700 mb-4">Don’t worry, you can try again next time!</p>
            <p className="text-gray-600 mb-4">Penalty: 15 JP deducted. Current Balance: 85 JP</p>
            <p className="text-red-600 font-semibold">Tips: Stay consistent and plan better!</p>
            <button
              onClick={() => setIsFailedModalOpen(false)}
              className="mt-6 w-full bg-gradient-to-r from-red-500 to-pink-600 text-white p-3 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}