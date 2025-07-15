"use client";

import { List, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleCreateChallenge = () => {
    router.push("challenge/create-challenge");
  };

  const handleChallengeRecord = () => {
    router.push("challenge/my-challenges");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 p-4">
      <div className="w-full max-w-4xl">
        <h1 className="mb-10 text-center text-5xl font-extrabold text-indigo-900 drop-shadow-lg">
          Challenges Hub
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <button
            onClick={handleCreateChallenge}
            className="flex h-40 flex-col items-center justify-center rounded-xl bg-white p-6 text-center shadow-2xl transition-transform hover:scale-105 hover:bg-indigo-50 hover:shadow-xl"
          >
            <PlusCircle className="mb-4 h-12 w-12 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-indigo-800">
              Create New Challenge
            </h2>
          </button>

          <button
            onClick={handleChallengeRecord}
            className="flex h-40 flex-col items-center justify-center rounded-xl bg-white p-6 text-center shadow-2xl transition-transform hover:scale-105 hover:bg-indigo-50 hover:shadow-xl"
          >
            <List className="mb-4 h-12 w-12 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-indigo-800">
              View Challenge Records
            </h2>
          </button>
        </div>

        <p className="mt-10 text-center text-2xl font-bold text-indigo-900 drop-shadow-md">
          Ready to Kick Off? Let’s Dive In!!
        </p>
      </div>
    </div>
  );
}
