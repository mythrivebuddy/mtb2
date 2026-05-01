import { Suspense } from "react";
import ProgressVaultClient from "@/components/progress-vault/progress-vault-client";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { checkFeature } from "@/lib/access-control/checkFeature";
import PageLoader from "@/components/PageLoader";
import { normalizeUserType } from "@/lib/utils/normalizedUserTypes";
import { Session } from "next-auth";

async function getProgressVault(session: Session) {
  const logs = await prisma.progressVault.findMany({
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

async function getProgressVaultDailyLimit(session: Session) {
  const userType = normalizeUserType(session.user.userType);

  const featureResult = await checkFeature({
    feature: "onePercentProgressVault",
    user: {
      userType: userType ?? undefined,
      membership: session.user.membership ?? undefined,
    },
  });

  // ❗ safety check
  if (!featureResult.config || typeof featureResult.config !== "object") {
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
    // 🔥 IMPORTANT: don't tie this to allowed
    isUpgradeFlagShow: config.isUpgradeFlagShow ?? false,
  };
}

async function getStreak(session: Session) {
  const streak = await prisma.streak.findUnique({
    where: {
      userId_type: {
        userId: session.user.id,
        type: "PROGRESS_VAULT",
      },
    },
    select: {
      progress_vault_count: true,
    },
  });

  return { count: streak?.progress_vault_count || 0 };
}

export default async function ProgressVaultPage() {
  const session = await checkRole("USER");
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const [logs, streak, progressVaultConfig] = await Promise.all([
    getProgressVault(session),
    getStreak(session),
    getProgressVaultDailyLimit(session),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <PageLoader />
        </div>
      }
    >
      <ProgressVaultClient
        initialLogs={logs}
        initialStreak={streak}
        dailyLimit={progressVaultConfig.dailyLimit}
        isUpgradeFlagShow={progressVaultConfig.isUpgradeFlagShow}
      />
    </Suspense>
  );
}
