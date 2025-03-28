"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import Layout from "@/components/layout/Layout";
import { Loader2 } from "lucide-react";
import CompletionBar from "@/components/userBusinessProfile/CompletionBar";
import ProfileDisplay from "@/components/userBusinessProfile/ProfileDisplay";
import ProfileEdit from "@/components/userBusinessProfile/ProfileEdit";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SocialHandles {
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  github?: string;
}

export interface BusinessProfile {
  name: string;
  businessInfo?: string;
  missionStatement?: string;
  goals?: string;
  keyOfferings?: string;
  achievements?: string;
  email?: string;
  phone?: string;
  website?: string;
  socialHandles?: SocialHandles;
  featuredWorkTitle?: string;
  featuredWorkDesc?: string;
  featuredWorkImage?: string;
  priorityContactLink?: string;
  completionPercentage?: number;
}

const Page = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch profile data with useQuery
  const { data: profile, isLoading: queryLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () =>
      axios
        .get(`/api/user/profile/getProfile?userId=${userId}`)
        .then((res) => res.data.profile),
    enabled: !!userId, // Only fetch when userId is available
  });

  // Update profile data with useMutation
  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      axios.put(`/api/user/profile/updateProfile?userId=${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] }); // Refetch profile data
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setSelectedFile(null); // Clear selected file after submission
    },
    onError: () => {
      toast.error("Error updating profile. Please try again.");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessProfile>({
    defaultValues: {
      name: "",
      businessInfo: "",
      missionStatement: "",
      goals: "",
      keyOfferings: "",
      achievements: "",
      email: "",
      phone: "",
      website: "",
      socialHandles: {
        linkedin: "",
        instagram: "",
        twitter: "",
        github: "",
      },
      featuredWorkTitle: "",
      featuredWorkDesc: "",
      featuredWorkImage: "",
      priorityContactLink: "",
    },
  });

  const commonClassName =
    "w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80";

  // Reset form with fetched profile data
  useEffect(() => {
    if (profile) {
      reset({
        ...profile,
        socialHandles: profile.socialHandles || {
          linkedin: "",
          instagram: "",
          twitter: "",
          github: "",
        },
      });
      setImagePreview(profile.featuredWorkImage || null);
    }
  }, [profile, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<BusinessProfile> = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "socialHandles") {
        formData.append(key, JSON.stringify(value || {}));
      } else if (
        key !== "featuredWorkImage" &&
        value !== undefined &&
        value !== null
      ) {
        formData.append(key, value.toString());
      }
    });
    if (selectedFile) {
      formData.append("featuredWorkImage", selectedFile, selectedFile.name);
    }
    mutation.mutate(formData);
  };

  const loading = queryLoading || mutation.isPending;

  if (status === "loading") {
    return (
      <div className="p-6 flex justify-center items-center">
        <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <Layout>Please log in to view your profile.</Layout>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Business Profile
        </h1>
        <CompletionBar percentage={profile?.completionPercentage ?? 0} />
        {loading && (
          <div className="mb-4 flex justify-center items-center">
            <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
          </div>
        )}
        {!isEditing ? (
          <ProfileDisplay
            profileData={profile}
            onEditClick={() => setIsEditing(true)}
          />
        ) : (
          <ProfileEdit
            onCancel={() => setIsEditing(false)}
            onSubmit={handleSubmit(onSubmit)}
            register={register}
            errors={errors}
            commonClassName={commonClassName}
            handleFileChange={handleFileChange}
            imagePreview={imagePreview}
          />
        )}
      </div>
    </Layout>
  );
};

export default Page;
