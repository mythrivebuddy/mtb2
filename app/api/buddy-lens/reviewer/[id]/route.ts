import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ Access params from context

  const buddyRequest = await prisma.buddyLensRequest.findUnique({
    where: { id },
    include: { review: true },
  });

  if (!buddyRequest || !buddyRequest.review) {
    return NextResponse.json({ message: "Review not found" }, { status: 404 });
  }

  return NextResponse.json(buddyRequest); // Only return the review
}
