
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ActivityType } from "@prisma/client";
import { getJpAmountForActivity } from "@/lib/utils/jpAmount";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import { List, PlusCircle, Globe, X } from "lucide-react";
import CustomAccordion from "@/components/dashboard/user/ CustomAccordion";


export default function Page() {
  const router = useRouter();
  const { status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    if (status === "authenticated") {
      router.push("challenge/create-challenge");
    } else {
      setIsModalOpen(true);
    }
  };

  const handleChallengeRecord = () => {
    if (status === "authenticated") {
      router.push("challenge/my-challenges");
    } else {
      setIsModalOpen(true);
    }
  };

  const handleViewUpcoming = () => {
    router.push("challenge/upcoming-challenges");
  };

  useOnlineUserLeaderBoard();

  return (
    <>
    
      <CustomAccordion />
          
      
      
      <div className="flex min-h-screen items-start justify-center p-4 pt-12 md:pt-16">
        <div className="w-full max-w-5xl">
          <h1 className="mb-10 text-center text-4xl font-extrabold text-indigo-900 drop-shadow-lg md:text-5xl">
            Challenges Hub
          </h1>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <button
              onClick={handleCreateChallenge}
              className="flex h-40 flex-col items-center justify-center rounded-xl bg-white p-4 text-center shadow-2xl transition-transform hover:scale-105 hover:bg-indigo-50 hover:shadow-xl md:p-6"
            >
              <PlusCircle className="mb-3 h-10 w-10 text-indigo-600 md:mb-4 md:h-12 md:w-12" />
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

          <p className="mt-12 text-center text-lg font-bold text-indigo-900 drop-shadow-md md:text-2xl">
            Ready to Kick Off? Let’s Dive In!!
          </p>
        </div>
      </div>

      {/* Authentication Modal JSX */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl m-4"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
              Please Login to Continue
            </h2>
            <p className="text-center text-gray-500 mb-6">
              You need to be logged in to access this feature.
            </p>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => router.push('/signin')}
                className="w-full rounded-lg bg-indigo-600 py-3 px-6 text-base font-semibold text-white shadow-md hover:bg-indigo-700 transition-transform hover:scale-105"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="w-full rounded-lg bg-gray-200 py-3 px-6 text-base font-semibold text-gray-800 shadow-md hover:bg-gray-300 transition-transform hover:scale-105"
              >
                Create an Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}