import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { notFound } from "next/navigation";
import ChallengeDetailView from "./ChallengeDetailView"; // The Client Component we'll create next

// This is the main data-fetching function for the page
async function getChallengeData(challengeId: string, userId?: string) {
  // 1. Fetch the core details of the challenge
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      templateTasks: true, // Include the list of tasks
      _count: {
        select: { enrollments: true }, // Get the number of participants
      },
    },
  });

  if (!challenge) {
    return null; // If no challenge is found, we'll show a 404 page
  }
  
  // 2. If a user is logged in, check if they are already enrolled
  let isEnrolled = false;
  if (userId) {
    const enrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: userId,
          challengeId: challengeId,
        },
      },
    });
    isEnrolled = !!enrollment; // Set to true if an enrollment record exists
  }

  return { challenge, isEnrolled };
}


// The Page component itself
export default async function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const session = await checkRole("USER");
  const userId = session?.user?.id;

  const data = await getChallengeData(params.id, userId);

  // If no challenge data is found, render the Not Found page
  if (!data) {
    notFound();
  }

  const { challenge, isEnrolled } = data;

  // 3. Pass all the fetched data as props to the Client Component
  return (
    <ChallengeDetailView 
      challenge={challenge} 
      isInitiallyEnrolled={isEnrolled}
      isUserLoggedIn={!!userId}
    />
  );
}
