import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { challengeId: string } }) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Message ID required" }, { status: 400 });

  const message = await prisma.challengeMessage.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return NextResponse.json(message);
}
