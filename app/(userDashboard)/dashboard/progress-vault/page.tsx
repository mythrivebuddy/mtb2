import { Suspense } from "react";
import ProgressVaultClient from "@/components/progress-vault/progress-vault-client";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { checkFeature } from "@/lib/access-control/checkFeature";
import PageLoader from "@/components/PageLoader";

async function getProgressVault() {
  const session = await checkRole("USER");
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

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

async function getProgressVaultDailyLimit() {
  const session = await checkRole("USER");
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const featureResult = checkFeature({
    feature: "onePercentProgressVault",
    user: session.user,
  });

  if (!featureResult.allowed || typeof featureResult.config !== "object") {
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

async function getStreak() {
  const session = await checkRole("USER");
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

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
  const [logs, streak, progressVaultConfig] = await Promise.all([
    getProgressVault(),
    getStreak(),
    getProgressVaultDailyLimit(),
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
