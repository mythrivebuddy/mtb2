-- CreateEnum
CREATE TYPE "public"."Audience" AS ENUM ('EVERYONE', 'PAID', 'FREE');

-- CreateTable
CREATE TABLE "public"."Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "background_color" TEXT NOT NULL,
    "font_color" TEXT NOT NULL,
    "link_url" TEXT,
    "open_in_new_tab" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "audience" "public"."Audience" NOT NULL,
    "expire_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
