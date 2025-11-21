// /api/admin/cms
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/requireAdminFromSession";


export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pages = await prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(pages);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    slug,
    content,
    metaTitle,
    metaDescription,
    metaKeywords,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    schemaType,
    schemaMarkup,
    isPublished,
  } = body;

  // Validate slug uniqueness
  const exists = await prisma.page.findUnique({ where: { slug } });
  if (exists)
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });

  const page = await prisma.page.create({
    data: {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      schemaType,
      schemaMarkup,
      isPublished: isPublished ?? false,
      authorId: session.user.id, 
    },
  });

  return NextResponse.json(page);
}
