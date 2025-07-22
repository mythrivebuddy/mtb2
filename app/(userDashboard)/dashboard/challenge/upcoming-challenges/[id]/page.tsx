import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { notFound } from "next/navigation";
import ChallengeDetailView from "../ChallengeDetailView"; // Assuming the view is a sibling file
import type { ChallengeEnrollment, UserChallengeTask } from "@prisma/client";

// Define a reusable type for the enrollment object with its tasks
export type EnrollmentWithTasks = ChallengeEnrollment & {
  userTasks: UserChallengeTask[];
};

// Updated data fetching function
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
    // Fetch the full enrollment object, including the user's personal tasks
    enrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: userId,
          challengeId: challengeId,
        },
      },
      include: {
        userTasks: true, // This is the key change to get the processing status
      },
    });
  }

  return { challenge, enrollment };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function ChallengeDetailPage(props: any) {
  const id = props.params.id;
  const session = await checkRole("USER");
  const userId = session?.user?.id;

  const data = await getChallengeData(id, userId);

  if (!data) {
    notFound();
  }

  const { challenge, enrollment } = data;

  return (
    <ChallengeDetailView
      challenge={challenge}
      initialEnrollment={enrollment} // Pass the full enrollment object to the client
    />
  );
}