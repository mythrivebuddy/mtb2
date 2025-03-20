"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";

interface BusinessProfile {
  name: string;
  businessInfo?: string;
  missionStatement?: string;
  goals?: string;
  keyOfferings?: string;
  achievements?: string;
  email?: string;
  phone?: string;
  website?: string;
  socialHandles?: string; // Expecting JSON string format
  isSpotlight?: boolean;
  spotlightExpiry?: string;
}

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessProfile>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch profile data once the user is available
  useEffect(() => {
    if (userId) {
      setLoading(true);
      axios
        .get(`/api/profile//${userId}`)
        .then((response) => {
          // Populate form with fetched data if available
          reset(response.data.profile);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
          setLoading(false);
        });
    }
  }, [userId, reset]);

  const onSubmit: SubmitHandler<BusinessProfile> = async (data) => {
    try {
      setLoading(true);
      await axios.put(`/api/user-business-profile/${userId}`, data);
      setMessage("Profile updated successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="p-6">Loading session...</div>;
  }

  if (!session) {
    return <div className="p-6">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Business Profile</h1>
      {loading && <p className="mb-4 text-blue-600">Loading...</p>}
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <section className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
          <div className="mb-4">
            <label className="block font-medium mb-1" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name", { required: "Name is required" })}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.name && (
              <p className="text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
        </section>

        {/* Business Information */}
        <section className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Business Information</h2>
          <div className="mb-4">
            <label className="block font-medium mb-1" htmlFor="businessInfo">
              Business Information
            </label>
            <textarea
              id="businessInfo"
              {...register("businessInfo")}
              placeholder="Describe your business..."
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
            />
          </div>
        </section>

        {/* Mission & Goals */}
        <section className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Mission & Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block font-medium mb-1"
                htmlFor="missionStatement"
              >
                Mission Statement
              </label>
              <textarea
                id="missionStatement"
                {...register("missionStatement")}
                placeholder="Your mission statement..."
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="goals">
                Goals
              </label>
              <textarea
                id="goals"
                {...register("goals")}
                placeholder="Your goals..."
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Achievements & Offerings */}
        <section className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">
            Achievements & Offerings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1" htmlFor="keyOfferings">
                Key Offerings
              </label>
              <textarea
                id="keyOfferings"
                {...register("keyOfferings")}
                placeholder="What do you offer?"
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="achievements">
                Achievements
              </label>
              <textarea
                id="achievements"
                {...register("achievements")}
                placeholder="Your achievements..."
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Contact Details */}
        <section className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="your@example.com"
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                type="text"
                {...register("phone")}
                placeholder="+1234567890"
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://yourwebsite.com"
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block font-medium mb-1" htmlFor="socialHandles">
              Social Handles (JSON format)
            </label>
            <textarea
              id="socialHandles"
              {...register("socialHandles")}
              placeholder='e.g., {"instagram": "yourhandle", "linkedin": "yourhandle"}'
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={2}
            />
          </div>
        </section>

        {/* Spotlight Information */}
        <section className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Spotlight Information</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isSpotlight")}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="font-medium">Feature in Spotlight</span>
            </label>
            <div className="w-full md:w-auto">
              <label
                className="block font-medium mb-1"
                htmlFor="spotlightExpiry"
              >
                Spotlight Expiry
              </label>
              <input
                id="spotlightExpiry"
                type="datetime-local"
                {...register("spotlightExpiry")}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
