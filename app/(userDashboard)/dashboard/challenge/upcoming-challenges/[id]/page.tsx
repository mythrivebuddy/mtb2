import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { notFound } from "next/navigation";
import ChallengeDetailView from "../ChallengeDetailView";
import type { ChallengeEnrollment, UserChallengeTask } from "@prisma/client";

// Reusable type for enrollment object
export type EnrollmentWithTasks = ChallengeEnrollment & {
  userTasks: UserChallengeTask[];
};

// Data fetching function
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

// Define the props interface for type safety
interface PageProps {
  params: { id: string };
}

// Use the new signature for the page component
export default async function ChallengeDetailPage({ params }: PageProps) {
  // Safely get the id from the destructured params
  const { id } = params;

  // Get the session safely without causing an error for visitors
  const session = await getServerSession(authConfig);
  const userId = session?.user?.id;

  // Fetch data using the id and optional userId
  const data = await getChallengeData(id, userId);

  if (!data) {
    notFound();
  }

  const { challenge, enrollment } = data;

  return (
    <ChallengeDetailView
      challenge={challenge}
      initialEnrollment={enrollment}
    />
  );
}