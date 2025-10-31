"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function SendNudgePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"push" | "email">("push");
  const router = useRouter();
  const memberId = searchParams.get("memberId");
  const memberName = searchParams.get("memberName") || "Member";
  const groupId = searchParams.get("groupId");
  const memberToNudge = { id: memberId || "", name: memberName };
  // --- Push Notification Form ---
  const [pushTitle, setPushTitle] = useState(
    "Friendly Reminder from Your Accountability Hub"
  );
  const [pushDescription, setPushDescription] = useState(
    `Hey ${memberToNudge.name}, just a friendly reminder to update your goal progress!`
  );

  // --- Email Form ---
  const [emailSubject, setEmailSubject] = useState(
    "Accountability Hub: A Nudge for Your Goal"
  );
  const [emailBody, setEmailBody] = useState(
    `Hi ${memberToNudge.name},\n\nThis is a friendly reminder to check in on your accountability hub and update the progress for your goal.\n\nKeep up the great work!`
  );

  // --- React Query Mutation: Push Notification ---
  const pushMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `/api/accountability-hub/members/${memberToNudge.id}/nudge`,
        {
          groupId,
          pushNotificationSent: true,
          title: pushTitle,
          description: pushDescription,
          url: "/dashboard", // optional redirect URL for notification
        }
      );
      if (!res.data.success)
        throw new Error("Failed to send push notification");
        return res.data;
    },
    onSuccess: () => {
      toast.success("Push notification sent successfully!");
      router.back();
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || "Failed to send push notification");
    },
  });

  // --- React Query Mutation: Email ---
  const emailMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/accountability-hub/members/${memberToNudge.id}/nudge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId,
            pushNotificationSent: false,
            sendEmail: true,
            subject: emailSubject,
            emailContent: emailBody,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to send email");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Email sent successfully!");
      router.back();
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || "Failed to send email");
    },
  });

  // --- Handlers ---
  const handlePushSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushMutation.mutate();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emailMutation.mutate();
  };

  // --- Tailwind Classes ---
  const inputStyle =
    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const getTabStyle = (tabName: "push" | "email") => {
    const isActive = activeTab === tabName;
    return `py-4 px-1 font-semibold ${
      isActive
        ? "border-b-2 border-blue-600 text-blue-700"
        : "text-gray-500 hover:text-gray-700"
    }`;
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Send Nudge</h2>
            <p className="text-gray-500 text-sm">
              Sending a nudge to:{" "}
              <span className="font-medium text-blue-600">
                {memberToNudge.name}
              </span>
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 px-6">
              <button
                type="button"
                onClick={() => setActiveTab("push")}
                className={getTabStyle("push")}
              >
                Push Notification
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className={getTabStyle("email")}
              >
                Send Email
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {/* Push Notification Form */}
            {activeTab === "push" && (
              <form onSubmit={handlePushSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="push-title" className={labelStyle}>
                      Title
                    </label>
                    <input
                      type="text"
                      id="push-title"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      className={inputStyle}
                      placeholder="e.g. Friendly Reminder!"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="push-desc" className={labelStyle}>
                      Description
                    </label>
                    <textarea
                      id="push-desc"
                      rows={4}
                      value={pushDescription}
                      onChange={(e) => setPushDescription(e.target.value)}
                      className={inputStyle}
                      placeholder={`Hey ${memberToNudge.name}, just a quick nudge...`}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-start items-center p-4 bg-gray-50 border-t border-gray-200 space-x-3">
                  <button
                    type="submit"
                    disabled={pushMutation.isPending}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pushMutation.isPending
                      ? "Sending..."
                      : "Send Push Notification"}
                  </button>
                </div>
              </form>
            )}

            {/* Email Form */}
            {activeTab === "email" && (
              <form onSubmit={handleEmailSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="email-subject" className={labelStyle}>
                      Subject
                    </label>
                    <input
                      type="text"
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email-body" className={labelStyle}>
                      Body
                    </label>
                    <textarea
                      id="email-body"
                      rows={8}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-start items-center p-4 bg-gray-50 border-t border-gray-200 space-x-3">
                  <button
                    type="submit"
                    disabled={emailMutation.isPending}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {emailMutation.isPending ? "Sending..." : "Send Email"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
