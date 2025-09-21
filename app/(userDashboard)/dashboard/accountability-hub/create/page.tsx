// app/(userDashboard)/dashboard/accountability-hub/create/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Radio Input component for cleaner code
interface RadioInputProps {
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioInput = ({ id, name, value, label, checked, onChange }: RadioInputProps) => (
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
    <label htmlFor={id} className="ml-3 block text-sm font-medium text-gray-700">
      {label}
    </label>
  </div>
);

export default function CreateGroupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    groupName: "",
    description: "",
    visibility: "members_visible",
    duration: "monthly",
    stages: "3_stage",
    notesPrivacy: "member_and_admin",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted Data:", formData);
    alert("Group created successfully! (Check console for data)");
    // Yahan par aap router.push('/dashboard/accountability-hub') se wapas ja sakte hain
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Group</h1>
        <p className="text-gray-600 mb-8">Fill in the details below to start a new accountability group.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              name="groupName"
              id="groupName"
              value={formData.groupName}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Q4 Marketing Goals"
              required
            />
          </div>

          {/* Group Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Group Description</label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Describe the main objective of this group."
            ></textarea>
          </div>

          {/* Radio Button Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Visibility of Goals</legend>
              <div className="mt-2 space-y-2">
                <RadioInput id="vis_members" name="visibility" value="members_visible" label="Members can see each other's goals" checked={formData.visibility === 'members_visible'} onChange={handleChange} />
                <RadioInput id="vis_admin" name="visibility" value="admin_only" label="Only admins can see member goals" checked={formData.visibility === 'admin_only'} onChange={handleChange} />
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Cycle Duration</legend>
              <div className="mt-2 space-y-2">
                <RadioInput id="dur_monthly" name="duration" value="monthly" label="Monthly" checked={formData.duration === 'monthly'} onChange={handleChange} />
               </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Progress Stages</legend>
              <div className="mt-2 space-y-2">
                <RadioInput id="stage_2" name="stages" value="2_stage" label="Goal → End" checked={formData.stages === '2_stage'} onChange={handleChange} />
                <RadioInput id="stage_3" name="stages" value="3_stage" label="Goal → Midway → End" checked={formData.stages === '3_stage'} onChange={handleChange} />
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Notes Privacy</legend>
              <div className="mt-2 space-y-2">
                <RadioInput id="notes_member_admin" name="notesPrivacy" value="member_and_admin" label="Members and Admins" checked={formData.notesPrivacy === 'member_and_admin'} onChange={handleChange} />
                <RadioInput id="notes_admin_only" name="notesPrivacy" value="admin_only" label="Admins Only" checked={formData.notesPrivacy === 'admin_only'} onChange={handleChange} />
              </div>
            </fieldset>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link href="/dashboard/accountability-hub">
              <button
                type="button"
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
             </Link>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}