// File: app/(userDashboard)/dashboard/challenge/let-others-roll/page.tsx

"use client";

import { LinkIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";

// Define the structure of your challenge data
interface ChallengeDetails {
  id: string;
  slug: string;
  title: string;
  description: string | null;
}

export default function LetOthersRoll() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shareableLink, setShareableLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [challengeDetails, setChallengeDetails] = useState<ChallengeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = searchParams.get("slug");
    const uuid = searchParams.get("uuid");

    // Get the base URL from the environment variable.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    if (!slug || !uuid) {
      setError("Challenge details are missing from the URL.");
      setIsLoading(false);
      setShareableLink("Link not available.");
      return;
    }

    // --- CONSTRUCT THE FRONTEND URL ---
    const newShareableLink = `${baseUrl}/dashboard/challenge/${slug}-${uuid}`;
    setShareableLink(newShareableLink);

    // --- FETCH DATA FROM THE BACKEND API ---
    const fetchChallengeDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // --- CALL THE BACKEND API URL ---
        const response = await axios.get(`/api/challenge/${slug}-${uuid}`);
        
        if (response.data && response.data.success) {
          setChallengeDetails(response.data.challenge);
        } else {
          setError(response.data.message || "Failed to load challenge details.");
        }
      } catch (err) { // Changed: Removed ': any'
        console.error("Error fetching challenge details:", err);
        // Added: Type check for Axios error
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "An error occurred fetching the data.");
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallengeDetails();
  }, [searchParams]);

  const handleCopyLink = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
        console.error('Failed to copy link: ', err);
    });
  };

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-extrabold text-slate-800 text-center mb-8 drop-shadow-md">
          Invite Others to Join!
        </h1>
        <p className="text-center mb-8 text-lg text-slate-600">
          Your challenge is ready! Share this link with your friends.
        </p>
        <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6 text-center border border-slate-100">
          {isLoading && (
            <p className="text-slate-600">Loading challenge details...</p>
          )}
          {error && (
            <p className="text-red-500">{error}</p>
          )}
          {challengeDetails && (
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-purple-700 mb-2">
                {challengeDetails.title}
              </h2>
              {challengeDetails.description && (
                <p className="text-slate-600 text-md">
                  {challengeDetails.description}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              className="p-3 border-2 border-purple-200 rounded-xl w-full sm:w-3/4 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-slate-50 text-slate-700"
              value={shareableLink}
              readOnly
            />
            <button
              onClick={handleCopyLink}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all w-full sm:w-auto flex items-center justify-center font-semibold shadow-md"
            >
              <LinkIcon className="w-5 h-5 mr-2 inline" />
              {isCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>
          <button
            onClick={() => router.push("/dashboard/challenge")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all w-full mt-6 font-semibold shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
        <p className="text-center mt-10 text-2xl font-bold text-slate-800 drop-shadow-md">
          Let’s Expand the Fun!!
        </p>
      </div>
    </div>
  );
}