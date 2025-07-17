// File: app/challenge/[slug_uuid]/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import axios from 'axios';
import { Calendar, Check, Users, Loader2, PartyPopper, AlertTriangle } from 'lucide-react'; // Import new icons

// --- (The ChallengeDetails interface remains the same) ---
interface ChallengeDetails {
  id: string;
  title: string;
  description: string | null;
  mode: 'PUBLIC' | 'PERSONAL';
  reward: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  startDate: string;
  endDate: string;
  creator: {
    name: string;
  };
  templateTasks: Array<{
    id: string;
    description: string;
  }>;
  _count?: {
    enrollments: number;
  };
}

export default function ChallengeSharePage() {
  const params = useParams();
  const router = useRouter(); // Initialize useRouter for redirection
  const slug_uuid = params.slug_uuid as string;

  // --- State for the page ---
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: State for the join button and modal ---
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoinSuccessModalOpen, setIsJoinSuccessModalOpen] = useState(false);

  // --- Data fetching logic (no changes here) ---
  useEffect(() => {
    if (!slug_uuid) {
      setIsLoading(false);
      setError("Challenge link is invalid.");
      return;
    }

    const fetchChallengeData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/challenge/${slug_uuid}`);
        setChallenge(response.data.challenge); // Assuming API returns { challenge: ... }
      } catch (err: any) {
        setError(err.response?.data?.error || "An error occurred fetching challenge details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallengeData();
  }, [slug_uuid]);

  // --- NEW: Handler for the Join Challenge button ---
  const handleJoinChallenge = async () => {
    if (!challenge) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      // This assumes the user is logged in. The API will return a 401 error if not.
      await axios.post('/api/challenge/enroll', {
        challengeId: challenge.id,
      });
      // On success, open the success modal
      setIsJoinSuccessModalOpen(true);
    } catch (err: any) {
      // Handle errors from the API, including "already enrolled" or "not authorized"
      setJoinError(err.response?.data?.error || "Could not join the challenge.");
    } finally {
      setIsJoining(false);
    }
  };
  
  // --- NEW: Handler for the modal's close button ---
  const handleCloseModalAndRedirect = () => {
    setIsJoinSuccessModalOpen(false);
    // Redirect to the user's challenges page
    router.push('/dashboard/challenge/my-challenges');
  };


  // --- Loading and error UI (no changes here) ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-lg text-slate-600">Loading Challenge...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Could not load challenge</h2>
            <p className="text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-lg text-slate-600">Challenge not found.</p>
        </div>
    );
  }

  // --- Main component JSX ---
  return (
    <>
      <div className="min-h-screen  flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg space-y-6">
          
          {/* Header: Title and Reward */}
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-slate-800">
              {challenge.title}
            </h1>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600">{challenge.reward} JP</p>
              <p className="text-sm text-slate-500">Reward</p>
            </div>
          </div>

          {/* Tags and Creator */}
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
              Created by <span className="font-semibold">{challenge.creator.name}</span>
            </p>
          </div>
          
          {/* Description */}
          <p className="text-slate-600">{challenge.description}</p>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Starts On</p>
              <p className="font-semibold text-slate-700">{new Date(challenge.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Ends On</p>
              <p className="font-semibold text-slate-700">{new Date(challenge.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Participants</p>
              <p className="font-semibold text-slate-700">{challenge._count?.enrollments ?? 0}</p>
            </div>
          </div>
          
          {/* Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Tasks to Complete</h3>
            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              {challenge.templateTasks.length > 0 ? (
                challenge.templateTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-full">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-slate-700">{task.description}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No tasks defined for this challenge.</p>
              )}
            </div>
          </div>

          {/* --- UPDATED: Join Button Section --- */}
          <div className="pt-4">
            {joinError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span>{joinError}</span>
                </div>
            )}
            <button 
              onClick={handleJoinChallenge}
              disabled={isJoining}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Challenge"
              )}
            </button>
          </div>

        </div>
      </div>

      {/* --- NEW: Enrollment Success Modal --- */}
      {isJoinSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <PartyPopper className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Successfully Joined!
            </h2>
            <p className="text-slate-500 mb-6">
              You are now enrolled in the &quot;{challenge?.title}&quot; challenge. Good luck!
            </p>
            <button
              onClick={handleCloseModalAndRedirect}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all"
            >
              View My Challenges
            </button>
          </div>
        </div>
      )}
    </>
  );
}