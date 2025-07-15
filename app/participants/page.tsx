"use client";

import { useSearchParams, redirect } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Trash2 } from "lucide-react";

/**
 * This is the client component that contains all the logic
 * that depends on search parameters.
 */
function ParticipantsList() {
  const searchParams = useSearchParams();
  const [participantList, setParticipantList] = useState([
    { day: "Day 1", name: "John Doe" },
    { day: "Day 2", name: "Jane Smith" },
  ]);

  // Get query parameters
  const name = searchParams.get("name");
  const participants = searchParams.get("participants");

  // On the client, redirect if parameters are missing
  useEffect(() => {
    if (!name || !participants) {
      redirect("/my-challenges");
    }
  }, [name, participants]);

  const removeParticipant = (index: number) => {
    setParticipantList(participantList.filter((_, i) => i !== index));
  };

  // A check to prevent rendering the full UI before redirecting
  if (!name || !participants) {
    // This will be shown briefly on the client before the redirect is triggered
    return <div className="text-center text-gray-600">Redirecting...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 p-4">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-extrabold text-indigo-900 drop-shadow-lg">
          Participants
        </h1>
        <div className="mb-4 rounded-xl bg-white p-4 shadow-xl">
          <h2 className="mb-2 text-xl font-semibold text-indigo-800">
            About Challenge
          </h2>
          <p className="text-gray-700">
            {name} - {participants} Participants
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-indigo-800">
            Participants List
          </h2>
          {participantList.map((participant, index) => (
            <div
              key={index}
              className="mb-2 flex items-center justify-between rounded-lg bg-indigo-50 p-2"
            >
              <div>
                <span className="mr-2 text-gray-500">{participant.day}</span>
                <span className="text-indigo-800">{participant.name}</span>
              </div>
              <button
                onClick={() => removeParticipant(index)}
                className="text-red-500 transition-colors hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * This is the main page component. It wraps the client component
 * in a Suspense boundary to handle client-side rendering.
 */
export default function ParticipantsPage() {
  return (
    // The Suspense boundary is required for components that use useSearchParams
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-lg">Loading...</div>}>
      <ParticipantsList />
    </Suspense>
  );
}