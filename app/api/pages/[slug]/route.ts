// /api/pages
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { slug: string };
}

export async function GET(req: Request, { params }: Params) {
  const {slug} = await params;
  const page = await prisma.page.findUnique({
    where: {slug},
  });

  if (!page || !page.isPublished)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(page);
}
