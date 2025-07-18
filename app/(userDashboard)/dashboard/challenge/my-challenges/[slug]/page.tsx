// File: app/(userDashboard)/dashboard/challenge/my-challenges/[slug]/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Flame, Target, Users, Calendar, ChevronLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';

// --- TYPE DEFINITIONS for our fetched data ---
interface Task {
  id: string;
  description: string;
  completed: boolean;
}

interface LeaderboardPlayer {
    id: string;
    name: string;
    score: number;
    avatar: string;
}

interface ChallengeDetails {
  title: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  streak: number;
  points: number;
  startDate: string;
  endDate: string;
  dailyTasks: Task[];
  leaderboard: LeaderboardPlayer[];
}

// --- HELPER COMPONENTS (can be moved to their own files) ---
const StatCard = ({ icon, label, value, colorClass }: { icon: React.ReactNode, label: string, value: string | number, colorClass: string }) => (
  <div className="bg-white p-4 rounded-xl shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const TaskItem = ({ task, onToggle }: { task: Task, onToggle: (taskId: string, newStatus: boolean) => void }) => (
  <div
    onClick={() => onToggle(task.id, !task.completed)}
    className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
      task.completed ? 'bg-green-100 text-gray-500 line-through' : 'bg-gray-50 hover:bg-gray-100'
    }`}
  >
    <div className={`w-6 h-6 rounded-full border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center mr-4`}>
      {task.completed && <CheckCircle className="w-5 h-5 text-white" />}
    </div>
    <span className="flex-grow">{task.description}</span>
  </div>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function ChallengeManagementPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchChallengeDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/challenge/my-challenge/${slug}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch challenge: ${response.statusText}`);
        }
        const data: ChallengeDetails = await response.json();
        setChallenge(data);
        // A user is enrolled if they have tasks.
        setIsEnrolled(data.dailyTasks && data.dailyTasks.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeDetails();
  }, [slug]);
  
  // This function optimistically updates the UI and prepares for an API call.
  const handleToggleTask = async (taskId: string, newStatus: boolean) => {
    // Optimistically update the UI
    setChallenge(prev => {
        if (!prev) return null;
        return {
            ...prev,
            dailyTasks: prev.dailyTasks.map(t => t.id === taskId ? { ...t, completed: newStatus } : t)
        }
    });
    
    // TODO: Create this API endpoint to persist the change.
    // Example:
    // await fetch(`/api/challenge/tasks/${taskId}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ isCompleted: newStatus })
    // });
    console.log(`Task ${taskId} toggled to ${newStatus}. API call to persist this is needed.`);
  };
  
  const handleJoinChallenge = () => {
      // TODO: Create an API endpoint to enroll the user in the challenge.
      alert("Joining challenge... (API call needed)");
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10 p-4">{error}</div>;
  }
  
  if (!challenge) {
    return <div className="text-center text-gray-500 mt-10 p-4">Challenge data not found.</div>
  }

  const daysLeft = Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-indigo-600">
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                challenge.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
                {challenge.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-4">{challenge.title}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Flame className="w-6 h-6 text-white" />} label="Your Streak" value={`${challenge.streak} Days`} colorClass="bg-orange-500" />
          <StatCard icon={<Target className="w-6 h-6 text-white" />} label="Your JP Balance" value={challenge.points.toLocaleString()} colorClass="bg-purple-500" />
          <StatCard icon={<Calendar className="w-6 h-6 text-white" />} label="Ends In" value={`${daysLeft > 0 ? daysLeft : 0} Days`} colorClass="bg-teal-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Today&apos;s Activities</h2>
              {isEnrolled ? (
                <div className="space-y-3">
                    {challenge.dailyTasks.length > 0 ? (
                        challenge.dailyTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />)
                    ) : (
                        <p className="text-gray-500">No tasks defined for this challenge yet.</p>
                    )}
                </div>
              ) : (
                <div className="text-center py-10">
                    <p className="text-gray-600 mb-4">You haven&apos;t joined this challenge yet.</p>
                    <button 
                        onClick={handleJoinChallenge}
                        className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Join Challenge
                    </button>
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
               <h2 className="text-2xl font-bold text-gray-800 mb-4">Monthly Progress</h2>
               <div className="text-center text-gray-500 py-10">
                 <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                 <p>A visual calendar of your activity streak will be displayed here.</p>
               </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-indigo-500"/> Leaderboard
            </h2>
            <ul className="space-y-4">
              {challenge.leaderboard.map((player, index) => (
                <li key={player.id} className="flex items-center">
                  <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                  <Image
                    src={player.avatar}
                    alt={player.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-4"
                  />
                  <div className="flex-grow">
                    <p className={`font-semibold text-gray-800`}>{player.name}</p>
                    <p className="text-sm text-gray-500">{player.score.toLocaleString()} Streak Points</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}