"use client";

import { LinkIcon } from "lucide-react";
// import { useRouter } from "next/navigation";

export default function LetOthersRoll() {
  // const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-extrabold text-indigo-900 text-center mb-8 drop-shadow-lg">
          Invite Others to Join!
        </h1>
        <p className="text-center mb-8 text-lg text-indigo-700">
          Share your challenge with friends and grow your community!
        </p>
        <div className="bg-white p-6 rounded-2xl shadow-2xl space-y-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              className="p-3 border-2 border-indigo-200 rounded-xl w-full sm:w-3/4 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Invite Link (e.g., https://challengehub.link/xyz)"
              value="https://challengehub.link/xyz123"
            />
            <button
              onClick={() => alert("Link copied to clipboard!")}
              className="bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors w-full sm:w-auto"
            >
              <LinkIcon className="w-5 h-5 mr-2 inline" /> Copy Link
            </button>
          </div>
        </div>
        <p className="text-center mt-10 text-2xl font-bold text-indigo-900 drop-shadow-md">
          Let’s Expand the Fun!!
        </p>
      </div>
    </div>
  );
}
