"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Check, X, PartyPopper } from "lucide-react";
import { ChallengeDetailsForClient } from "@/types/client/challengeDetail"; // <-- IMPORT THE NEW TYPE

// A modal for users who are not logged in
const LoginPromptModal = ({
  isOpen,
  onClose,
  challengeSlug,
}: {
  isOpen: boolean;
  onClose: () => void;
  challengeSlug: string;
}) => {
  const router = useRouter();
  if (!isOpen) return null;
  const callbackUrl = encodeURIComponent(`/challenge/${challengeSlug}`);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
           {" "}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-8 relative text-center">
               {" "}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
                    <X size={24} />       {" "}
        </button>
               {" "}
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    Join the Challenge        {" "}
        </h2>
               {" "}
        <p className="text-slate-600 mb-8">
                    You need an account to join. Please login or create a new
          account.        {" "}
        </p>
               {" "}
        <div className="space-y-4">
                   {" "}
          <button
            onClick={() => router.push(`/signin?callbackUrl=${callbackUrl}`)}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all"
          >
                        Login          {" "}
          </button>
                   {" "}
          <button
            onClick={() => router.push(`/signup?callbackUrl=${callbackUrl}`)}
            className="w-full py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-all"
          >
                        Sign Up          {" "}
          </button>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

// A modal for after a user successfully joins
const SuccessModal = ({
  isOpen,
  onClose,
  challengeTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  challengeTitle: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
           {" "}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
               {" "}
        <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />       {" "}
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Successfully Joined!        {" "}
        </h2>
               {" "}
        <p className="text-slate-500 mb-6">
                    You are now enrolled in &quot;{challengeTitle}&quot;. Your
          tasks are           being prepared.        {" "}
        </p>
               {" "}
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all"
        >
                    View My Challenges        {" "}
        </button>
             {" "}
      </div>
         {" "}
    </div>
  );
};

// The props now use the new, serializable type
export default function ChallengeDetailClient({
  challenge,
}: {
  challenge: ChallengeDetailsForClient;
}) {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const handleJoinChallenge = async () => {
    if (authStatus === "authenticated") {
      setIsJoining(true);
      try {
        await axios.post("/api/challenge/enroll", {
          challengeId: challenge.id,
        });
        setIsEnrolled(true);
        setIsSuccessModalOpen(true);
      } catch (_err) {
        console.error(_err);
        // IMPORTANT: Avoid using alert() in Next.js apps.
        // Consider a toast notification library instead.
      } finally {
        setIsJoining(false);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    router.push("/dashboard/challenge/my-challenges");
  };

  return (
    <>
      <LoginPromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        challengeSlug={`${challenge.slug}-${challenge.id}`}
      />
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        challengeTitle={challenge.title}
      />

      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-slate-800">
              {challenge.title}
            </h1>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600">
                {challenge.reward} JP
              </p>
              <p className="text-sm text-slate-500">Reward</p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                {challenge.status}
              </span>
              <span className="px-3 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">
                {challenge.mode}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Created by{" "}
              <span className="font-semibold">{challenge.creator.name}</span>
            </p>
          </div>
          <p className="text-slate-600">{challenge.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Starts On</p>
              <p className="font-semibold text-slate-700">
                {/* This code still works because new Date() can parse the string */}
                {new Date(challenge.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Ends On</p>
              <p className="font-semibold text-slate-700">
                {/* This code still works because new Date() can parse the string */}
                {new Date(challenge.endDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Participants</p>
              <p className="font-semibold text-slate-700">
                {challenge._count?.enrollments ?? 0}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Tasks to Complete
            </h3>
            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              {challenge.templateTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-full">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-slate-700">{task.description}</span>
                </div>
              ))}
            </div>
          </div>
          {isEnrolled ? (
            <div className="w-full py-3 bg-green-100 text-green-800 font-semibold rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 mr-2" />
              Joined
            </div>
          ) : (
            <button
              onClick={handleJoinChallenge}
              disabled={isJoining}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all disabled:bg-purple-400"
            >
              {isJoining ? "Processing..." : "Join Challenge"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
