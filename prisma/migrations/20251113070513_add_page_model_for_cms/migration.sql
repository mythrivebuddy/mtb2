-- CreateEnum
CREATE TYPE "public"."PageSchemaType" AS ENUM ('NONE', 'ARTICLE', 'FAQ_PAGE', 'HOW_TO', 'CUSTOM_JSON');

-- CreateTable
CREATE TABLE "public"."Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "schemaType" "public"."PageSchemaType" NOT NULL DEFAULT 'NONE',
    "schemaMarkup" JSONB,
    "authorId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "public"."Page"("slug");
