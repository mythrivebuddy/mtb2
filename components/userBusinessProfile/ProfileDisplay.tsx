import React from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Music,
  XIcon,
  Youtube,
} from "lucide-react";
import Image from "next/image";

interface SocialHandles {
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
}

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
  socialHandles?: SocialHandles;
  featuredWorkTitle?: string;
  featuredWorkDesc?: string;
  featuredWorkImage?: string;
  priorityContactLink?: string;
}

interface ProfileDisplayProps {
  profileData: BusinessProfile | null;
  onEditClick: () => void;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  profileData,
  onEditClick,
}) => (
  <div className="space-y-6">
    <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
      <div className="w-full flex justify-between">
        <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 bg-[#1E2875] text-white rounded-lg hover:bg-blue-600"
        >
          Edit Profile
        </button>
      </div>

      <p>
        <strong>Name:</strong> {profileData?.name || "Not provided"}
      </p>
      <p>
        <strong>Business Info:</strong>{" "}
        {profileData?.businessInfo || "Not provided"}
      </p>
    </div>
    <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Mission & Goals</h2>
      <p>
        <strong>Mission Statement:</strong>{" "}
        {profileData?.missionStatement || "Not provided"}
      </p>
      <p>
        <strong>Goals:</strong> {profileData?.goals || "Not provided"}
      </p>
    </div>
    <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Achievements & Offerings</h2>
      <p>
        <strong>Key Offerings:</strong>{" "}
        {profileData?.keyOfferings || "Not provided"}
      </p>
      <p>
        <strong>Achievements:</strong>{" "}
        {profileData?.achievements || "Not provided"}
      </p>
    </div>
    <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Contact Details</h2>
      <p>
        <strong>Email:</strong> {profileData?.email || "Not provided"}
      </p>
      <p>
        <strong>Phone:</strong> {profileData?.phone || "Not provided"}
      </p>
      <p>
        <strong>Website:</strong> {profileData?.website || "Not provided"}
      </p>
    </div>
    <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Social Handles</h2>
      <div className="flex space-x-4">
        {profileData?.socialHandles?.linkedin && (
          <a
            href={profileData.socialHandles.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            <Linkedin className="w-6 h-6 text-blue-600" />
          </a>
        )}
        {profileData?.socialHandles?.instagram && (
          <a
            href={profileData.socialHandles.instagram}
            target="_blank"
            rel="noreferrer"
          >
            <Instagram className="w-6 h-6 text-pink-500" />
          </a>
        )}
        {profileData?.socialHandles?.twitter && (
          <a
            href={profileData.socialHandles.twitter}
            target="_blank"
            rel="noreferrer"
          >
            <XIcon className="w-6 h-6 text-black" />
          </a>
        )}
        {profileData?.socialHandles?.youtube && (
          <a
            href={profileData.socialHandles.youtube}
            target="_blank"
            rel="noreferrer"
          >
            <Youtube className="w-6 h-6 text-gray-800" />
          </a>
        )}
        {profileData?.socialHandles?.facebook && (
          <a
            href={profileData.socialHandles.facebook}
            target="_blank"
            rel="noreferrer"
          >
            <Facebook className="w-6 h-6 text-blue-600" />
          </a>
        )}
        {profileData?.socialHandles?.tiktok && (
          <a
            href={profileData.socialHandles.tiktok}
            target="_blank"
            rel="noreferrer"
          >
            <Music className="w-6 h-6 text-blue-600" />
          </a>
        )}
      </div>
    </div>
    <div className="bg-white/80 p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Spotlight Information</h2>
      <p>
        <strong>Title (You want to be displayed on Spotlight):</strong>{" "}
        {profileData?.featuredWorkTitle || "Not provided"}
      </p>
      <p>
        <strong>Description:</strong>{" "}
        {profileData?.featuredWorkDesc || "Not provided"}
      </p>
      {profileData?.featuredWorkImage && (
        <div>
          <strong>Image to be displayed in Spotlight:</strong>
          <Image
            src={profileData.featuredWorkImage}
            alt="Featured Work"
            width={200}
            height={200}
            className="mt-2 rounded-lg"
          />
        </div>
      )}
      <p>
        <strong>Contact Link (Where you like users to visit):</strong>{" "}
        {profileData?.priorityContactLink || "Not provided"}
      </p>
    </div>
  </div>
);

export default ProfileDisplay;
