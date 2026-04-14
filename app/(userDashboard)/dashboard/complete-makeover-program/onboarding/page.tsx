import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import MakeoverOnboardingComponent from "@/components/complete-makevoer-program/MakeoverOnboardingComponent";
import { grantProgramAccessToPage } from "@/lib/utils/makeover-program/access/grantProgramAccess";

export const metadata = {
  title: "Makeover Onboarding | Complete Your Setup",
  description:
    "Complete your makeover onboarding to personalize your experience.",
};

export default async function MakeoverOnboardingPage({
  searchParams,
}: {
  searchParams: { planId?: string; step?: string };
}) {
  /* ───────────── AUTH ───────────── */
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const rawQuery = await searchParams;
  const planId = rawQuery.planId;
  const stepParam = rawQuery?.step;
  const isStep6 = stepParam === "6";

  const userId = session.user.id;
  const { isPurchased, programId } = await grantProgramAccessToPage();

  /* ───────────── FETCH PROGRAM (ALWAYS) ───────────── */
  const program = await prisma.program.findFirst({
    where: { slug: "2026-complete-makeover" },
    select: { id: true, startDate: true },
  });

  if (!programId || !program) {
    redirect("/MTB-2026-the-complete-makeover-program");
  }

  /* ───────────── PROGRAM STATE ───────────── */
  const programState = await prisma.userProgramState.findFirst({
    where: { userId, programId: program.id },
    select: {
      onboarded: true,
      program: {
        select: {
          id: true,
          startDate: true,
        },
      },
    },
  });

  /* ───────────── REDIRECT IF ALREADY STARTED ───────────── */
  const programStarted =
    !isStep6 && isPurchased 
    // &&
    // programState?.onboarded &&
    // programState?.program?.startDate &&
    // new Date() >= new Date(programState.program.startDate);

  // if (programStarted) {
  //   redirect("/dashboard/complete-makeover-program/makeover-dashboard");
  // }

  /* ───────────── FORM OPTIONS ───────────── */
  const [areas, goals, identities] = await Promise.all([
    prisma.makeoverArea.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { id: "asc" },
    }),
    prisma.makeoverGoalLibrary.findMany({
      select: { areaId: true, title: true },
    }),
    prisma.makeoverIdentityLibrary.findMany({
      select: { areaId: true, statement: true },
    }),
  ]);

  if (isStep6 && !isPurchased) {
    redirect("/MTB-2026-the-complete-makeover-program");
  }

  const formOptions = { areas, goals, identities };
  if (!program) {
    return (
      <MakeoverOnboardingComponent
        initialData={null}
        formOptions={formOptions}
        isPurchased={isPurchased}
      />
    );
  }

  /* ───────────── NEW USER ───────────── */
  if (!programState) {
    return (
      <MakeoverOnboardingComponent
        initialData={{
          programId: program.id,
          planId,
          onboarded: false,
          selectedAreas: [],
          areaGoals: {},
          identities: {},
          vision: "",
          step: isStep6 && isPurchased ? 6 : 1,
        }}
        formOptions={formOptions}
         isPurchased={isPurchased}
      />
    );
  }

  /* ───────────── EDIT MODE DATA ───────────── */
  const [userAreas, commitments, visionImage] = await Promise.all([
    prisma.userMakeoverArea.findMany({
      where: { userId, programId: program.id },
      select: { areaId: true },
    }),
    prisma.userMakeoverCommitment.findMany({
      where: { userId, programId: program.id },
      select: {
        areaId: true,
        goalText: true,
        identityText: true,
        visionStatement: true,
      },
    }),
    prisma.userVisionImage.findFirst({
      where: { userId, programId: program.id },
    }),
  ]);

  const initialData = {
    programId: program.id,
    onboarded: programState.onboarded,
    selectedAreas: userAreas.map((a) => String(a.areaId)),
    areaGoals: Object.fromEntries(
      commitments.map((c) => [String(c.areaId), c.goalText ?? ""]),
    ),
    identities: Object.fromEntries(
      commitments.map((c) => [String(c.areaId), c.identityText ?? ""]),
    ),
    vision: commitments[0]?.visionStatement ?? "",
    visionImageUrl: visionImage?.imageUrl || "",
    planId,
    step: isStep6 && isPurchased ? 6 : undefined,
  };

  return (
    <MakeoverOnboardingComponent
      initialData={initialData}
      formOptions={formOptions}
       isPurchased={isPurchased}
    />
  );
}
