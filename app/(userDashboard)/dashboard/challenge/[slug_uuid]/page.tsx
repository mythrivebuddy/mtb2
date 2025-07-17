// File: app/challenge/[slug_uuid]/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Calendar, Check, Users } from 'lucide-react'; // For icons

// --- (The ChallengeDetails interface remains the same) ---
interface ChallengeDetails {
  id: string;
  title: string;
  description: string | null;
  mode: 'PUBLIC' | 'PERSONAL';
  reward: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED'; // Assuming you have a status field
  startDate: string;
  endDate: string;
  creator: {
    name: string;
  };
  templateTasks: Array<{
    id: string;
    description: string;
  }>;
  // Assuming you might have a participant count
  _count?: {
    enrollments: number;
  };
}

export default function ChallengeSharePage() {
  const params = useParams();
  const slug_uuid = params.slug_uuid as string;

  // --- (All your state and data fetching logic remains the same) ---
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (response.data && response.data.success) {
          setChallenge(response.data.challenge);
        } else {
          setError(response.data.message || "Failed to load challenge.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "An error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallengeData();
  }, [slug_uuid]);

  // --- (The loading and error UI remains the same) ---
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

  // --- NEW: Display the challenge details with the new design ---
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
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

        {/* Join Button */}
        <button className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
          Join Challenge
        </button>

      </div>
    </div>
  );
}