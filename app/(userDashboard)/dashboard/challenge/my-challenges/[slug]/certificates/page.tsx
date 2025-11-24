/* eslint-disable react/no-unescaped-entities */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";



interface ChallengeHistory {
  date: string;
  status: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  completedDays: number;
}

interface ParticipantEntry {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  lastActiveDate:string
}

interface APIResponse {
  id: string;
  title: string;  
  startDate: string;
  endDate: string;
  dailyTasks: any[];
  leaderboard: LeaderboardEntry[];
  history: ChallengeHistory[];
  participants: ParticipantEntry[];
}

interface BuiltParticipant {
  id: string;
  name: string;
  completionPercentage: number;
  joinedDate: string;
  lastActiveDate: string;
}


import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function CertificatesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] =
    useState<"eligible" | "not" | "issued">("eligible");

  const { data, isLoading, error } = useQuery<APIResponse>({
    queryKey: ["certificateDetails", slug],
    queryFn: async () => {
      const response = await axios.get(`/api/challenge/my-challenge/${slug}`);
      return response.data;
    },
  });

  if (isLoading)
    return <div className="p-4">Loading certificates...</div>;

  if (error || !data)
    return (
      <div className="p-4 text-red-500">
        Failed to load certificate data.
      </div>
    );

  const challenge = data;

  // ======================================================
  // CALCULATE TOTAL CHALLENGE DAYS (END - START + 1)
  // ======================================================
  const totalChallengeDays =
    Math.floor(
      (new Date(challenge.endDate).getTime() -
        new Date(challenge.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // ======================================================
  // MAP PARTICIPANTS WITH CORRECT COMPLETION FORMULA
  // ======================================================
 const participants: BuiltParticipant[] =
  challenge.participants.map((p: ParticipantEntry & { lastActiveDate: string }) => {
    const lb = challenge.leaderboard.find(
      (l: LeaderboardEntry) => l.id === p.id
    );

    const completedDays = lb ? lb.completedDays : 0;

    const completionPercentage = Math.round(
      (completedDays / totalChallengeDays) * 100
    );

    return {
      id: p.id,
      name: p.name,
      completionPercentage,
      joinedDate: p.joinedAt,
      lastActiveDate: p.lastActiveDate,  // FIXED
    };
  });

  // ======================================================
  // FILTER ELIGIBILITY
  // ======================================================
  const eligible = participants.filter(
    (p: BuiltParticipant) => p.completionPercentage >= 75
  );

  const notEligible = participants.filter(
    (p: BuiltParticipant) => p.completionPercentage < 75
  );

  // FIXED: Placeholder issued list MUST MATCH BuiltParticipant TYPE
  const issued: BuiltParticipant[] = [];

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ======================================================
  //   RENDER TABLE (STRICTLY TYPED)
  // ======================================================
  const renderTable = (
    list: BuiltParticipant[],
    type: "eligible" | "not" | "issued"
  ) => {
    if (list.length === 0)
      return (
        <p className="text-gray-500 text-center py-6">
          {type === "issued"
            ? "No certificates issued yet."
            : type === "eligible"
            ? "No eligible participants yet."
            : "No ineligible participants."}
        </p>
      );

    return (
      <div className="overflow-x-auto w-full border rounded-lg">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {list.map((u: BuiltParticipant) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold">{u.name}</TableCell>

                <TableCell>{u.completionPercentage}%</TableCell>

                <TableCell>{formatDate(u.joinedDate)}</TableCell>

                <TableCell>{formatDate(u.lastActiveDate)}</TableCell>

                <TableCell className="text-right">
                  {type === "eligible" && (
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Issue
                    </button>
                  )}

                  {type === "not" && (
                    <span className="text-gray-400 text-sm">
                      Not eligible
                    </span>
                  )}

                  {type === "issued" && (
                    <span className="text-green-600 font-semibold">
                      Issued
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl font-bold">Certificate Management</h1>

        <button
          onClick={() =>
            router.push(`/dashboard/challenge/my-challenges/${slug}`)
          }
          className="px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
        >
          Back
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("eligible")}
          className={`pb-2 font-semibold whitespace-nowrap ${
            activeTab === "eligible"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500"
          }`}
        >
          Eligible
        </button>

        <button
          onClick={() => setActiveTab("not")}
          className={`pb-2 font-semibold whitespace-nowrap ${
            activeTab === "not"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500"
          }`}
        >
          Not Eligible
        </button>

        <button
          onClick={() => setActiveTab("issued")}
          className={`pb-2 font-semibold whitespace-nowrap ${
            activeTab === "issued"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500"
          }`}
        >
          Issued
        </button>
      </div>

      {/* ELIGIBLE */}
      {activeTab === "eligible" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Eligible Participants</h2>
          {renderTable(eligible, "eligible")}
        </div>
      )}

      {/* NOT ELIGIBLE */}
      {activeTab === "not" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Not Eligible</h2>
          {renderTable(notEligible, "not")}
        </div>
      )}

      {/* ISSUED */}
      {activeTab === "issued" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Issued Certificates</h2>
          {renderTable(issued, "issued")}
        </div>
      )}
    </div>
  );
}