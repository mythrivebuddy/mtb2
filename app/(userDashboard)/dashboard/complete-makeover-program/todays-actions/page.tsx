import TodaysActionsClient from "@/components/complete-makevoer-program/TodaysActions/TodaysActionsClient";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function TodaysActionsPage() {
  // 1. Data Fetching
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return <div>Please log in</div>;
  }

  const userProgramState = await prisma.userProgramState.findFirst({
    where: { userId },
    include: { program: true },
  });

  const startDate = userProgramState?.program?.startDate;

  // 2. DATA PREP: Commitments
  // We fetch these regardless, pass them to client, client decides to show them or the timer
  const rawCommitments = await prisma.userMakeoverCommitment.findMany({
    where: { userId, programId: userProgramState?.program?.id },
    orderBy: { areaId: "asc" },
    include: { area: true },
  });

  const userMakeoverCommitments = rawCommitments
    .filter((c) => c.areaId !== null)
    .map((c) => ({
      id: c.id,
      areaId: c.areaId!,
      areaName: c.area?.name || "Unknown Area",
      areaDescription: c.area?.description || "",
      goalText: c.goalText ?? "No goal set",
      identityText: c.identityText ?? "No identity set",
      actionText: c.actionText ?? "No action set",
      isLocked: c.isLocked,
    }));

  // Pass plain data to the client component
  // Note: We pass startDate as a string or number to avoid serialization issues,
  // or rely on Next.js automatic Date serialization.
  return (
    <TodaysActionsClient
      startDate={startDate || null}
      commitments={userMakeoverCommitments}
    />
  );
}
