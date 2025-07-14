"use client"

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

export default function Participants() {
  const searchParams = useSearchParams();
  const [participantList, setParticipantList] = useState([
    { day: "Day 1", name: "John Doe" },
    { day: "Day 2", name: "Jane Smith" },
  ]);

  // Get query parameters
  const name = searchParams.get("name");
  const participants = searchParams.get("participants");

  useEffect(() => {
    if (!name || !participants) {
      redirect("/my-challenges");
    }
  }, [name, participants]);

  const removeParticipant = (index: number) => {
    setParticipantList(participantList.filter((_, i) => i !== index));
  };

  if (!name || !participants) {
    return <div className="text-center text-gray-600">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-extrabold text-indigo-900 text-center mb-6 drop-shadow-lg">Participants</h1>
        <div className="bg-white p-4 rounded-xl shadow-xl mb-4">
          <h2 className="text-xl font-semibold text-indigo-800 mb-2">About Challenge</h2>
          <p className="text-gray-700">{name} - {participants} Participants</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-indigo-800 mb-4">Participants List</h2>
          {participantList.map((participant, index) => (
            <div key={index} className="flex justify-between items-center mb-2 p-2 bg-indigo-50 rounded-lg">
              <div>
                <span className="text-gray-500 mr-2">{participant.day}</span>
                <span className="text-indigo-800">{participant.name}</span>
              </div>
              <button
                onClick={() => removeParticipant(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}