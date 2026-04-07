-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "brevoUserTypeSynced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInBrevo" BOOLEAN NOT NULL DEFAULT false;
