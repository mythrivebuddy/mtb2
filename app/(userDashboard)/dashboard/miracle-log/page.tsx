import { Suspense } from "react";
import MiracleLogClient from "@/components/miracle-log/miracle-log-client";
import { Loader2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { normalizeUserType } from "@/lib/utils/normalizedUserTypes";
import { Session } from "next-auth";

async function getMiracleLogs(session: Session) {
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

async function getStreak(session: Session) {
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
async function getMiracleLogDailyLimit(session: Session) {
  const userType = normalizeUserType(session.user.userType);

  if (!userType) {
    return {
      dailyLimit: 0,
      isUpgradeFlagShow: false,
    };
  }

  const featureResult = await checkFeature({
    feature: "miracleLog",
    user: {
      userType,
      membership: session.user.membership ?? undefined,
    },
  });

  const config =
    featureResult.config && typeof featureResult.config === "object"
      ? (featureResult.config as {
          dailyLimit: number;
          isUpgradeFlagShow?: boolean;
        })
      : null;

  //! if NOT allowed → show upgrade flag (from admin config)
  if (!featureResult.allowed) {
    return {
      dailyLimit: 0,
      isUpgradeFlagShow: config?.isUpgradeFlagShow ?? true,
    };
  }

  //! if allowed → normal behavior
  return {
    dailyLimit: config?.dailyLimit ?? 0,
    isUpgradeFlagShow: config?.isUpgradeFlagShow ?? false,
  };
}

export default async function MiracleLogPage() {
  const session = await checkRole("USER");

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const [logs, streak, miracleLogConfig] = await Promise.all([
    getMiracleLogs(session),
    getStreak(session),
    getMiracleLogDailyLimit(session),
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
