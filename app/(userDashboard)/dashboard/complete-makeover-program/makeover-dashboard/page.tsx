/* eslint-disable react/no-unescaped-entities */
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

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
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
  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <DashboardHeader />

        {/* Top Section: Actions & Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TodayActionsCard isProgramStarted={isProgramStarted} />
          <DailyInsightCard />
        </section>

        {/* Global Progress Section */}
        <GlobalProgress />

        {/* Area Snapshots */}
        <AreaSnapshots />

        {/* Bottom Grid: Bonus & Community */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bonus & Rewards */}
          <BonusRewards isProgramStarted={isProgramStarted}/>
          {/* Accountability Pod */}
          <AccountabilityBuddy isProgramStarted={isProgramStarted} />
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
