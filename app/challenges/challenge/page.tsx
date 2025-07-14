"use client"

import { List, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function page() {
  const router = useRouter();
//   const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateChallenge = () => {
    router.push("/create-challenge");
  };

  const handleChallengeRecord = () => {
    // Add logic for Challenges Record
    console.log("Challenges Record clicked");
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-5xl font-extrabold text-indigo-900 text-center mb-10 drop-shadow-lg">Challenges Hub</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={handleCreateChallenge}
            className="bg-white p-6 rounded-xl shadow-2xl hover:bg-indigo-50 hover:shadow-xl transition-all transform hover:scale-105 text-center flex flex-col items-center justify-center h-40"
          >
            <PlusCircle className="w-12 h-12 text-indigo-600 mb-4" />
            <h2 className="text-2xl font-semibold text-indigo-800">Create New Challenge</h2>
          </button>
          <button
            onClick={handleChallengeRecord}
            className="bg-white p-6 rounded-xl shadow-2xl hover:bg-indigo-50 hover:shadow-xl transition-all transform hover:scale-105 text-center flex flex-col items-center justify-center h-40"
          >
            <List className="w-12 h-12 text-indigo-600 mb-4" />
            <h2 className="text-2xl font-semibold text-indigo-800">View Challenge Records</h2>
          </button>
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center justify-center h-40">
            <h2 className="text-2xl font-semibold text-indigo-800">Join Existing</h2>
            <p className="text-indigo-600 mt-2">Explore and join challenges!</p>
          </div>
        </div>
        <p className="text-center mt-10 text-2xl font-bold text-indigo-900 drop-shadow-md">Ready to Kick Off? Let’s Dive In!!</p>
      </div>
    </div>
  );
}