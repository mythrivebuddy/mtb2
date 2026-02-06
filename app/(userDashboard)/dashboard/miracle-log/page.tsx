import { Suspense } from "react";
import MiracleLogClient from "@/components/miracle-log/miracle-log-client";
import { Loader2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { checkFeature } from "@/lib/access-control/checkFeature";

async function getMiracleLogs() {
  const session = await checkRole("USER");
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const logs = await prisma.miracleLog.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
    deletedAt: log.deletedAt?.toISOString() || null,
  }));
}

async function getStreak() {
  const session = await checkRole("USER");
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const streak = await prisma.streak.findUnique({
    where: {
      userId_type: {
        userId: session.user.id,
        type: "MIRACLE_LOG",
      },
    },
    select: {
      miracle_log_count: true,
    },
  });

  return { count: streak?.miracle_log_count || 0 };
}
async function getMiracleLogDailyLimit() {
  const session = await checkRole("USER");
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const featureResult = checkFeature({
    feature: "miracleLog",
    user: session.user,
  });

   if (
    !featureResult.allowed ||
    typeof featureResult.config !== "object"
  ) {
    return {
      dailyLimit: 0,
      isUpgradeFlagShow: false,
    };
  }

  const config = featureResult.config as {
    dailyLimit: number;
    isUpgradeFlagShow?: boolean;
  };

  return {
    dailyLimit: config.dailyLimit,
    isUpgradeFlagShow: config.isUpgradeFlagShow ?? false,
  };
}

export default async function MiracleLogPage() {
  const [logs, streak, miracleLogConfig] = await Promise.all([
    getMiracleLogs(),
    getStreak(),
    getMiracleLogDailyLimit(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your miracle logs...</span>
        </div>
      }
    >
      <MiracleLogClient
        initialLogs={logs}
        initialStreak={streak}
        dailyLimit={miracleLogConfig.dailyLimit}
        isUpgradeFlagShow={miracleLogConfig.isUpgradeFlagShow}
      />
    </Suspense>
  );
}
