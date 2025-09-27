// app/(userDashboard)/dashboard/challenge/upcoming-challenges/[id]/page.tsx

import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config"; // IMPORTANT: You must import your NextAuth config
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChallengeDetailView from "../ChallengeDetailView";
import type { ChallengeEnrollment, UserChallengeTask } from "@prisma/client";

export type EnrollmentWithTasks = ChallengeEnrollment & {
  userTasks: UserChallengeTask[];
};

// This data fetching function is already correct and needs no changes in logic.
// Updated to include the creator to fix the TypeScript error.
async function getChallengeData(challengeId: string, userId?: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      templateTasks: true,
      _count: {
        select: { enrollments: true },
      },
      creator: true, // Added to match Challenge With Tasks And Count type
    },
  });

  if (!challenge) {
    return null;
  }

  let enrollment: EnrollmentWithTasks | null = null;
  // This block only runs if a logged-in user's ID is provided
  if (userId) {
    enrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: userId,
          challengeId: challengeId,
        },
      },
      include: {
        userTasks: true,
      },
    });
  }

  return { challenge, enrollment };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function ChallengeDetailPage(props: any) {
  const id = props.params.id;

  // Use getServerSession instead of check Role to handle null sessions gracefully
  const session = await getServerSession(authConfig);

  // Get the userId optionally using optional chaining
  const userId = session?.user?.id;

  // Fetch the data with optional userId
  const data = await getChallengeData(id, userId);

  if (!data) {
    notFound();
  }

  const { challenge, enrollment } = data;

  // Pass the data to the view, preserving functionality for logged-out users (enrollment will be null)
  return (
    <ChallengeDetailView
      challenge={challenge}
      initialEnrollment={enrollment}
    />
  );
}