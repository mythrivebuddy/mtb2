-- DropForeignKey
ALTER TABLE "MiracleLog" DROP CONSTRAINT "MiracleLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressVault" DROP CONSTRAINT "ProgressVault_userId_fkey";

-- DropIndex
DROP INDEX "MiracleLog_createdAt_idx";

-- DropIndex
DROP INDEX "MiracleLog_userId_idx";

-- DropIndex
DROP INDEX "ProgressVault_createdAt_idx";

-- DropIndex
DROP INDEX "ProgressVault_userId_idx";

-- AlterTable
ALTER TABLE "MiracleLog" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "jpPointsAssigned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProgressVault" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "jpPointsAssigned" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "MiracleLog" ADD CONSTRAINT "MiracleLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressVault" ADD CONSTRAINT "ProgressVault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
