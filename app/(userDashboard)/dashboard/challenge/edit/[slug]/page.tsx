"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

// Define the shape of the challenge data we expect from the API
type ChallengeData = {
  title: string;
  description: string;
  reward: number;
  penalty: number | null;
  startDate: string;
  endDate: string;
  mode: "PUBLIC" | "PERSONAL";
};

// --- API Functions ---

// 1. Fetches the current data for a single challenge to pre-fill the form.
const fetchChallengeDetails = async (slug: string): Promise<ChallengeData> => {
  const { data } = await axios.get(`/api/challenge/my-challenge/${slug}`);
  // Format dates for the datetime-local input fields
  data.startDate = new Date(data.startDate).toISOString().slice(0, 16);
  data.endDate = new Date(data.endDate).toISOString().slice(0, 16);
  return data;
};

// 2. Sends the updated data to the server using a PATCH request.
const updateChallenge = async ({
  slug,
  data,
}: {
  slug: string;
  data: ChallengeData;
}) => {
  const response = await axios.patch(
    `/api/challenge/my-challenge/${slug}`,
    data
  );
  return response.data;
};

// --- The Edit Challenge Page Component ---

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  // State to manage the form inputs
  const [formData, setFormData] = useState<ChallengeData | null>(null);

  // Fetch the existing challenge data using React Query
  const { data: initialData, isLoading: isLoadingData, isError, error,
  } = useQuery({
    queryKey: ["challengeDetails", slug],
    queryFn: () => fetchChallengeDetails(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false,
  });

  // Use a mutation for handling the update process
  const updateMutation = useMutation({
    mutationFn: updateChallenge,
    onSuccess: () => {
      toast.success("Challenge Updated!", {
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["myChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["challengeDetails", slug] });
      router.push("/dashboard/challenge/my-challenges");
    },
    onError: (err) => {
      const apiError = err as { response?: { data?: { error?: string } } };
      toast.error("Update Failed", {
        description:
          apiError?.response?.data?.error ||
          "An error occurred. Please try again.",
      });
    },
  });

  // When the initial data is fetched, populate the form state
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handler for form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({
        ...formData,
        [name]:
          name === "reward" || name === "penalty" ? Number(value) : value,
      });
    }
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData && slug) {
      // ✨ FIX for 404 ERROR: Pass the original 'slug' from the URL separately
      // to ensure the correct endpoint is always called.
      updateMutation.mutate({ slug, data: formData });
    }
  };

  // --- Render Logic ---

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 bg-red-50 text-red-600 rounded-lg">
        <p>Failed to load challenge data.</p>
        <p className="text-sm">{error?.message}</p>
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
            <span>Back to My Challenges</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Edit Challenge
          </h1>
          <p className="text-slate-500 mb-8">
            Make changes to your challenge details below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form inputs remain the same */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="reward" className="block text-sm font-medium text-slate-700 mb-1">
                  Reward (JP)
                </label>
                <input
                  type="number"
                  id="reward"
                  name="reward"
                  value={formData.reward}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label htmlFor="penalty" className="block text-sm font-medium text-slate-700 mb-1">
                  Penalty (JP, optional)
                </label>
                <input
                  type="number"
                  id="penalty"
                  name="penalty"
                  value={formData.penalty ?? ""}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-slate-700 mb-1">
                Mode
              </label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg bg-white"
              >
                <option value="PUBLIC">Public</option>
                <option value="PERSONAL">Personal</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all disabled:bg-slate-400"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
