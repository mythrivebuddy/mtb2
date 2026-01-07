import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/complete-makevoer-program/makeover-dashboard/DashboardHeader";
import TodayActionsCard from "@/components/complete-makevoer-program/makeover-dashboard/TodayActionsCard";
import DailyInsightCard from "@/components/complete-makevoer-program/makeover-dashboard/DailyInsightCard";
import GlobalProgress from "@/components/complete-makevoer-program/makeover-dashboard/GlobalProgress";
import AreaSnapshots from "@/components/complete-makevoer-program/makeover-dashboard/AreaSnapshots";
import BonusRewards from "@/components/complete-makevoer-program/makeover-dashboard/BonusRewards";
import AccountabilityBuddy from "@/components/complete-makevoer-program/makeover-dashboard/AccountabilityBuddy";
import { grantProgramAccessToPage } from "@/lib/utils/makeover-program/access/grantProgramAccess";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const { isPurchased } = await grantProgramAccessToPage();
  if (!isPurchased) {
    redirect("/MTB-2026-the-complete-makeover-program");
  }
  const programState = await prisma.userProgramState.findFirst({
    where: { userId },
    include: {
      program: true,
    },
  });
  if (!programState || !programState?.onboarded) {
    redirect("/dashboard/complete-makeover-program/onboarding");
  }
  let isProgramStarted =
    programState.program?.startDate &&
    programState.program?.startDate <= new Date();
  if (isProgramStarted == null) {
    isProgramStarted = false;
  }
  const rawCommitments = await prisma.userMakeoverCommitment.findMany({
    where: { userId, programId: programState.programId },
    include: { area: { select: { name: true } } },
  });

  const userMakeoverCommitments = rawCommitments
    .filter((c) => c.areaId !== null)
    .map((c) => ({
      id: c.id,
      areaId: c.areaId!, // safe after filter
      areaName: c.area?.name ?? "",
      goalText: c.goalText ?? "",
      identityText: c.identityText ?? "",
      actionText: c.actionText ?? "",
      isLocked: c.isLocked,
    }));
  const makeoverChallenges = await prisma.makeoverAreaChallengeMap.findMany({
    where: { areaId: { in: userMakeoverCommitments.map((c) => c.areaId) } },
    select: {
      id: true,
      areaId: true,
      challengeId: true,
    },
  });
  const challengesByArea = makeoverChallenges.reduce<Record<number, string[]>>(
    (acc, curr) => {
      if (!acc[curr.areaId]) acc[curr.areaId] = [];
      acc[curr.areaId].push(curr.challengeId);
      return acc;
    },
    {}
  );

  const validActionCommitments = rawCommitments.filter(
    (c) => c.actionText !== null
  );

  const hasThreeActions = validActionCommitments.length === 3;

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <DashboardHeader isProgramStarted={isProgramStarted} />

        {/* Top Section: Actions & Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TodayActionsCard
            startDate={programState.program?.startDate}
            hasThreeActions={hasThreeActions}
          />
          <DailyInsightCard />
        </section>

        {/* Global Progress Section */}
        <GlobalProgress />

        {/* Area Snapshots */}
        <AreaSnapshots
          commitments={userMakeoverCommitments}
          challengesByArea={challengesByArea}
        />

        {/* Bottom Grid: Bonus & Community */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bonus & Rewards */}
          <BonusRewards isProgramStarted={isProgramStarted} />
          {/* Accountability Pod */}
          <AccountabilityBuddy isProgramStarted={isProgramStarted} />
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
