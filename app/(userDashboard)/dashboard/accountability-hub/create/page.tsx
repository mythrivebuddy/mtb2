"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import {toast} from "sonner"

interface RadioInputProps {
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioInput = ({
  id,
  name,
  value,
  label,
  checked,
  onChange,
}: RadioInputProps) => (
  <div className="flex items-center">
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
    />
    <label
      htmlFor={id}
      className="ml-3 block text-sm font-medium text-gray-700"
    >
      {label}
    </label>
  </div>
);

type FormState = {
  groupName: string;
  description: string;
  visibility: "PUBLIC" | "PRIVATE" | "MEMBERS_CAN_SEE_GOALS";
  duration: "MONTHLY";
  stages: "STAGE_2" | "STAGE_3";
  notesPrivacy: "PRIVATE_TO_AUTHOR" | "VISIBLE_TO_GROUP";
};

export default function CreateGroupPage() {
  const router = useRouter();
  // const { toast } = useToast();
  
  const sp = useSearchParams();

  const groupId = sp.get("groupId");
  const isEditMode = Boolean(groupId);

  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const [formData, setFormData] = useState<FormState>({
    groupName: "",
    description: "",
    visibility: "MEMBERS_CAN_SEE_GOALS",
    duration: "MONTHLY",
    stages: "STAGE_3",
    notesPrivacy: "VISIBLE_TO_GROUP",
  });

  // ✅ Load existing group in edit mode
  useEffect(() => {
    if (!isEditMode) {
      setInitialLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get(
          `/api/accountability-hub/groups/${groupId}/view`
        );
        const g = res.data.group;

        setFormData({
          groupName: g.name ?? "",
          description: g.description ?? "",
          visibility: g.visibility,
          duration: g.cycleDuration ?? "MONTHLY",
          stages: g.progressStage ?? "STAGE_3",
          notesPrivacy: g.notesPrivacy,
        });
      } catch (err: unknown) {
        console.log(err);
        toast.success("Failed to load group details.");
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, [groupId, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ CREATE API integrated
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isEditMode) {
        // ✅ Create group
        const res = await axios.post(
          "/api/accountability-hub/groups",
          formData
        );

        toast.success(res?.data?.message);
        router.push(`/dashboard/accountability?groupId=${res.data.id}`);
      } else {
        // ✅ Edit group (PATCH API)
        const res = await axios.patch(
          `/api/accountability-hub/groups/${groupId}/edit`,
          formData
        );
        toast.success(res?.data?.message);

        router.push(`/dashboard/accountability?groupId=${groupId}`);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Axios error - safe to access response
        toast.error(error.response?.data?.error || "Something went wrong.");
      } else if (error instanceof Error) {
        // Generic JS Error
        toast.error(error.message || "Something went wrong.");
      } else {
        // Unknown non-error thrown
        toast.error("Something went wrong.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-6 text-center text-lg">Loading group...</div>;
  }

  return (
    <section className="mx-auto max-w-4xl py-8 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditMode ? "Edit Group" : "Create New Group"}
        </h1>
        <p className="text-gray-600 mb-8">
          {isEditMode
            ? "Update the group details."
            : "Fill in the details below to create a new accountability group."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Q4 Marketing Goals"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe the main objective of this group."
              disabled={isLoading}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4">
            {/* Visibility */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                Visibility of Goals
              </legend>
              <div className="mt-2 space-y-2">
                <RadioInput
                  id="vis_members"
                  name="visibility"
                  value="MEMBERS_CAN_SEE_GOALS"
                  label="Members can see each other's goals"
                  checked={formData.visibility === "MEMBERS_CAN_SEE_GOALS"}
                  onChange={handleChange}
                />
                <RadioInput
                  id="vis_admin"
                  name="visibility"
                  value="PRIVATE"
                  label="Only admins can see member goals"
                  checked={formData.visibility === "PRIVATE"}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            {/* Cycle Duration */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                Cycle Duration
              </legend>
              <div className="mt-2 space-y-2">
                <RadioInput
                  id="dur_monthly"
                  name="duration"
                  value="MONTHLY"
                  label="Monthly"
                  checked={formData.duration === "MONTHLY"}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            {/* Progress Stages */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                Progress Stages
              </legend>
              <div className="mt-2 space-y-2">
                <RadioInput
                  id="s2"
                  name="stages"
                  value="STAGE_2"
                  label="Goal → End"
                  checked={formData.stages === "STAGE_2"}
                  onChange={handleChange}
                />
                <RadioInput
                  id="s3"
                  name="stages"
                  value="STAGE_3"
                  label="Goal → Midway → End"
                  checked={formData.stages === "STAGE_3"}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            {/* Notes Privacy */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                Notes Privacy
              </legend>
              <div className="mt-2 space-y-2">
                <RadioInput
                  id="np_visible"
                  name="notesPrivacy"
                  value="VISIBLE_TO_GROUP"
                  label="Members and Admins"
                  checked={formData.notesPrivacy === "VISIBLE_TO_GROUP"}
                  onChange={handleChange}
                />
                <RadioInput
                  id="np_private"
                  name="notesPrivacy"
                  value="PRIVATE_TO_AUTHOR"
                  label="Admins Only"
                  checked={formData.notesPrivacy === "PRIVATE_TO_AUTHOR"}
                  onChange={handleChange}
                />
              </div>
            </fieldset>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link href="/dashboard/accountability">
              <button
                type="button"
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancel
              </button>
            </Link>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isEditMode
                ? isLoading
                  ? "Updating..."
                  : "Update Group"
                : isLoading
                  ? "Creating..."
                  : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
