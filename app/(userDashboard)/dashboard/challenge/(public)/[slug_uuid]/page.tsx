// CRITICAL: This file MUST be named page.tsx

import { notFound } from "next/navigation";
import React from "react";
import { getServerSession } from "next-auth/next"; // Helper to get session on the server
import { prisma } from "@/lib/prisma"; // Your Prisma client instance
import ChallengeDetailClient from "./ChallengeDetailClient";
import { getChallengeData } from "./action";
import type { Metadata } from "next";
import { ChallengeDetailsForClient } from "@/types/client/challengeDetail";

type PageProps = {
  params: Promise<{ slug_uuid: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const challenge = await getChallengeData((await params).slug_uuid);
  if (!challenge) {
    return { title: "Challenge Not Found" };
  }
  return { title: challenge.title, description: challenge.description };
}

export default async function ChallengeDetailPage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const challengeData = await getChallengeData((await params).slug_uuid);

  if (!challengeData) {
    notFound();
  }

  // --- START: Added logic to check user enrollment ---
  const session = await getServerSession(); // Call without authOptions
  let isEnrolled = false;

  // If the user is logged in, check if they are enrolled in this challenge
  if (session?.user?.id && challengeData) {
    const enrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: session.user.id,
          challengeId: challengeData.id,
        },
      },
    });
    isEnrolled = !!enrollment; // Set to true if an enrollment record exists
  }
  // --- END: Added logic to check user enrollment ---

  // Convert Date objects to strings before passing to the client.
  const serializableChallenge: ChallengeDetailsForClient = {
    ...challengeData,
    startDate: challengeData.startDate.toISOString(),
    endDate: challengeData.endDate.toISOString(),
  };

  return (
    <ChallengeDetailClient
      challenge={serializableChallenge}
      initialIsEnrolled={isEnrolled} // <-- Pass the enrollment status to the client
    />
  );
}
