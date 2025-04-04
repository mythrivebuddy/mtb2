import React from "react";
import Image from "next/image";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { BusinessProfile } from "@/app/profile/page";

interface ProfileEditProps {
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  register: UseFormRegister<BusinessProfile>;
  errors: FieldErrors<BusinessProfile>;
  commonClassName: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({
  onCancel,
  onSubmit,
  register,
  errors,
  commonClassName,
  handleFileChange,
  imagePreview,
}) => (
  <form onSubmit={onSubmit}>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Edit Business Profile
      </h1>
      <div className="space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
        >
          Save Changes
        </button>
      </div>
    </div>
    <div className="space-y-6">
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
        <div className="mb-4">
          <label htmlFor="name" className="block font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name", { required: "Business name is required" })}
            className={commonClassName}
          />
          {errors.name && (
            <p className="text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="businessInfo" className="block font-medium mb-1">
            Business Information
          </label>
          <textarea
            id="businessInfo"
            {...register("businessInfo")}
            className={commonClassName}
            rows={3}
          />
        </div>
      </div>
      {/* Rest of the component remains the same... */}
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Mission & Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="missionStatement"
              className="block font-medium mb-1"
            >
              Mission Statement
            </label>
            <textarea
              id="missionStatement"
              {...register("missionStatement")}
              className={commonClassName}
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="goals" className="block font-medium mb-1">
              Goals
            </label>
            <textarea
              id="goals"
              {...register("goals")}
              className={commonClassName}
              rows={3}
            />
          </div>
        </div>
      </div>
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">
          Achievements & Offerings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="keyOfferings" className="block font-medium mb-1">
              Key Offerings
            </label>
            <textarea
              id="keyOfferings"
              {...register("keyOfferings")}
              className={commonClassName}
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="achievements" className="block font-medium mb-1">
              Achievements
            </label>
            <textarea
              id="achievements"
              {...register("achievements")}
              className={commonClassName}
              rows={3}
            />
          </div>
        </div>
      </div>
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Contact Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="email" className="block font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className={commonClassName}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block font-medium mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="text"
              {...register("phone")}
              className={commonClassName}
            />
          </div>
          <div>
            <label htmlFor="website" className="block font-medium mb-1">
              Website
            </label>
            <input
              id="website"
              type="url"
              {...register("website")}
              className={commonClassName}
            />
          </div>
        </div>
      </div>
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Social Handles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="socialHandles.linkedin"
              className="block font-medium mb-1"
            >
              LinkedIn
            </label>
            <input
              id="socialHandles.linkedin"
              type="text"
              {...register("socialHandles.linkedin")}
              className={commonClassName}
            />
          </div>
          <div>
            <label
              htmlFor="socialHandles.instagram"
              className="block font-medium mb-1"
            >
              Instagram
            </label>
            <input
              id="socialHandles.instagram"
              type="text"
              {...register("socialHandles.instagram")}
              className={commonClassName}
            />
          </div>
          <div>
            <label
              htmlFor="socialHandles.twitter"
              className="block font-medium mb-1"
            >
              Twitter
            </label>
            <input
              id="socialHandles.twitter"
              type="text"
              {...register("socialHandles.twitter")}
              className={commonClassName}
            />
          </div>
          <div>
            <label
              htmlFor="socialHandles.github"
              className="block font-medium mb-1"
            >
              GitHub
            </label>
            <input
              id="socialHandles.github"
              type="text"
              {...register("socialHandles.github")}
              className={commonClassName}
            />
          </div>
        </div>
      </div>
      <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Spotlight Information</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="featuredWorkTitle"
              className="block font-medium mb-1"
            >
              Featured Work Title
            </label>
            <input
              id="featuredWorkTitle"
              type="text"
              {...register("featuredWorkTitle", {
                required: "Work title is required",
              })}
              className={commonClassName}
            />
            {errors.featuredWorkTitle && (
              <p className="text-red-500 mt-1">
                {errors.featuredWorkTitle.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="featuredWorkDesc"
              className="block font-medium mb-1"
            >
              Featured Work Description
            </label>
            <textarea
              id="featuredWorkDesc"
              {...register("featuredWorkDesc", {
                required: "Work description is required",
              })}
              className={commonClassName}
              rows={3}
            />
            {errors.featuredWorkDesc && (
              <p className="text-red-500 mt-1">
                {errors.featuredWorkDesc.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="featuredWorkImage"
              className="block font-medium mb-1"
            >
              Featured Work Image
            </label>
            <input
              id="featuredWorkImage"
              type="file"
              onChange={handleFileChange}
              className={commonClassName}
              accept="image/*"
            />
            {imagePreview && (
              <div className="mt-2">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="priorityContactLink"
              className="block font-medium mb-1"
            >
              Priority Contact Link
            </label>
            <input
              id="priorityContactLink"
              type="url"
              {...register("priorityContactLink", {
                required: "Work contact link is required",
              })}
              className={commonClassName}
            />
            {errors.priorityContactLink && (
              <p className="text-red-500 mt-1">
                {errors.priorityContactLink.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </form>
);

export default ProfileEdit;
