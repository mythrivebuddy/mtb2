"use client";

import { List, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Component names must be in PascalCase (e.g., Page, MyComponent)
export default function Page() {
  const router = useRouter();
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateChallenge = () => {
    router.push("/create-challenge");
  };

  const handleChallengeRecord = () => {
    // Add logic for Challenges Record
    console.log("Challenges Record clicked");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 p-4">
      <div className="w-full max-w-5xl">
        <h1 className="mb-10 text-center text-5xl font-extrabold text-indigo-900 drop-shadow-lg">
          Challenges Hub
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={handleCreateChallenge}
            className="flex h-40 transform flex-col items-center justify-center rounded-xl bg-white p-6 text-center shadow-2xl transition-all hover:scale-105 hover:bg-indigo-50 hover:shadow-xl"
          >
            <PlusCircle className="mb-4 h-12 w-12 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-indigo-800">
              Create New Challenge
            </h2>
          </button>
          <button
            onClick={handleChallengeRecord}
            className="flex h-40 transform flex-col items-center justify-center rounded-xl bg-white p-6 text-center shadow-2xl transition-all hover:scale-105 hover:bg-indigo-50 hover:shadow-xl"
          >
            <List className="mb-4 h-12 w-12 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-indigo-800">
              View Challenge Records
            </h2>
          </button>
          <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-indigo-800">
              Join Existing
            </h2>
            <p className="mt-2 text-indigo-600">
              Explore and join challenges!
            </p>
          </div>
        </div>
        <p className="mt-10 text-center text-2xl font-bold text-indigo-900 drop-shadow-md">
          Ready to Kick Off? Let’s Dive In!!
        </p>
      </div>
    </div>
  );
}