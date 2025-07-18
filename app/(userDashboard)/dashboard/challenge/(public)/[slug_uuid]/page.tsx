// File: app/(userDashboard)/dashboard/challenge/[slug_uuid]/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Calendar, Check, Users, X } from 'lucide-react';

// --- LOGIN/SIGNUP PROMPT MODAL ---
// Is modal ko update kar diya hai taaki yeh aapke existing pages use kare
const LoginPromptModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const router = useRouter();
  const params = useParams();
  const slug_uuid = params.slug_uuid as string;

  if (!isOpen) return null;

  // Login ke baad waapis aane ke liye callback URL
  const callbackUrl = encodeURIComponent(`/dashboard/challenge/${slug_uuid}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-8 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Join the Challenge</h2>
        <p className="text-slate-600 mb-8">You need an account to join. Please login or create a new account.</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => router.push(`/signin?callbackUrl=${callbackUrl}`)}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all"
          >
            Login
          </button>
          <button 
            onClick={() => router.push(`/signup?callbackUrl=${callbackUrl}`)}
            className="w-full py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-all"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};


// --- PUBLIC CHALLENGE PAGE COMPONENT ---
// Interface same rahegi
interface ChallengeDetails {
  id: string;
  title: string;
  description: string | null;
  mode: 'PUBLIC' | 'PERSONAL';
  reward: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  startDate: string;
  endDate: string;
  creator: { name: string; };
  templateTasks: Array<{ id: string; description: string; }>;
  _count?: { enrollments: number; };
}

export default function ChallengeSharePage() {
  const params = useParams();
  const slug_uuid = params.slug_uuid as string;
  const { data: session, status: authStatus } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Data fetching logic same rahega
    if (!slug_uuid) return;
    const fetchChallengeData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/challenge/${slug_uuid}`);
        setChallenge(response.data.challenge);
      } catch (err) {
        setError("Failed to load challenge.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallengeData();
  }, [slug_uuid]);

  const handleJoinChallenge = () => {
    if (authStatus === 'authenticated') {
      alert(`Joining challenge: ${challenge?.title}`);
      // Yahan aap API call karke user ko enroll kar sakte hain
    } else {
      // Agar logged in nahi hai, to modal open karo
      setIsModalOpen(true);
    }
  };

  // Loading aur Error UI same rahega
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p>{error}</p></div>;
  if (!challenge) return <div className="min-h-screen flex items-center justify-center"><p>Challenge not found.</p></div>;

  return (
    <>
      {/* Ab yeh naya LoginPromptModal use karega */}
      <LoginPromptModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg space-y-6">
          {/* Baaki ka page design bilkul same rahega */}
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-slate-800">{challenge.title}</h1>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600">{challenge.reward} JP</p>
              <p className="text-sm text-slate-500">Reward</p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">{challenge.status}</span>
              <span className="px-3 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">{challenge.mode}</span>
            </div>
            <p className="text-sm text-slate-500">Created by <span className="font-semibold">{challenge.creator.name}</span></p>
          </div>
          <p className="text-slate-600">{challenge.description}</p>
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
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Tasks to Complete</h3>
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
          <button 
            onClick={handleJoinChallenge}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all"
          >
            Join Challenge
          </button>
        </div>
      </div>
    </>
  );
}
