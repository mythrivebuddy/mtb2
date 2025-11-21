// app/api/admin/cms/[id]/route.ts
// [id] -> pageId
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/requireAdminFromSession";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const {id} = await params

  const page = await prisma.page.findUnique({
    where: { id },
  });

  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  return NextResponse.json(page);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {id} = await params

  // If slug is changed — ensure it's still unique
  if (body.slug) {
    const existing = await prisma.page.findUnique({ where: { slug: body.slug } });

    if (existing && existing.id !== params.id) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      ...body,
      authorId: session.user.id, // Last editor stored
    },
  });

  return NextResponse.json(page);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.page.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
