// /api/pages
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: { slug: string };
}

export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
  });
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role == "ADMIN";
  if (!page) {
    return NextResponse.json({ error: "Not found PAGE" }, { status: 404 });
  }
  if (!page.isPublished && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(page);
}
