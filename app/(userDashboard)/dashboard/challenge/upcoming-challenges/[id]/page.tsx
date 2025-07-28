// app/(userDashboard)/dashboard/challenge/upcoming-challenges/[id]/page.tsx

import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config"; // IMPORTANT: You must import your NextAuth config
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChallengeDetailView from "../ChallengeDetailView";
import type { ChallengeEnrollment, UserChallengeTask } from "@prisma/client";

// Define a reusable type for the enrollment object with its tasks
export type EnrollmentWithTasks = ChallengeEnrollment & {
  userTasks: UserChallengeTask[];
};

// This data fetching function is already correct and needs no changes.
// It handles an optional userId gracefully.
async function getChallengeData(challengeId: string, userId?: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      templateTasks: true,
      _count: {
        select: { enrollments: true },
      },
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

  // --- CHANGE 1: Use getServerSession instead of checkRole ---
  // This will get the session if it exists, but will return null if the user
  // is not logged in, instead of throwing an error.
  const session = await getServerSession(authConfig);

  // --- CHANGE 2: Get the userId optionally ---
  // Use optional chaining (?.) to safely get the user ID.
  // If session is null, userId will be undefined.
  const userId = session?.user?.id;

  // Fetch the data. userId will be either the user's ID or undefined.
  const data = await getChallengeData(id, userId);

  if (!data) {
    notFound();
  }

  const { challenge, enrollment } = data;

  // Pass the data to the view.
  // For logged-out users, enrollment will correctly be null.
  return (
    <ChallengeDetailView
      challenge={challenge}
      initialEnrollment={enrollment}
    />
  );
}